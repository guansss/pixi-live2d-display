import { Cubism2InternalModel } from '@/cubism2/Cubism2InternalModel';
import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Live2DPhysics } from '@/cubism2/Live2DPhysics';
import { Live2DPose } from '@/cubism2/Live2DPose';
import { Live2DFactory, Live2DFactoryOptions } from '@/factory/Live2DFactory';

Live2DFactory.registerRuntime({
    version: 2,

    test(source: any): boolean {
        return source instanceof Cubism2ModelSettings || Cubism2ModelSettings.isValidJSON(source);
    },

    ready(): Promise<void> {
        return Promise.resolve();
    },

    createModelSettings(json: object): Cubism2ModelSettings {
        return new Cubism2ModelSettings(json as Cubism2Spec.ModelJSON & { url: string });
    },

    createCoreModel(data: ArrayBuffer): Live2DModelWebGL {
        const model = Live2DModelWebGL.loadModel(data);

        const error = Live2D.getError();
        if (error) throw error;

        return model;
    },

    createInternalModel(coreModel: Live2DModelWebGL, settings: Cubism2ModelSettings, options?: Live2DFactoryOptions): Cubism2InternalModel {
        return new Cubism2InternalModel(coreModel, settings, options);
    },

    createPose(coreModel: Live2DModelWebGL, data: any): Live2DPose {
        return new Live2DPose(coreModel, data);
    },

    createPhysics(coreModel: Live2DModelWebGL, data: any): Live2DPhysics {
        return new Live2DPhysics(coreModel, data);
    },
});
