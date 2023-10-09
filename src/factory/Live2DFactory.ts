import type { Live2DModel, Live2DModelOptions } from "@/Live2DModel";
import type { InternalModel, ModelSettings } from "@/cubism-common";
import { ExpressionManager, MotionManager } from "@/cubism-common";
import { Live2DLoader } from "@/factory/Live2DLoader";
import {
    createInternalModel,
    jsonToSettings,
    setupEssentials,
    setupOptionals,
    urlToJSON,
    waitUntilReady,
} from "@/factory/model-middlewares";
import { logger } from "@/utils";
import type { Middleware } from "@/utils/middleware";
import { runMiddlewares } from "@/utils/middleware";
import type { JSONObject } from "../types/helpers";

export interface Live2DFactoryOptions extends Live2DModelOptions {
    /**
     * Whether to check the consistency of the moc file. It's an internal
     * function of Cubism core and only available since Cubism 4 R7.
     * @default false
     */
    checkMocConsistency?: boolean;

    /**
     * String to use for crossOrigin properties on `<img>` elements when loading textures.
     * @default undefined
     */
    crossOrigin?: string;

    /**
     * Callback invoked when the model has been loaded.
     * @default undefined
     */
    onLoad?(): void;

    /**
     * Callback invoked when error occurs while loading the model.
     * @default undefined
     */
    onError?(e: Error): void;
}

/**
 * The context transferred through the model creation middlewares.
 */
export interface Live2DFactoryContext {
    source: any;
    options: Live2DFactoryOptions;
    live2dModel: Live2DModel;
    internalModel?: InternalModel;
    settings?: ModelSettings;
}

/**
 * Represents a Cubism version.
 */
export interface Live2DRuntime {
    /**
     * The version number. Higher version takes priority when matching the runtime.
     */
    version: number;

    /**
     * Checks if the source belongs to this runtime.
     * @param source - Either a settings JSON object or a ModelSettings instance.
     * @return True if the source belongs to this runtime.
     */
    test(source: any): boolean;

    // TODO: remove
    ready(): Promise<void>;

    /**
     * Checks if the data is a valid moc to create the core model.
     * @param modelData - The moc content.
     * @return True if the data is valid.
     */
    isValidMoc(modelData: ArrayBuffer): boolean;

    /**
     * Creates a ModelSettings.
     * @param json - The settings JSON object.
     * @return Created ModelSettings.
     */
    createModelSettings(json: JSONObject): ModelSettings;

    /**
     * Creates a core model.
     * @param data - Content of the moc file.
     * @return Created core model.
     */
    createCoreModel(data: ArrayBuffer, options?: Live2DFactoryOptions): any;

    /**
     * Creates an InternalModel.
     * @param coreModel - Core model that *must* belong to this runtime.
     * @param settings - ModelSettings of this model.
     * @param options - Options that will be passed to the InternalModel's constructor.
     * @return Created InternalModel.
     */
    createInternalModel(
        coreModel: any,
        settings: ModelSettings,
        options?: Live2DFactoryOptions,
    ): InternalModel;

    /**
     * Creates a pose.
     * @param coreModel - Core model that *must* belong to this runtime.
     * @param data - Content of the pose file.
     * @return Created pose.
     */
    createPose(coreModel: any, data: any): any;

    /**
     * Creates a physics.
     * @param coreModel - Core model that *must* belong to this runtime.
     * @param data - Content of the physics file.
     * @return Created physics.
     */
    createPhysics(coreModel: any, data: any): any;
}

/**
 * Handles all the network load tasks.
 *
 * - Model creation: requested by {@link Live2DModel.from}.
 * - Motion loading: implements the load method of MotionManager.
 * - Expression loading: implements the load method of ExpressionManager.
 */
export class Live2DFactory {
    /**
     * All registered runtimes, sorted by versions in descending order.
     */
    static runtimes: Live2DRuntime[] = [];

    static urlToJSON = urlToJSON;
    static jsonToSettings = jsonToSettings;
    static waitUntilReady = waitUntilReady;
    static setupOptionals = setupOptionals;
    static setupEssentials = setupEssentials;
    static createInternalModel = createInternalModel;

    /**
     * Middlewares to run through when setting up a Live2DModel.
     */
    static live2DModelMiddlewares: Middleware<Live2DFactoryContext>[] = [
        urlToJSON,
        jsonToSettings,
        waitUntilReady,
        setupOptionals,
        setupEssentials,
        createInternalModel,
    ];

    /**
     * load tasks of each motion. The structure of each value in this map
     * is the same as respective {@link MotionManager.definitions}.
     */
    static motionTasksMap = new WeakMap<
        MotionManager,
        Record<string, (Promise<any> | undefined)[]>
    >();

    /**
     * Load tasks of each expression.
     */
    static expressionTasksMap = new WeakMap<ExpressionManager, (Promise<any> | undefined)[]>();

