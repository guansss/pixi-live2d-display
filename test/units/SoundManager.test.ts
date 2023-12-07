import { beforeAll, expect, vi } from "vitest";
import { config } from "../../src/config";
import { SoundManager } from "../../src/cubism-common/SoundManager";
import { TEST_SOUND, test } from "../env";
import { overrideValue } from "../utils";

beforeAll(() => {
    // FIXME: audio.play() does not work, try adding "--autoplay-policy=no-user-gesture-required"
    // to the browser options when Vitest support it
    overrideValue(HTMLAudioElement.prototype, "play", (original) => {
        return function () {
            return Promise.resolve();
        };
    });
});

test("plays sound", async () => {
    let onFinish!: () => void;
    let onError!: (e: unknown) => void;
    const playback = new Promise<void>((resolve, reject) => {
        onFinish = resolve;
        onError = reject;
    });

    const audio = SoundManager.add(TEST_SOUND, onFinish, onError);

    expect(audio, "added to the audios array").to.be.oneOf(SoundManager.audios);

    await SoundManager.play(audio).then(() => {
        expect(audio.readyState, "ready to play").to.gte(audio.HAVE_ENOUGH_DATA);

        // seek to the end so we don't have to wait for the playback
        audio.currentTime = audio.duration;
    });

    await playback;

    expect(audio, "removed from the audios array when finished").to.not.be.oneOf(
        SoundManager.audios,
    );
});

test("handles error when trying to play sound", async () => {
    config.logLevel = config.LOG_LEVEL_NONE;

    const playback = new Promise<void>((resolve, reject) => {
        const audio = SoundManager.add(TEST_SOUND, resolve, reject);

        vi.spyOn(audio, "play").mockImplementation(() =>
            Promise.reject<void>(new Error("expected error")),
        );

        expect(SoundManager.play(audio)).rejects.toThrow("expected error");
    });

    await expect(playback).rejects.toThrow("expected error");
});

test("should destroy", async () => {
    const audios = [SoundManager.add(TEST_SOUND), SoundManager.add(TEST_SOUND)];

    await Promise.all(audios.map((audio) => SoundManager.play(audio)));

    SoundManager.destroy();
    expect(SoundManager.audios).to.be.empty;

    audios.forEach((audio) => {
        expect(audio).toHaveProperty("paused", true);
    });
});
