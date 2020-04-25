import { Texture } from '@pixi/core';
import { resolve as urlResolve } from 'url';
import { Live2DModel, ModelSettings } from '../../src';
import { TEST_MODEL } from '../env';
import { remoteRequire } from '../utils';

describe('Factory', () => {
    it('should load Live2DModel', async () => {
        await expect(Live2DModel.fromModelSettingsFile(TEST_MODEL.file))
            .to.eventually.be.instanceOf(Live2DModel);

        await expect(Live2DModel.fromModelSettingsJSON(TEST_MODEL.json, TEST_MODEL.file))
            .to.eventually.be.instanceOf(Live2DModel);

        await expect(Live2DModel.fromModelSettings(new ModelSettings(TEST_MODEL.json, TEST_MODEL.file)))
            .to.eventually.be.instanceOf(Live2DModel);

        expect(Live2DModel.fromResources({
            settings: new ModelSettings(TEST_MODEL.json, TEST_MODEL.file),
            modelData: TEST_MODEL.modelData,
            textures: TEST_MODEL.json.textures.map(() => Texture.WHITE),
            pose: TEST_MODEL.json.pose && remoteRequire(urlResolve(TEST_MODEL.file, TEST_MODEL.json.pose)),
            physics: TEST_MODEL.json.physics && remoteRequire(urlResolve(TEST_MODEL.file, TEST_MODEL.json.physics)),
        }))
            .to.be.instanceOf(Live2DModel);
    });

    it('should load derived Live2DModel', async () => {
        class DerivedLive2DModel extends Live2DModel {}

        await expect(DerivedLive2DModel.fromModelSettingsFile(TEST_MODEL.file))
            .to.eventually.be.instanceOf(DerivedLive2DModel).and.instanceOf(Live2DModel);
    });
});
