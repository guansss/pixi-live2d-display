import { ExpressionManager, InternalModel, ModelSettings, MotionManager } from '@/cubism-common';
import { XHRLoader } from '@/factory/XHRLoader';
import { Live2DModel } from '@/Live2DModel';
import { Middleware, runMiddlewares } from '@/utils/middleware';

export type Live2DLoaderTarget = Live2DModel | InternalModel | MotionManager | ExpressionManager

/**
 * The context transferred through Live2DLoader middlewares.
 */
export interface Live2DLoaderContext {
    /** The XHR's response type. */
    type: XMLHttpRequestResponseType;

    /** Will be resolved by {@link ModelSettings.resolveURL} if a ModelSettings is provided. */
    url: string;

    /** If provided, the given URL will be resolved by {@link ModelSettings.resolveURL}. */
    settings?: ModelSettings;

    /**
     * Owner of this resource. The load task will be automatically canceled
     * when receiving an "destroy" event from the target.
     */
    target?: Live2DLoaderTarget;

    /** Loaded data. */
    result?: any;
}

export class Live2DLoader {
    static middlewares: Middleware<Live2DLoaderContext>[] = [XHRLoader.loader];

    /**
     * Loads a resource.
     * @return Promise that resolves with the loaded data in a format that's consistent with the specified `type`.
     */
    static load<T = any>(context: Live2DLoaderContext): Promise<T> {
        return runMiddlewares(this.middlewares, context).then(() => context.result);
    }
}
