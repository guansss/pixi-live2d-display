import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import '@/factory';
import '@/factory/cubism2';
import { Live2DModel } from '@/Live2DModel';
import { TEST_MODEL } from '../env';

describe('Live2DFactory', () => {
    const options = { autoUpdate: false };

    it('should create Live2DModel', async function() {
        await expect(Live2DModel.from(TEST_MODEL.file, options))
            .to.eventually.be.instanceOf(Live2DModel);

        await expect(Live2DModel.from(TEST_MODEL.json, options))
            .to.eventually.be.instanceOf(Live2DModel);

        await expect(Live2DModel.from(new Cubism2ModelSettings(TEST_MODEL.json), options))
            .to.eventually.be.instanceOf(Live2DModel);
    });

    it('should create derived Live2DModel', async () => {
        class DerivedLive2DModel extends Live2DModel {}

        await expect(DerivedLive2DModel.from(TEST_MODEL.file), options)
            .to.eventually.be.instanceOf(DerivedLive2DModel).and.instanceOf(Live2DModel);
    });
});
