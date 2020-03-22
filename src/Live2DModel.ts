import { Live2DInternalModel } from '@/live2d/Live2DInternalModel';

export class Live2DModel {

    constructor(readonly internal: Live2DInternalModel) {
    }

    static async fromModelSettings(url: string) {
        return new Live2DModel(await Live2DInternalModel.fromModelSettings(url));
    }
}
