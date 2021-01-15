import { ExpressionManager, InternalModel, ModelSettings, MotionManager } from '@/cubism-common';
import { Live2DLoader } from '@/factory/Live2DLoader';
import { Live2DModel, Live2DModelOptions } from '@/Live2DModel';
import { logger } from '@/utils';
import { Middleware, runMiddlewares } from '@/utils/middleware';
import {
    createInternalModel,
    jsonToSettings,
    setupEssentials,
    setupOptionals,
    urlToJSON,
    waitUntilReady,
} from '@/factory/model-middlewares';

export interface Live2DFactoryOptions extends Live2DModelOptions {
    /**
     * String to use for crossOrigin properties on `<img>` elements when loading textures.
     * @default undefined
     */
    crossOrigin?: string;

    onLoad?(): void;

    onError?(e: Error): void;
}

export interface Live2DFactoryContext {
    source: any,
    options: Live2DFactoryOptions;
    live2dModel: Live2DModel;
    internalModel?: InternalModel;
    settings?: ModelSettings;
}

export interface Live2DRuntime {
    version: number;

    test(source: any): boolean;

    ready(): Promise<void>;

    isValidMoc(modelData: ArrayBuffer): boolean;

    createModelSettings(json: object): ModelSettings;

    createCoreModel(data: ArrayBuffer): any;

    createInternalModel(coreModel: any, settings: ModelSettings, options?: Live2DFactoryOptions): InternalModel;

    createPose(coreModel: any, data: any): any;

    createPhysics(coreModel: any, data: any): any;
}

export class Live2DFactory {
    static runtimes: Live2DRuntime[] = [];

    static urlToJSON = urlToJSON;
    static jsonToSettings = jsonToSettings;
    static waitUntilReady = waitUntilReady;
    static setupOptionals = setupOptionals;
    static setupEssentials = setupEssentials;
    static createInternalModel = createInternalModel;

    static live2DModelMiddlewares: Middleware<Live2DFactoryContext>[] = [
        urlToJSON, jsonToSettings, waitUntilReady, setupOptionals, setupEssentials, createInternalModel,
    ];

    /**
     * loading tasks of each motion. The structure of each value in this map is the same as {@link MotionManager#definitions}.
     */
    static motionTasksMap = new WeakMap<MotionManager, Record<string, Promise<any>[]>>();

    static expressionTasksMap = new WeakMap<ExpressionManager, Promise<any>[]>();

    static registerRuntime(runtime: Live2DRuntime) {
        Live2DFactory.runtimes.push(runtime);

        // higher version as higher priority
        Live2DFactory.runtimes.sort((a, b) => b.version - a.version);
    }

    static getRuntime(source: any): Live2DRuntime | undefined {
        for (const runtime of Live2DFactory.runtimes) {
            if (runtime.test(source)) {
                return runtime;
            }
        }
    }

    static async setupLive2DModel<IM extends InternalModel>(live2dModel: Live2DModel<IM>, source: string | object | IM['settings'], options?: Live2DFactoryOptions): Promise<void> {
        const textureLoaded = new Promise(resolve => live2dModel.once('textureLoaded', resolve));
        const modelLoaded = new Promise(resolve => live2dModel.once('modelLoaded', resolve));

        // because the "ready" event is supposed to be emitted after
        // both the internal model and textures have been loaded,
        // we should here wrap the emit() in a then() so it'll
        // be executed after all the handlers of "modelLoaded" and "textureLoaded"
        const readyEventEmitted = Promise.all([textureLoaded, modelLoaded]).then(() => live2dModel.emit('ready'));

        await runMiddlewares(Live2DFactory.live2DModelMiddlewares, {
            live2dModel,
            source,
            options: options || {},
        });

        // the "load" event should never be emitted before "ready"
        await readyEventEmitted;

        live2dModel.emit('load');
    }

