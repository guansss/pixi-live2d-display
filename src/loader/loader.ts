import { ExpressionManager, InternalModel, MotionManager } from '@/cubism-common';
import { Live2DModel } from '@/Live2DModel';

export type LoaderTarget =
    Live2DModel<any>
    | InternalModel<any, any, any>
    | MotionManager
    | ExpressionManager

export interface Live2DLoader {
    loadJSON(url: string, target?: LoaderTarget): Promise<any>;

    loadResJSON(path: string, baseURL: string, target: LoaderTarget): Promise<any>;

    loadResArrayBuffer(path: string, baseURL: string, target: LoaderTarget): Promise<ArrayBuffer>;

    releaseTarget(target: LoaderTarget): void;

    release(): void;
}
