import { expect, vi } from "vitest";
import type { Live2DModelEvents } from "../../src";
import { Cubism2ModelSettings, Cubism4ModelSettings, Live2DModel, config } from "../../src";
import { TEST_MODEL2, TEST_MODEL4, test } from "../env";
import { defaultOptions } from "../utils";

test("creates Live2DModel", async () => {
    await Promise.all(
        [
            TEST_MODEL2.modelJsonUrl,
            TEST_MODEL2.modelJsonWithUrl,
            new Cubism2ModelSettings(TEST_MODEL2.modelJsonWithUrl),

            TEST_MODEL4.modelJsonUrl,
            TEST_MODEL4.modelJsonWithUrl,
            new Cubism4ModelSettings(TEST_MODEL4.modelJsonWithUrl),
        ].map(async (src) => {
            await expect(Live2DModel.from(src, defaultOptions())).resolves.toBeInstanceOf(
                Live2DModel,
            );
        }),
    );
});

test("creates subclassed Live2DModel", async () => {
    class SubLive2DModel extends Live2DModel {}

    const model = SubLive2DModel.from(TEST_MODEL2.modelJsonWithUrl, defaultOptions());

    await expect(model).resolves.toBeInstanceOf(SubLive2DModel);
});

test("handles error while creating Liv2DModel", async () => {
    config.logLevel = config.LOG_LEVEL_ERROR;

    const creation = Live2DModel.from("badURL", defaultOptions());

    await expect(creation).rejects.toThrow();

    await expect(() =>
        Live2DModel.from(
            { ...TEST_MODEL2.modelJsonWithUrl, textures: ["badTexture"] },
            defaultOptions(),
        ),
    ).rejects.toThrow();
});

test("creates Live2DModel from a URL without .json extension", async ({ loaderMock }) => {
    const fakeURL = TEST_MODEL2.modelJsonUrl.replace(".json", "");
    expect(fakeURL).not.toEqual(TEST_MODEL2.modelJsonUrl);

    loaderMock.rewrite((url) => url.replace(fakeURL, TEST_MODEL2.modelJsonUrl));

    await expect(Live2DModel.from(fakeURL, defaultOptions())).resolves.toBeInstanceOf(Live2DModel);
});

test("emits events during sync creation", async () => {
    const options = defaultOptions();
    const creation = new Promise<void>((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });

    const listeners: Record<Exclude<keyof Live2DModelEvents, "hit">, () => void> = {
        settingsJSONLoaded: vi.fn().mockName("settingsJSONLoaded"),
        settingsLoaded: vi.fn().mockName("settingsLoaded"),
        textureLoaded: vi.fn().mockName("textureLoaded"),
        modelLoaded: vi.fn().mockName("modelLoaded"),
        poseLoaded: vi.fn().mockName("poseLoaded"),
        physicsLoaded: vi.fn().mockName("physicsLoaded"),
        ready: vi.fn().mockName("ready"),
        load: vi.fn().mockName("load"),
    };

    const model = Live2DModel.fromSync(TEST_MODEL2.modelJsonUrl, options);

    Object.entries(listeners).forEach(([event, listener]) => {
        model.on(event, listener);
    });

    await creation;

    Object.entries(listeners).forEach(([event, listener]) => {
        expect(listener).toHaveBeenCalledOnce();
    });
});

test("renders correctly when emitting ready during sync creation", async ({ app }) => {
    const options = defaultOptions();
    const creation = new Promise<void>((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });

    const model = Live2DModel.fromSync(TEST_MODEL2.modelJsonUrl, options);

    expect(model).to.be.instanceOf(Live2DModel);

    const onReady = vi.fn(() => {
        expect(() => {
            app.stage.addChild(model);
            model.update(100);
            app.render();
        }).not.toThrow();
    });

    const onLoad = vi.fn(() => {
        expect(() => app.render()).not.toThrow();
    });

    model.on("ready", onReady).on("load", onLoad);

    await creation;

    expect(onReady).toHaveBeenCalledOnce();
    expect(onLoad).toHaveBeenCalledOnce();
});

test("emits error during sync creation", async () => {
    config.logLevel = config.LOG_LEVEL_ERROR;

    const options = defaultOptions();
    const creation = new Promise<void>((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });

    Live2DModel.fromSync({ ...TEST_MODEL2.modelJsonWithUrl, model: "badModel" }, options);

    await expect(creation).rejects.toThrow();
});

test("emits texture error during sync creation", async () => {
    config.logLevel = config.LOG_LEVEL_ERROR;

    const options = defaultOptions();
    const creation = new Promise<void>((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });

    Live2DModel.fromSync({ ...TEST_MODEL2.modelJsonWithUrl, textures: ["badTexture"] }, options);

    await expect(creation).rejects.toThrow();
});
