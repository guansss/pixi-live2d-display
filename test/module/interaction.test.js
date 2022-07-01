import { RUNTIMES, TEST_MODEL } from '../env';
import { createApp, createModel } from '../utils';
import { Application } from '@pixi/app';
import { merge } from 'lodash-es';

describe('Interactions', function() {
    let app;

    const runtimes = merge({}, RUNTIMES, {
        cubism2: { model: undefined },
        cubism4: { model: undefined },
    });

    before(async function() {
        app = createApp(Application, false);

        await runtimes.each(async runtime => {
            runtime.model = await createModel(runtime.definition, { app });
        });
    });

    afterEach(function() {
        app.stage.removeChildren();
    });

    describe('should handle tapping', function() {
        before(function() {
            // at least render the models once, otherwise hit-testing will always fail
            // because Live2DModelWebGL#getTransformedPoints will return an array of zeros
            app.render();
        });

        runtimes.each((runtime, name) => {
            it(name, async function() {
                const listener = sinon.spy();

                runtime.model.on('hit', listener);

                runtime.model.tap(-1000, -1000);
                expect(listener).to.not.be.called;

                for (const { hitArea, x, y } of runtime.definition.hitTests) {
                    runtime.model.tap(x, y);
                    expect(listener).to.be.calledOnceWith(hitArea);
                    listener.resetHistory();

                    // mimic an InteractionEvent
                    runtime.model.emit('pointertap', { data: { global: { x, y } } });
                    expect(listener).to.be.calledOnceWith(hitArea);
                    listener.resetHistory();
                }
            });
        });
    });

    it('should not unregister other models\' listeners when destroying a model', async function() {
        const model1 = await createModel(TEST_MODEL);
        const model2 = await createModel(TEST_MODEL);

        app.stage.addChild(model1, model2);
        app.render();

        app.stage.removeChild(model1);
        model1.destroy();

        const focusStub = sinon.stub(model2, 'focus');

        // mimic an InteractionEvent
        app.renderer.plugins.interaction.emit('pointermove', { data: { global: { x: 0, y: 0 } } });

        expect(focusStub).to.be.called;
    });
});
