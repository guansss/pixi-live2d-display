import { Cubism2InternalModel, Cubism2ModelSettings } from '@/cubism2';
import { Cubism4InternalModel, Cubism4ModelSettings } from '@/cubism4';
import { TEST_MODEL, TEST_MODEL4 } from '../env';
import { MotionPreloadStrategy } from '@/cubism-common';

describe('InternalModel', function() {
    function createModel2(def) {
        return new Cubism2InternalModel(
            def.coreModel,
            new Cubism2ModelSettings(def.json),
            { motionPreload: MotionPreloadStrategy.NONE },
        );
    }

    function createModel4(def) {
        return new Cubism4InternalModel(
            def.coreModel,
            new Cubism4ModelSettings(def.json),
            { motionPreload: MotionPreloadStrategy.NONE },
        );
    }

    it('should emit events while updating', function() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');

        for (const model of [createModel2(TEST_MODEL), createModel4(TEST_MODEL4)]) {
            model.updateWebGLContext(gl, 0);

            const beforeMotionUpdate = sinon.spy();
            const afterMotionUpdate = sinon.spy();
            const beforeModelUpdate = sinon.spy();

            model.on('beforeMotionUpdate', beforeMotionUpdate);
            model.on('afterMotionUpdate', afterMotionUpdate);
            model.on('beforeModelUpdate', beforeModelUpdate);

            model.update(1000 / 60, performance.now());

            expect(beforeMotionUpdate).to.be.called;
            expect(afterMotionUpdate).to.be.called;
            expect(beforeModelUpdate).to.be.called;
        }
    });

    it('should read layout from settings', function () {
        const model2 = createModel2(TEST_MODEL);

        expect(model2.getLayout()).to.eql({
            centerX: 0,
            y: 1.2,
            width: 2.4,
        });

        const model4 = createModel4(TEST_MODEL4);

        expect(model4.getLayout()).to.eql({
            width: 1.8,
            x: 0.9,
        });
    });

    it('should provide access to drawables', function() {
        for (const model of [createModel2(TEST_MODEL), createModel4(TEST_MODEL4)]) {
            const drawableIDs = model.getDrawableIDs();

            expect(drawableIDs.length).to.be.greaterThan(10);

            expect(model.getDrawableIndex(drawableIDs[1])).to.equal(1);

            expect(model.getDrawableVertices(0).length).to.be.greaterThan(0);
        }
    });
});
