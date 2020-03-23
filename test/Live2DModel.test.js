import { Live2DModel } from '../src';
import { TickerPlugin } from '@pixi/ticker';
import { Application } from '@pixi/app';
import assert from 'assert';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../src/live2d/Live2DInternalModel';

Application.registerPlugin(TickerPlugin);

const app = new Application({
    autoStart: true,
    width: 100,
    height: 100,
});

describe('Live2DModel', async () => {
    /** @type {Live2DModel} */
    let model;

    before(async () => {
        model = await Live2DModel.fromModelSettingsFile('test/assets/shizuku/shizuku.model.json');
        app.stage.addChild(model);
    });

    after(() => {
        model.destroy();
    });

    it('should have correct size', () => {
        assert.equal(model.internal.originalWidth, 1280);
        assert.equal(model.internal.originalHeight, 1380);

        const modelWidth = model.internal.originalWidth * (model.internal.modelSettings.layout.width || LOGICAL_WIDTH) / LOGICAL_WIDTH;
        const modelHeight = model.internal.originalHeight * (model.internal.modelSettings.layout.height || LOGICAL_HEIGHT) / LOGICAL_HEIGHT;

        assert.equal(model.width, modelWidth);
        assert.equal(model.height, modelHeight);

        model.scale.set(10, 0.1);

        assert.equal(model.width, modelWidth * 10);
        assert.equal(model.height, modelHeight * 0.1);

        model.scale.set(1, 1);
    });
});