    static loadMotion<Motion, MotionSpec>(motionManager: MotionManager<Motion, MotionSpec>, group: string, index: number): Promise<Motion | undefined> {
        // errors in this method are always handled
        const handleError = (e: any) => motionManager.emit('motionLoadError', group, index, e);

        try {
            const definition = motionManager.definitions[group] ?. [index];

            if (!definition) {
                return Promise.resolve(undefined);
            }

            if (!motionManager.listeners('destroy').includes(Live2DFactory.releaseTasks)) {
                motionManager.once('destroy', Live2DFactory.releaseTasks);
            }

            let tasks = Live2DFactory.motionTasksMap.get(motionManager);

            if (!tasks) {
                tasks = {};
                Live2DFactory.motionTasksMap.set(motionManager, tasks);
            }

            let taskGroup = tasks[group];

            if (!taskGroup) {
                taskGroup = [];
                tasks[group] = taskGroup;
            }

            const path = motionManager.getMotionFile(definition);

            taskGroup[index] ??= Live2DLoader.load({
                    url: path,
                    settings: motionManager.settings,
                    type: motionManager.motionDataType,
                    target: motionManager,
                })
                .then(data => {
                    const taskGroup = Live2DFactory.motionTasksMap.get(motionManager)?.[group];

                    if (taskGroup) {
                        delete taskGroup[index];
                    }

                    const motion = motionManager.createMotion(data, group, definition);

                    motionManager.emit('motionLoaded', group, index, motion);

                    return motion;
                })
                .catch(e => {
                    logger.warn(motionManager.tag, `Failed to load motion: ${path}\n`, e);
                    handleError(e);
                });

            return taskGroup[index]!;
        } catch (e) {
            logger.warn(motionManager.tag, `Failed to load motion at "${group}"[${index}]\n`, e);
            handleError(e);
        }

        return Promise.resolve(undefined);
    }

    static loadExpression<Expression, ExpressionSpec>(expressionManager: ExpressionManager<Expression, ExpressionSpec>, index: number): Promise<Expression | undefined> {
        // errors in this method are always handled
        const handleError = (e: any) => expressionManager.emit('expressionLoadError', index, e);

        try {
            const definition = expressionManager.definitions[index];

            if (!definition) {
                return Promise.resolve(undefined);
            }

            if (!expressionManager.listeners('destroy').includes(Live2DFactory.releaseTasks)) {
                expressionManager.once('destroy', Live2DFactory.releaseTasks);
            }

            let tasks = Live2DFactory.expressionTasksMap.get(expressionManager);

            if (!tasks) {
                tasks = [];
                Live2DFactory.expressionTasksMap.set(expressionManager, tasks);
            }

            const path = expressionManager.getExpressionFile(definition);

            tasks[index] ??= Live2DLoader.load({
                    url: path,
                    settings: expressionManager.settings,
                    type: 'json',
                    target: expressionManager,
                })
                .then(data => {
                    const tasks = Live2DFactory.expressionTasksMap.get(expressionManager);

                    if (tasks) {
                        delete tasks[index];
                    }

                    const expression = expressionManager.createExpression(data, definition);

                    expressionManager.emit('expressionLoaded', index, expression);

                    return expression;
                })
                .catch(e => {
                    logger.warn(expressionManager.tag, `Failed to load expression: ${path}\n`, e);
                    handleError(e);
                });

            return tasks[index]!;
        } catch (e) {
            logger.warn(expressionManager.tag, `Failed to load expression at [${index}]\n`, e);
            handleError(e);
        }

        return Promise.resolve(undefined);
    }

    static releaseTasks(this: MotionManager | ExpressionManager) {
        if (this instanceof MotionManager) {
            Live2DFactory.motionTasksMap.delete(this);
        } else {
            Live2DFactory.expressionTasksMap.delete(this);
        }
    }
}

(MotionManager.prototype as any)._loadMotion = function(this: MotionManager, group: string, index: number) {
    return Live2DFactory.loadMotion(this, group, index);
};

(ExpressionManager.prototype as any)._loadExpression = function(this: ExpressionManager, index: number) {
    return Live2DFactory.loadExpression(this, index);
};
