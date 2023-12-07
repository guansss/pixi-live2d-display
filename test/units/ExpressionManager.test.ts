import { config } from "@/config";
import { Cubism4ModelSettings } from "@/cubism4/Cubism4ModelSettings";
import "@/factory";
import { expect, vi } from "vitest";
import { Cubism4ExpressionManager } from "../../src";
import expJson from "../assets/haru/expressions/F01.exp3.json";
import { TEST_MODEL4, test } from "../env";

test("updates parameters", async ({ timer }) => {
    const epsilon = 1e-5;
    const coreModel = await TEST_MODEL4.coreModel();
    const expManager = new Cubism4ExpressionManager(
        new Cubism4ModelSettings(TEST_MODEL4.modelJsonWithUrl),
    );
    const expParamId = expJson.Parameters[0]!.Id;
    const expParamValue = expJson.Parameters[0]!.Value;

    await expManager.setExpression("f00");
    expManager.update(coreModel, performance.now());
    expect(coreModel.getParameterValueById(expParamId)).to.not.closeTo(expParamValue, epsilon);

    vi.advanceTimersByTime(config.expressionFadingDuration);

    const updated = expManager.update(coreModel, performance.now());
    expect(updated).to.be.true;
    expect(coreModel.getParameterValueById(expParamId)).to.closeTo(expParamValue, epsilon);
});
