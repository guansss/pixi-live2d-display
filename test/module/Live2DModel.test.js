import { Application } from '@pixi/app';
import { TickerPlugin } from '@pixi/ticker';
import assert from 'assert';
import sinon from 'sinon';
import { resolve as urlResolve } from 'url';
import { Live2DModel } from '../../src';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../src/live2d/Live2DInternalModel';
import { TEST_MODEL } from './../env';
import { loadArrayBuffer, remoteRequire } from './../utils';

Application.registerPlugin(TickerPlugin);

const app = new Application({
    width: 1000,
    height: 1000,
    autoStart: true,
});
document.body.appendChild(app.view);

describe('Live2DModel', async () => {
    /** @type {Live2DModel} */
    let model, model2;
    let modelBaseWidth, modelBaseHeight;

    before(async () => {
        model = await Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
        modelBaseWidth = model.internal.originalWidth * (model.internal.modelSettings.layout.width || LOGICAL_WIDTH) / LOGICAL_WIDTH;
        modelBaseHeight = model.internal.originalHeight * (model.internal.modelSettings.layout.height || LOGICAL_HEIGHT) / LOGICAL_HEIGHT;

        // testing multiple models
        model2 = await Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
        model2.scale.set(0.5, 0.5);

        app.stage.addChild(model);
        app.stage.addChild(model2);

        app.ticker.add(function() {
            model.update(app.ticker.deltaMS);
            model2.update(app.ticker.deltaMS);
        });
    });

    beforeEach(() => {
        // reset state
        model.scale.set(1, 1);
        model.position.set(0, 0);
        model.anchor.set(0, 0);
    });

    it('should have correct size', () => {
        assert.equal(model.internal.originalWidth, TEST_MODEL.width);
        assert.equal(model.internal.originalHeight, TEST_MODEL.height);

        assert.equal(model.width, modelBaseWidth);
        assert.equal(model.height, modelBaseHeight);

        model.scale.set(10, 0.1);

        assert.equal(model.width, modelBaseWidth * 10);
        assert.equal(model.height, modelBaseHeight * 0.1);
    });

    it('should have correct bounds according to size, position and anchor', () => {
        model.scale.set(2, 3);
        model.position.set(200, 300);
        model.anchor.set(0.2, 0.3);

        const bounds = model.getBounds();

        assert.equal(bounds.x, 200 - modelBaseWidth * 2 * 0.2);
        assert.equal(bounds.y, 300 - modelBaseHeight * 3 * 0.3);
        assert.equal(bounds.width, modelBaseWidth * 2);
        assert.equal(bounds.height, modelBaseHeight * 3);
    });

    it('should handle tapping', () => {
        const listener = sinon.spy();

        model.on('hit', listener);

        model.tap(-1, -1);
        sinon.assert.notCalled(listener);

        for (const { name, x, y } of TEST_MODEL.hitAreas) {
            model.tap(x, y);
            sinon.assert.calledWith(listener, name);
            listener.resetHistory();

            // mimic an InteractionEvent
            model.emit('tap', { data: { global: { x, y } } });
            sinon.assert.calledWith(listener, name);
            listener.resetHistory();
        }
    });

    it('should work after losing and restoring WebGL context', function(done) {
        const ext = app.renderer.gl.getExtension('WEBGL_lose_context');
        ext.loseContext();

        setTimeout(() => {
            ext.restoreContext();
            done();
        }, 100);
    });
});

describe('Live2DModel loading variants', () => {
    const json = remoteRequire(TEST_MODEL.file);

    it('should load Live2DModel', async () => {
        let model = await Live2DModel.fromModelSettingsJSON(json, TEST_MODEL.file);

        assert(model, 'fromModelSettingsJSON');

        const settings = model.internal.modelSettings;

        model = await Live2DModel.fromModelSettings(settings);

        assert(model, 'fromModelSettings');

        model = Live2DModel.fromResources({
            settings,
            model: await loadArrayBuffer(urlResolve(TEST_MODEL.file, settings.model)),
            textures: model.textures,
            pose: settings.pose && urlResolve(TEST_MODEL.file, settings.pose),
            physics: settings.physics && urlResolve(TEST_MODEL.file, settings.physics),
        });

        assert(model, 'fromResources');
    });
});
