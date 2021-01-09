import { ExpressionManager, InternalModel, ModelSettings, MotionManager } from '@/cubism-common';
import { XHRLoader } from '@/factory/XHRLoader';
import { Live2DModel } from '@/Live2DModel';
import { Middleware, runMiddlewares } from '@/utils/middleware';

export type Live2DLoaderTarget = Live2DModel | InternalModel | MotionManager | ExpressionManager

export interface Live2DLoaderContext {
    type: XMLHttpRequestResponseType;
    url: string;
    settings?: ModelSettings;
    target?: Live2DLoaderTarget;
    result?: any;
}

export class Live2DLoader {
    static middlewares: Middleware<Live2DLoaderContext>[] = [XHRLoader.loader];

    static load<T = any>(context: Live2DLoaderContext): Promise<T> {
        return runMiddlewares(this.middlewares, context).then(() => context.result);
    }
}
