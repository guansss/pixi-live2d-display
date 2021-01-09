import { ExpressionManager, InternalModel, ModelSettings, MotionManager } from '@/cubism-common';
import { Live2DLoader } from '@/factory/Live2DLoader';
import { createTexture } from '@/factory/texture';
import { Live2DModel, Live2DModelOptions } from '@/Live2DModel';
import { logger } from '@/utils';
import { Middleware, runMiddlewares } from '@/utils/middleware';

const TAG = 'Live2DFactory';

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

    createModelSettings(json: object): ModelSettings;

    createCoreModel(data: ArrayBuffer): any;

    createInternalModel(coreModel: any, settings: ModelSettings, options?: Live2DFactoryOptions): InternalModel;

    createPose(coreModel: any, data: any): any;

    createPhysics(coreModel: any, data: any): any;
}

export const urlToJSON: Middleware<Live2DFactoryContext> = async (context, next) => {
    if (typeof context.source === 'string') {
        const data = await Live2DLoader.load({
            url: context.source,
            type: 'json',
            target: context.live2dModel,
        });

        data.url = context.source;

        context.source = data;

        context.live2dModel.emit('settingsJSONLoaded', data);
    }

    return next();
};

export const jsonToSettings: Middleware<Live2DFactoryContext> = async (context, next) => {
    if (context.source instanceof ModelSettings) {
        context.settings = context.source;

        return next();
    } else if (typeof context.source === 'object') {
        const runtime = Live2DFactory.getRuntime(context.source);

        if (runtime) {
            const settings = runtime.createModelSettings(context.source);

            context.settings = settings;
            context.live2dModel.emit('settingsLoaded', settings);

            return next();
        }
    }

    throw new TypeError('Unknown settings format.');
};

export const waitUntilReady: Middleware<Live2DFactoryContext> = (context, next) => {
    if (context.settings) {
        const runtime = Live2DFactory.getRuntime(context.settings);

        if (runtime) {
            return runtime.ready().then(next);
        }
    }

    return next();
};

export const setupOptionals: Middleware<Live2DFactoryContext> = async (context, next) => {
    // wait until all has finished
    await next();

    const internalModel = context.internalModel;

    if (internalModel) {
        const settings = context.settings!;
        const runtime = Live2DFactory.getRuntime(settings);

        if (runtime) {
            const tasks: Promise<void>[] = [];

            if (settings.pose) {
                tasks.push(
                    Live2DLoader.load({
                            settings,
                            url: settings.pose,
                            type: 'json',
                            target: internalModel,
                        })
                        .then((data: ArrayBuffer) => {
                            internalModel.pose = runtime.createPose(internalModel.coreModel, data);
                            context.live2dModel.emit('poseLoaded', internalModel.pose);
                        })
                        .catch((e: Error) => logger.warn(TAG, 'Failed to load pose.\n', e)),
                );
            }

            if (settings.physics) {
                tasks.push(
                    Live2DLoader.load({
                            settings,
                            url: settings.physics,
                            type: 'json',
                            target: internalModel,
                        })
                        .then((data: ArrayBuffer) => {
                            internalModel.physics = runtime.createPhysics(internalModel.coreModel, data);
                            context.live2dModel.emit('physicsLoaded', internalModel.physics);
                        })
                        .catch((e: Error) => logger.warn(TAG, 'Failed to load physics.\n', e)),
                );
            }

            if (tasks.length) {
                await Promise.all(tasks);
            }
        }
    }
};

export const setupLive2DModel: Middleware<Live2DFactoryContext> = async (context, next) => {
    if (context.settings) {
        const live2DModel = context.live2dModel;

        const textureLoadings = context.settings.textures.map(tex => {
            const url = context.settings!.resolveURL(tex);
            return createTexture(url, { crossOrigin: context.options.crossOrigin });
        });

        // wait for the internal model to be created
        await next();

        if (context.internalModel) {
            live2DModel.internalModel = context.internalModel;
            live2DModel.emit('modelLoaded', context.internalModel);
        } else {
            throw new TypeError('Missing internal model.');
        }

        live2DModel.textures = await Promise.all(textureLoadings);
        live2DModel.emit('textureLoaded', live2DModel.textures);
    } else {
        throw new TypeError('Missing settings.');
    }
};

export const createInternalModel: Middleware<Live2DFactoryContext> = async (context, next) => {
    const settings = context.settings;

    if (settings instanceof ModelSettings) {
        const runtime = Live2DFactory.getRuntime(settings);

        if (!runtime) {
            throw new TypeError('Unknown model settings.');
        }

        const modelData = await Live2DLoader.load({
            settings,
            url: settings.moc,
            type: 'arraybuffer',
            target: context.live2dModel,
        });

        const coreModel = runtime.createCoreModel(modelData);

        context.internalModel = runtime.createInternalModel(coreModel, settings, context.options);

        return next();
    }

    throw new TypeError('Missing settings.');
};

export class Live2DFactory {
    static runtimes: Live2DRuntime[] = [];

    static live2DModelMiddlewares: Middleware<Live2DFactoryContext>[] = [
        urlToJSON, jsonToSettings, waitUntilReady, setupOptionals, setupLive2DModel, createInternalModel,
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

                    return motionManager.createMotion(data, group, definition);
                })
                .catch(e => logger.warn(motionManager.tag, `Failed to load motion: ${path}\n`, e));

            return taskGroup[index]!;
        } catch (e) {
            logger.warn(motionManager.tag, `Failed to load motion at "${group}"[${index}]\n`, e);
        }

        return Promise.resolve(undefined);
    }

    static loadExpression<Expression, ExpressionSpec>(expressionManager: ExpressionManager<Expression, ExpressionSpec>, index: number): Promise<Expression | undefined> {
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

                    return expressionManager.createExpression(data, definition);
                })
                .catch(e => logger.warn(expressionManager.tag, `Failed to load expression: ${path}\n`, e));

            return tasks[index]!;
        } catch (e) {
            logger.warn(expressionManager.tag, `Failed to load expression at [${index}]\n`, e);
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
