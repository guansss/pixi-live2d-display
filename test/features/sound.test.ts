import { config } from "@/config";
import { SoundManager } from "@/cubism-common";
import { Cubism4InternalModel, Cubism4ModelSettings } from "@/cubism4";
import { afterEach, beforeEach, expect } from "vitest";
import soundUrl from "../assets/shizuku/sounds/tapBody_00.mp3";
import { TEST_MODEL4, test } from "../env";
import { delay } from "../utils";

beforeEach(() => {
    config.sound = true;
});

afterEach(() => {
    SoundManager.destroy();
});

test("lip sync", async () => {
    const mouthParam = "ParamMouthOpenY";
    const model = new Cubism4InternalModel(
        await TEST_MODEL4.coreModel(),
        new Cubism4ModelSettings(TEST_MODEL4.modelJsonWithUrl),
        { idleMotionGroup: "nonExistent" },
    );

    expect(model.coreModel.getParameterValueById(mouthParam)).toBe(0);

    await expect(model.lipSync.play(soundUrl, { volume: 1 })).resolves.toBe(undefined);

    const audio = model.lipSync.currentAudio!;
    expect(audio).toBeTruthy();

    let prevTime = 0;

    async function seekAndGetParam(time: number) {
        audio.currentTime = time / 1000;
        await delay(100);

        let value = NaN;

        model.once("beforeModelUpdate", () => {
            value = model.coreModel.getParameterValueById(mouthParam);
        });
        model.update(time - prevTime, time);

        prevTime = time;

        return value;
    }

    const timeOffsetBeforeWave = 100;
    const timeOffsetDuringWave = 560;

    await expect(seekAndGetParam(timeOffsetBeforeWave)).resolves.toBe(0);
    await expect(seekAndGetParam(timeOffsetDuringWave)).resolves.toBeGreaterThan(0);
});
