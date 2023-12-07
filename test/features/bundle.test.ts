import { beforeAll, describe, expect, test } from "vitest";
import bundleExtraUrl from "../../dist/extra.min.js?url";
import bundleIndexUrl from "../../dist/index.min.js?url";
import pixiBundleUrl from "../../node_modules/pixi.js/dist/pixi.min.js?url";
import { addAllModels, loadScript } from "../utils";

describe("works when bundled", async () => {
    beforeAll(async () => {
        await loadScript(pixiBundleUrl);
        await loadScript(bundleIndexUrl);
        await loadScript(bundleExtraUrl);
    });

    test("basic usage", async () => {
        if (!PIXI) {
            throw new Error("PIXI is not defined");
        }

        const app = new PIXI.Application({
            width: 512,
            height: 512,
            autoStart: false,
            autoDensity: true,
        });

        await addAllModels(app, { Class: PIXI.live2d.Live2DModel });
        app.render();
        await expect(app).toMatchImageSnapshot();
    });

    test("HitAreaFrames", async () => {
        if (!PIXI) {
            throw new Error("PIXI is not defined");
        }

        const app = new PIXI.Application({
            width: 512,
            height: 512,
            autoStart: false,
            autoDensity: true,
        });

        const models = await addAllModels(app, { Class: PIXI.live2d.Live2DModel });

        for (const model of models) {
            const hitAreaFrames = new PIXI.live2d.HitAreaFrames();
            model.addChild(hitAreaFrames);
        }

        app.render();
        await expect(app).toMatchImageSnapshot();
    });
});
