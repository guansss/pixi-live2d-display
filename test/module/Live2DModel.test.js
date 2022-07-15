import { InternalModel, Live2DModel, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '@';
import { HitAreaFrames } from '@/tools/HitAreaFrames';
import { Application } from '@pixi/app';
import { BatchRenderer, Renderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { merge } from 'lodash-es';
import { RUNTIMES, TEST_MODEL, TEST_MODEL4 } from '../env';
import { addBackground, callBefore, createApp, createModel, draggable } from '../utils';

Application.registerPlugin(TickerPlugin);
Renderer.registerPlugin('batch', BatchRenderer);
Renderer.registerPlugin('interaction', InteractionManager);
Live2DModel.registerTicker(Ticker);

describe('Live2DModel', async function() {
    this.timeout(5000);

    window.runtimes = merge({}, RUNTIMES, {
        cubism2: {
            model1: undefined,
            model2: undefined,
            nonScaledWidth: TEST_MODEL.width * (TEST_MODEL.json.layout && TEST_MODEL.json.layout.width || LOGICAL_WIDTH) / LOGICAL_WIDTH,
            nonScaledHeight: TEST_MODEL.height * (TEST_MODEL.json.layout && TEST_MODEL.json.layout.height || LOGICAL_HEIGHT) / LOGICAL_HEIGHT,
        },
        cubism4: {
            model1: undefined,
            model2: undefined,
            nonScaledWidth: TEST_MODEL4.width * (TEST_MODEL4.json.Layout && TEST_MODEL4.json.Layout.Width || LOGICAL_WIDTH) / LOGICAL_WIDTH,
            nonScaledHeight: TEST_MODEL4.height * (TEST_MODEL4.json.Layout && TEST_MODEL4.json.Layout.Height || LOGICAL_HEIGHT) / LOGICAL_HEIGHT,
        },
    });

    callBefore(InternalModel.prototype, 'init', function() {
        runtimes.each(runtime => {
            const modelDef = runtime.definition;
            if (this.settings.url === modelDef.file) {
                this.settings.layout = modelDef.layout || modelDef.Layout;
            }
        });
    });

    let app;

    before(async function() {
        window.app = app = createApp(Application);
        app.stage.sortableChildren = true;
        // app.stage.on('pointerup', e => console.log(e.data.global.x, e.data.global.y));

        let modelLayer = 0;

        await runtimes.each(async runtime => {
            runtime.model1 = await createModel(runtime.definition, { app, zIndex: modelLayer-- });
            runtime.model2 = await createModel(runtime.definition, { app, zIndex: runtime.model1.zIndex + 1 });
        });
    });

    after(function() {
        runtimes.each(runtime => {
            runtime.model1.scale.set(0.5, 0.5);
            runtime.model2.scale.set(0.125, 0.125);

            runtime.model2.anchor.set(1, 0);
            runtime.model2.rotation = Math.PI * 3 / 2;

            [runtime.model1, runtime.model2].forEach(model => {
                addBackground(model);
                draggable(model);
                model.addChild(new HitAreaFrames());

                model.interaction = runtime.definition.interaction;

                // free to play!
                model.on('hit', function(hitAreas) {
                    hitAreas.includes(this.interaction.exp) && this.internalModel.motionManager.expressionManager?.setRandomExpression();
                    Object.keys(this.interaction.motion).forEach(area => hitAreas.includes(area) && this.internalModel.motionManager.startRandomMotion(this.interaction.motion[area]));
                });
            });
        });

        runtimes.cubism4.model1.x = 550;
        runtimes.cubism4.model2.x = runtimes.cubism2.model1.width;

        app.start();
    });

    runtimes.each((runtime, name) => {
        describe(name, function() {
            afterEach(() => {
                // reset states
                runtime.model1.scale.set(1, 1);
                runtime.model1.position.set(0, 0);
                runtime.model1.anchor.set(0, 0);
            });

            it('should have correct size', () => {
                expect(runtime.model1.internalModel.originalWidth).to.equal(runtime.definition.width);
                expect(runtime.model1.internalModel.originalHeight).to.equal(runtime.definition.height);

                expect(runtime.model1.width).to.equal(runtime.nonScaledWidth);
                expect(runtime.model1.height).to.equal(runtime.nonScaledHeight);

                runtime.model1.scale.set(10, 0.1);

                expect(runtime.model1.width).to.equal(runtime.nonScaledWidth * 10);
                expect(runtime.model1.height).to.equal(runtime.nonScaledHeight * 0.1);
            });

            it('should have correct bounds according to size, position and anchor', () => {
                runtime.model1.scale.set(2, 3);
                runtime.model1.position.set(200, 300);
                runtime.model1.anchor.set(0.2, 0.3);

                const bounds = runtime.model1.getBounds();

                // compare approximately because of the float points
                expect(bounds.x).to.be.closeTo(200 - runtime.nonScaledWidth * 2 * 0.2, 0.001);
                expect(bounds.y).to.be.closeTo(300 - runtime.nonScaledHeight * 3 * 0.3, 0.001);
                expect(bounds.width).to.be.closeTo(runtime.nonScaledWidth * 2, 0.001);
                expect(bounds.height).to.be.closeTo(runtime.nonScaledHeight * 3, 0.001);
            });
        });
    });

    it('should handle GCed textures', function() {
        app.render();

        // all textures would be destroyed
        app.renderer.textureGC.count = 100000;
        app.renderer.textureGC.run();

        app.render();
    });

    await import('./compat.test');
});
