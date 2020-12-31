import { Cubism2InternalModel, Cubism2ModelSettings } from '@/cubism2';
import { Cubism4InternalModel, Cubism4ModelSettings } from '@/cubism4';
import { TEST_MODEL, TEST_MODEL4 } from '../env';
import { MotionPreloadStrategy } from '@';

describe('InternalModel', function() {
    it('should emit events while updating', function() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');

        const internalModel2 = new Cubism2InternalModel(
            TEST_MODEL.coreModel,
            new Cubism2ModelSettings(TEST_MODEL.json),
            { motionPreload: MotionPreloadStrategy.NONE },
        );
        const internalModel4 = new Cubism4InternalModel(
            TEST_MODEL4.coreModel,
            new Cubism4ModelSettings(TEST_MODEL4.json),
            { motionPreload: MotionPreloadStrategy.NONE },
        );

        for (const internalModel of [internalModel2, internalModel4]) {
            internalModel.updateWebGLContext(gl, 0);

            const beforeMotionUpdate = sinon.spy();
            const afterMotionUpdate = sinon.spy();
            const beforeModelUpdate = sinon.spy();

            internalModel.on('beforeMotionUpdate', beforeMotionUpdate);
            internalModel.on('afterMotionUpdate', afterMotionUpdate);
            internalModel.on('beforeModelUpdate', beforeModelUpdate);

            internalModel.update(1000 / 60, performance.now());

            expect(beforeMotionUpdate).to.be.called;
            expect(afterMotionUpdate).to.be.called;
            expect(beforeModelUpdate).to.be.called;
        }
    });
});
