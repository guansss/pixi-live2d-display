import { Application } from '@pixi/app';
import { Renderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { Live2DModel } from '../../src';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../src/live2d/Live2DInternalModel';
import { createApp } from '../utils';
import { TEST_MODEL } from './../env';

Application.registerPlugin(TickerPlugin);
Renderer.registerPlugin('interaction', InteractionManager);
Live2DModel.registerTicker(Ticker);

// model's non-scaled size, taking into account the `layout` defined in model settings
const modelBaseWidth = TEST_MODEL.width * (TEST_MODEL.json.layout.width || LOGICAL_WIDTH) / LOGICAL_WIDTH;
const modelBaseHeight = TEST_MODEL.height * (TEST_MODEL.json.layout.height || LOGICAL_HEIGHT) / LOGICAL_HEIGHT;

describe('Live2DModel', async () => {
    let app;
    let model, model2;

    before(async () => {
        model = await Live2DModel.fromModelSettingsFile(TEST_MODEL.file);

        // test multiple models
        model2 = await Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
        model2.scale.set(0.5, 0.5);

        app = createApp(Application);
        app.stage.addChild(model);
        app.stage.addChild(model2);

        // at least render the models once, otherwise hit testing will always fail
        // because Live2DModelWebGL#getTransformedPoints will return an array of zeros
        app.render();
    });

    after(function() {
        function hitHandler(hitAreas) {
            hitAreas.includes('head') && this.internal.motionManager.expressionManager.setRandomExpression();
            hitAreas.includes('body') && this.internal.motionManager.startRandomMotion('tapBody');
        }

        // free to play!
        model.on('hit', hitHandler);
        model2.on('hit', hitHandler);
    });

    afterEach(() => {
        // reset state
        model.scale.set(1, 1);
        model.position.set(0, 0);
        model.anchor.set(0, 0);
    });

    it('should have correct size', () => {
        expect(model.internal.originalWidth).to.equal(TEST_MODEL.width);
        expect(model.internal.originalHeight).to.equal(TEST_MODEL.height);

        expect(model.width).to.equal(modelBaseWidth);
        expect(model.height).to.equal(modelBaseHeight);

        model.scale.set(10, 0.1);

        expect(model.width).to.equal(modelBaseWidth * 10);
        expect(model.height).to.equal(modelBaseHeight * 0.1);
    });

    it('should have correct bounds according to size, position and anchor', () => {
        model.scale.set(2, 3);
        model.position.set(200, 300);
        model.anchor.set(0.2, 0.3);

        const bounds = model.getBounds();

        expect(bounds.x).to.equal(200 - modelBaseWidth * 2 * 0.2);
        expect(bounds.y).to.equal(300 - modelBaseHeight * 3 * 0.3);
        expect(bounds.width).to.equal(modelBaseWidth * 2);
        expect(bounds.height).to.equal(modelBaseHeight * 3);
    });

    it('should handle tapping', () => {
        const listener = sinon.spy();

        model.on('hit', listener);

        model.tap(-1000, -1000);
        expect(listener).to.not.be.called;

        for (const { hitArea, x, y } of TEST_MODEL.hitTests) {
            model.tap(x, y);
            expect(listener).to.be.calledWith(hitArea);
            listener.resetHistory();

            // mimic an InteractionEvent
            model.emit('pointertap', { data: { global: { x, y } } });
            expect(listener).to.be.calledWith(hitArea);
            listener.resetHistory();
        }
    });

    it('should work after losing and restoring WebGL context', function(done) {
        setTimeout(() => {
            console.warn('WebGL lose context');
            const ext = app.renderer.gl.getExtension('WEBGL_lose_context');
            ext.loseContext();

            setTimeout(() => {
                console.warn('WebGL restore context');
                ext.restoreContext();

                setTimeout(() => {
                    expect(() => app.render()).to.not.throw();

                    done();
                }, 100);
            }, 100);
        }, 200);
    });
});
