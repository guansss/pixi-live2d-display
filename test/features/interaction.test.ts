import type { Application } from "pixi.js";
import { expect, vi } from "vitest";
import { testEachModel } from "../env";
import { createModel } from "../utils";

// simulates a pointertap event, copied from the tests in @pixi/event
function tap(app: Application, x: number, y: number) {
    app.renderer.events["onPointerDown"](
        new PointerEvent("pointerdown", { clientX: x, clientY: y }),
    );

    const e = new PointerEvent("pointerup", { clientX: x, clientY: y });
    // so it isn't a pointerupoutside
    Object.defineProperty(e, "target", {
        writable: false,
        value: app.view,
    });
    app.renderer.events["onPointerUp"](e);
}

testEachModel("handles tapping", async ({ app, model: { modelJsonWithUrl, hitTests } }) => {
    const model = await createModel(modelJsonWithUrl);
    model.update(100);
    app.stage.addChild(model);
    app.renderer.resize(model.width, model.height);
    app.render();

    const onHit = vi.fn();
    model.on("hit", onHit);

    model.tap(-1000, -1000);
    expect(onHit).not.toHaveBeenCalled();

    tap(app, 100, 100);
    for (const { hitArea, x, y } of hitTests) {
        model.tap(x, y);
        expect(onHit).toHaveBeenCalledWith(hitArea);
        onHit.mockClear();

        tap(app, x, y);
        expect(onHit).toHaveBeenCalledWith(hitArea);
        onHit.mockClear();
    }
});
