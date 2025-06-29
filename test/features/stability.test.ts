import { testEachModel } from "../env";
import { createModel } from "../utils";
import { makeTestSound } from "../make-test-sound";

const times = 500;

testEachModel(
    `speak ${times} times`,
    async ({ app, model: { modelJsonWithUrl, hitTests } }) => {
        const model = await createModel(modelJsonWithUrl);
        model.update(100);
        app.stage.addChild(model);
        app.renderer.resize(model.width, model.height);
        app.render();
        for (let i = 0; i < times; i++) {
            await new Promise<void>((resolve, reject) => {
                const duration = Math.random() * 0.01;
                model.speak(makeTestSound(undefined, 0.1, duration), {
                    onFinish: resolve,
                    onError: reject,
                });
            });
        }
    },
    2 * 60 * 1000,
);
