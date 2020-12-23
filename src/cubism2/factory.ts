import { ModelSettings } from '@/cubism-common';
import { Cubism2InternalModel } from '@/cubism2/Cubism2InternalModel';
import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Live2DPhysics } from '@/cubism2/Live2DPhysics';
import { Live2DPose } from '@/cubism2/Live2DPose';
import { Live2DFactory, Live2DFactoryOptions } from '@/factory/Live2DFactory';

Live2DFactory.registerRuntime({
    version: 2,

    createModelSettings(json: any): Cubism2ModelSettings | undefined {
        if (Cubism2ModelSettings.isValidJSON(json)) {
            return new Cubism2ModelSettings(json);
        }
    },

    test(settings: ModelSettings): settings is Cubism2ModelSettings {
        return settings instanceof Cubism2ModelSettings;
    },

    ready(): Promise<void> {
        return Promise.resolve();
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
