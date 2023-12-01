import { Cubism2InternalModel, Cubism2ModelSettings } from "@/cubism2";
import { Cubism4InternalModel, Cubism4ModelSettings } from "@/cubism4";
import { expect, test, vi } from "vitest";
import type { Cubism2Spec } from "../../src/csm2";
import type { CubismSpec } from "../../src/csm4";
import { MotionPreloadStrategy } from "../../src/cubism-common";
import { TEST_MODEL2, TEST_MODEL4, testEachModel } from "../env";

async function createModel(
    testModel: typeof TEST_MODEL2 | typeof TEST_MODEL4,
    overrideJson?: Partial<CubismSpec.ModelJSON | Cubism2Spec.ModelJSON>,
) {
    if (testModel === TEST_MODEL2) {
        return new Cubism2InternalModel(
            await TEST_MODEL2.coreModel(),
            new Cubism2ModelSettings({ ...TEST_MODEL2.modelJson, url: "foo", ...overrideJson }),
            { motionPreload: MotionPreloadStrategy.NONE },
        );
    } else {
        return new Cubism4InternalModel(
            await TEST_MODEL4.coreModel(),
            new Cubism4ModelSettings({ ...TEST_MODEL4.modelJson, url: "foo", ...overrideJson }),
            { motionPreload: MotionPreloadStrategy.NONE },
        );
    }
}

testEachModel("emits events during update", async ({ model: testModel }) => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl")!;
    const model = await createModel(testModel);

    model.updateWebGLContext(gl, 0);

    const beforeMotionUpdate = vi.fn();
    const afterMotionUpdate = vi.fn();
    const beforeModelUpdate = vi.fn();

    model.on("beforeMotionUpdate", beforeMotionUpdate);
    model.on("afterMotionUpdate", afterMotionUpdate);
    model.on("beforeModelUpdate", beforeModelUpdate);

    model.update(1000 / 60, performance.now());

    expect(beforeMotionUpdate).to.toHaveBeenCalled();
    expect(afterMotionUpdate).to.toHaveBeenCalled();
    expect(beforeModelUpdate).to.toHaveBeenCalled();
});

test("reads layout from settings", async () => {
    const model2 = (await createModel(TEST_MODEL2, {
        layout: {
            center_x: 0,
            y: 1,
            width: 2,
        },
    })) as Cubism2InternalModel;

    expect(model2["getLayout"]()).to.eql({
        centerX: 0,
        y: 1,
        width: 2,
    });

    const model4 = (await createModel(TEST_MODEL4, {
        Layout: {
            CenterX: 0,
            Y: 1,
            Width: 2,
        },
    })) as Cubism4InternalModel;

    expect(model4["getLayout"]()).to.eql({
        centerX: 0,
        y: 1,
        width: 2,
    });
});

testEachModel("provides access to drawables", async ({ model: testModel }) => {
    const model = await createModel(testModel);
    const drawableIDs = model.getDrawableIDs();

    expect(drawableIDs.length).to.be.greaterThan(10);
    expect(model.getDrawableIndex(drawableIDs[1]!)).to.equal(1);
    expect(model.getDrawableVertices(0).length).to.be.greaterThan(0);
});
