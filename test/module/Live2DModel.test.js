import { Live2DModel, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '@';
import { HitAreaFrames } from '@/tools/HitAreaFrames';
import { Application } from '@pixi/app';
import { BatchRenderer, Renderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import merge from 'lodash/merge';
import { PLATFORMS, TEST_MODEL, TEST_MODEL4 } from '../env';
import { addBackground, createApp, draggable } from '../utils';

Application.registerPlugin(TickerPlugin);
Renderer.registerPlugin('batch', BatchRenderer);
Renderer.registerPlugin('interaction', InteractionManager);
Live2DModel.registerTicker(Ticker);

describe('Live2DModel', async () => {
    const platforms = merge({}, PLATFORMS, {
        cubism2: {
            model1: undefined,
            model2: undefined,
            nonScaledWidth: TEST_MODEL.width * (TEST_MODEL.json.layout.width || LOGICAL_WIDTH) / LOGICAL_WIDTH,
            nonScaledHeight: TEST_MODEL.height * (TEST_MODEL.json.layout.height || LOGICAL_HEIGHT) / LOGICAL_HEIGHT,
        },
        cubism4: {
            model1: undefined,
            model2: undefined,
            nonScaledWidth: TEST_MODEL4.width,
            nonScaledHeight: TEST_MODEL4.height,
        },
    });

    let app;

    async function createModel(modelDef, options = {}) {
        const model = await Live2DModel.from(modelDef.file);
        options.app && options.app.stage.addChild(model);
        return model;
    }

    before(async function() {
        window.app = app = createApp(Application);
        app.stage.interactive = true;
        // app.stage.on('pointerup', e => console.log(e.data.global.x, e.data.global.y));

        await platforms.each(async platform => {
            platform.model1 = await createModel(platform.definition, { app });
            platform.model2 = await createModel(platform.definition, { app });
        });

        // at least render the models once, otherwise hit testing will always fail
        // because Live2DModelWebGL#getTransformedPoints will return an array of zeros
        app.render();
    });

    after(function() {
        platforms.each(platform => {
            platform.model1.scale.set(0.5, 0.5);
            platform.model2.scale.set(0.125, 0.125);

            [platform.model1, platform.model2].forEach(model => {
                addBackground(model);
                draggable(app, model);
                model.addChild(new HitAreaFrames());

                model.interaction = platform.definition.interaction;

                // free to play!
                model.on('hit', function(hitAreas) {
                    hitAreas.includes(this.interaction.tap.head) && this.internalModel.motionManager.expressionManager.setRandomExpression();
                    Object.keys(this.interaction.tap).forEach(area => hitAreas.includes(area) && this.internalModel.motionManager.startRandomMotion(this.interaction.tap[area]));
                });
            });
        });

        app.ticker.start();
    });

    platforms.each((platform, name) => {
        describe(name, function() {
            afterEach(() => {
                // reset states
                platform.model1.scale.set(1, 1);
                platform.model1.position.set(0, 0);
                platform.model1.anchor.set(0, 0);
            });

            it('should have correct size', () => {
                expect(platform.model1.internalModel.originalWidth).to.equal(platform.definition.width);
                expect(platform.model1.internalModel.originalHeight).to.equal(platform.definition.height);

                expect(platform.model1.width).to.equal(platform.nonScaledWidth);
                expect(platform.model1.height).to.equal(platform.nonScaledHeight);

                platform.model1.scale.set(10, 0.1);

                expect(platform.model1.width).to.equal(platform.nonScaledWidth * 10);
                expect(platform.model1.height).to.equal(platform.nonScaledHeight * 0.1);
            });

            it('should have correct bounds according to size, position and anchor', () => {
                platform.model1.scale.set(2, 3);
                platform.model1.position.set(200, 300);
                platform.model1.anchor.set(0.2, 0.3);

                const bounds = platform.model1.getBounds();

                // compare approximately because of the float points
                expect(bounds.x).to.be.closeTo(200 - platform.nonScaledWidth * 2 * 0.2, 0.001);
                expect(bounds.y).to.be.closeTo(300 - platform.nonScaledHeight * 3 * 0.3, 0.001);
                expect(bounds.width).to.be.closeTo(platform.nonScaledWidth * 2, 0.001);
                expect(bounds.height).to.be.closeTo(platform.nonScaledHeight * 3, 0.001);
            });

            it('should handle tapping', () => {
                const listener = sinon.spy();

                platform.model1.on('hit', listener);

                platform.model1.tap(-1000, -1000);
                expect(listener).to.not.be.called;

                for (const { hitArea, x, y } of platform.definition.hitTests) {
                    platform.model1.tap(x, y);
                    expect(listener).to.be.calledOnceWith(hitArea);
                    listener.resetHistory();

                    // mimic an InteractionEvent
                    platform.model1.emit('pointertap', { data: { global: { x, y } } });
                    expect(listener).to.be.calledOnceWith(hitArea);
                    listener.resetHistory();
                }
            });
        });
    });

    require('./compat.test');
});