    /**
     * Registers a Live2DRuntime.
     */
    static registerRuntime(runtime: Live2DRuntime) {
        Live2DFactory.runtimes.push(runtime);

        // higher version as higher priority
        Live2DFactory.runtimes.sort((a, b) => b.version - a.version);
    }

    /**
     * Finds a runtime that matches given source.
     * @param source - Either a settings JSON object or a ModelSettings instance.
     * @return The Live2DRuntime, or undefined if not found.
     */
    static findRuntime(source: any): Live2DRuntime | undefined {
        for (const runtime of Live2DFactory.runtimes) {
            if (runtime.test(source)) {
                return runtime;
            }
        }
    }

    /**
     * Sets up a Live2DModel, populating it with all defined resources.
     * @param live2dModel - The Live2DModel instance.
     * @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
     * @param options - Options for the process.
     * @return Promise that resolves when all resources have been loaded, rejects when error occurs.
     */
    static async setupLive2DModel<IM extends InternalModel>(
        live2dModel: Live2DModel<IM>,
        source: string | object | IM["settings"],
        options?: Live2DFactoryOptions,
    ): Promise<void> {
        const textureLoaded = new Promise((resolve) => live2dModel.once("textureLoaded", resolve));
        const modelLoaded = new Promise((resolve) => live2dModel.once("modelLoaded", resolve));

        // because the "ready" event is supposed to be emitted after
        // both the internal model and textures have been loaded,
        // we should here wrap the emit() in a then() so it'll
        // be executed after all the handlers of "modelLoaded" and "textureLoaded"
        const readyEventEmitted = Promise.all([textureLoaded, modelLoaded]).then(() =>
            live2dModel.emit("ready"),
        );

        await runMiddlewares(Live2DFactory.live2DModelMiddlewares, {
            live2dModel: live2dModel as Live2DModel<InternalModel>,
            source,
            options: options || {},
        });

        // the "load" event should never be emitted before "ready"
        await readyEventEmitted;

        live2dModel.emit("load");
    }

    /**
     * Loads a Motion and registers the task to {@link motionTasksMap}. The task will be automatically
     * canceled when its owner - the MotionManager instance - has been destroyed.
     * @param motionManager - MotionManager that owns this Motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
     */
    static loadMotion<Motion, MotionSpec>(
        motionManager: MotionManager<Motion, MotionSpec>,
        group: string,
        index: number,
    ): Promise<Motion | undefined> {
        // errors in this method are always handled
        const handleError = (e: any) => motionManager.emit("motionLoadError", group, index, e);

        try {
            const definition = motionManager.definitions[group]?.[index];

            if (!definition) {
                return Promise.resolve(undefined);
            }

            if (!motionManager.listeners("destroy").includes(Live2DFactory.releaseTasks)) {
                motionManager.once("destroy", Live2DFactory.releaseTasks);
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
                .then((data) => {
                    const taskGroup = Live2DFactory.motionTasksMap.get(motionManager)?.[group];

                    if (taskGroup) {
                        delete taskGroup[index];
                    }

                    const motion = motionManager.createMotion(data, group, definition);

                    motionManager.emit("motionLoaded", group, index, motion);

                    return motion;
                })
                .catch((e) => {
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

    /**
     * Loads an Expression and registers the task to {@link expressionTasksMap}. The task will be automatically
     * canceled when its owner - the ExpressionManager instance - has been destroyed.
     * @param expressionManager - ExpressionManager that owns this Expression.
     * @param index - Index of the Expression.
     * @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
     */
    static loadExpression<Expression, ExpressionSpec>(
        expressionManager: ExpressionManager<Expression, ExpressionSpec>,
        index: number,
    ): Promise<Expression | undefined> {
        // errors in this method are always handled
        const handleError = (e: any) => expressionManager.emit("expressionLoadError", index, e);

        try {
            const definition = expressionManager.definitions[index];

            if (!definition) {
                return Promise.resolve(undefined);
            }

            if (!expressionManager.listeners("destroy").includes(Live2DFactory.releaseTasks)) {
                expressionManager.once("destroy", Live2DFactory.releaseTasks);
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
                type: "json",
                target: expressionManager,
            })
                .then((data) => {
                    const tasks = Live2DFactory.expressionTasksMap.get(expressionManager);

                    if (tasks) {
                        delete tasks[index];
                    }

                    const expression = expressionManager.createExpression(data, definition);

                    expressionManager.emit("expressionLoaded", index, expression);

                    return expression;
                })
                .catch((e) => {
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

MotionManager.prototype["_loadMotion"] = function (group, index) {
    return Live2DFactory.loadMotion(this, group, index);
};

ExpressionManager.prototype["_loadExpression"] = function (index) {
    return Live2DFactory.loadExpression(this, index);
};
