import { Cubism2ModelSettings, Cubism4ModelSettings, Live2DModel, MOTION_PRELOAD_NONE } from '@';
import { TEST_MODEL, TEST_MODEL4 } from '../env';

describe('Live2DFactory', () => {
    const options = { autoUpdate: false, motionPreload: MOTION_PRELOAD_NONE };

    it('should create Live2DModel', async function() {
        // cubism2
        await expect(Live2DModel.from(TEST_MODEL.file, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(TEST_MODEL.json, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(new Cubism2ModelSettings(TEST_MODEL.json), options))
            .to.eventually.be.instanceOf(Live2DModel);

        // cubism4
        await expect(Live2DModel.from(TEST_MODEL4.file, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(TEST_MODEL4.json, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(new Cubism4ModelSettings(TEST_MODEL4.json), options))
            .to.eventually.be.instanceOf(Live2DModel);
    });

    it('should create derived Live2DModel', async () => {
        class DerivedLive2DModel extends Live2DModel {}

        await expect(DerivedLive2DModel.from(TEST_MODEL.file), options)
            .to.eventually.be.instanceOf(DerivedLive2DModel).and.instanceOf(Live2DModel);
    });
});
