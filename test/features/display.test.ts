import type { CubismSpec } from "@cubism/CubismSpec";
import { mapKeys } from "lodash-es";
import { expect } from "vitest";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../../src";
import type { Cubism2Spec } from "../../src/types/Cubism2Spec";
import { testEachModel } from "../env";
import { createModel } from "../utils";

testEachModel("has correct size", async ({ model: { modelJsonUrl, width, height } }) => {
    const model = await createModel(modelJsonUrl);

    expect(model.width).to.equal(width);
    expect(model.height).to.equal(height);

    model.scale.set(10, 0.1);

    expect(model.width).to.equal(width * 10);
    expect(model.height).to.equal(height * 0.1);

    expect(model.internalModel.originalWidth).to.equal(width);
    expect(model.internalModel.originalHeight).to.equal(height);
});

testEachModel(
    "respects transformations and layout",
    async ({ model: { cubismVersion, modelJsonUrl, width, height } }) => {
        const LAYOUT = Object.freeze({
            width: 2,
            height: 3,
            centerX: 4,
            centerY: 5,
            // ... the rest are not tested because they behave so strangely and I'm just YOLOing it
        }) satisfies Cubism2Spec.Layout;

        const model = await createModel(modelJsonUrl, {
            listeners: {
                settingsJSONLoaded(json) {
                    if (cubismVersion === 2) {
                        (json as Cubism2Spec.ModelJSON).layout = LAYOUT;
                    } else if (cubismVersion === 4) {
                        (json as CubismSpec.ModelJSON).Layout = mapKeys(
                            LAYOUT,
                            (v, k) => k.charAt(0).toLowerCase() + k.slice(1),
                        );
                    }
                },
            },
        });

        const layoutScaleX = LAYOUT.width / LOGICAL_WIDTH;
        const layoutScaleY = LAYOUT.height / LOGICAL_HEIGHT;

        const initialBounds = model.getBounds();

        expect(initialBounds.x).to.equal(0);
        expect(initialBounds.y).to.equal(0);
        expect(initialBounds.width).to.equal(width * layoutScaleX);
        expect(initialBounds.height).to.equal(height * layoutScaleY);

        const TRANSFORM = Object.freeze({
            x: 1,
            y: 2,
            scaleX: 3,
            scaleY: 4,
            anchorX: 5,
            anchorY: 6,
            // rotation: 7,
        });

        model.position.set(TRANSFORM.x, TRANSFORM.y);
        model.scale.set(TRANSFORM.scaleX, TRANSFORM.scaleY);
        model.anchor.set(TRANSFORM.anchorX, TRANSFORM.anchorY);

        const bounds = model.getBounds();

        expect(bounds.x).to.equal(
            TRANSFORM.x - width * layoutScaleX * TRANSFORM.scaleX * TRANSFORM.anchorX,
        );
        expect(bounds.y).to.equal(
            TRANSFORM.y - height * layoutScaleY * TRANSFORM.scaleY * TRANSFORM.anchorY,
        );
        expect(bounds.width).to.equal(width * layoutScaleX * TRANSFORM.scaleX);
        expect(bounds.height).to.equal(height * layoutScaleY * TRANSFORM.scaleY);
    },
);
