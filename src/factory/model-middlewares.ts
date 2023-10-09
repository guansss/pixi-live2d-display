import { ModelSettings } from "@/cubism-common";
import type { Live2DFactoryContext } from "@/factory/Live2DFactory";
import { Live2DFactory } from "@/factory/Live2DFactory";
import { Live2DLoader } from "@/factory/Live2DLoader";
import { createTexture } from "@/factory/texture";
import { logger } from "@/utils";
import type { Middleware } from "@/utils/middleware";

const TAG = "Live2DFactory";

/**
 * A middleware that converts the source from a URL to a settings JSON object.
 */
export const urlToJSON: Middleware<Live2DFactoryContext> = async (context, next) => {
    if (typeof context.source === "string") {
        const data = await Live2DLoader.load({
            url: context.source,
            type: "json",
            target: context.live2dModel,
        });

        data.url = context.source;

        context.source = data;

        context.live2dModel.emit("settingsJSONLoaded", data);
    }

    return next();
};

/**
 * A middleware that converts the source from a settings JSON object to a ModelSettings instance.
 */
export const jsonToSettings: Middleware<Live2DFactoryContext> = async (context, next) => {
    if (context.source instanceof ModelSettings) {
        context.settings = context.source;

        return next();
    } else if (typeof context.source === "object") {
        const runtime = Live2DFactory.findRuntime(context.source);

        if (runtime) {
            const settings = runtime.createModelSettings(context.source);

            context.settings = settings;
            context.live2dModel.emit("settingsLoaded", settings);

            return next();
        }
    }

    throw new TypeError("Unknown settings format.");
};

export const waitUntilReady: Middleware<Live2DFactoryContext> = (context, next) => {
    if (context.settings) {
        const runtime = Live2DFactory.findRuntime(context.settings);

        if (runtime) {
            return runtime.ready().then(next);
        }
    }

    return next();
};

/**
 * A middleware that populates the Live2DModel with optional resources.
 * Requires InternalModel in context when all the subsequent middlewares have finished.
 */
export const setupOptionals: Middleware<Live2DFactoryContext> = async (context, next) => {
    // wait until all has finished
    await next();

    const internalModel = context.internalModel;

    if (internalModel) {
        const settings = context.settings!;
        const runtime = Live2DFactory.findRuntime(settings);

        if (runtime) {
            const tasks: Promise<void>[] = [];

            if (settings.pose) {
                tasks.push(
                    Live2DLoader.load({
                        settings,
                        url: settings.pose,
                        type: "json",
                        target: internalModel,
                    })
                        .then((data: ArrayBuffer) => {
                            internalModel.pose = runtime.createPose(internalModel.coreModel, data);
                            context.live2dModel.emit("poseLoaded", internalModel.pose);
                        })
                        .catch((e: Error) => {
                            context.live2dModel.emit("poseLoadError", e);
                            logger.warn(TAG, "Failed to load pose.", e);
                        }),
                );
            }

            if (settings.physics) {
                tasks.push(
                    Live2DLoader.load({
                        settings,
                        url: settings.physics,
                        type: "json",
                        target: internalModel,
                    })
                        .then((data: ArrayBuffer) => {
                            internalModel.physics = runtime.createPhysics(
                                internalModel.coreModel,
                                data,
                            );
                            context.live2dModel.emit("physicsLoaded", internalModel.physics);
                        })
                        .catch((e: Error) => {
                            context.live2dModel.emit("physicsLoadError", e);
                            logger.warn(TAG, "Failed to load physics.", e);
                        }),
                );
            }

            if (tasks.length) {
                await Promise.all(tasks);
            }
        }
    }
};

/**
 * A middleware that populates the Live2DModel with essential resources.
 * Requires ModelSettings in context immediately, and InternalModel in context
 * when all the subsequent middlewares have finished.
 */
export const setupEssentials: Middleware<Live2DFactoryContext> = async (context, next) => {
    if (context.settings) {
        const live2DModel = context.live2dModel;

        const textureLoadings = context.settings.textures.map((tex) => {
            const url = context.settings!.resolveURL(tex);
            return createTexture(url, { crossOrigin: context.options.crossOrigin });
        });

        // wait for the internal model to be created
        await next();

        if (context.internalModel) {
            live2DModel.internalModel = context.internalModel;
            live2DModel.emit("modelLoaded", context.internalModel);
        } else {
            throw new TypeError("Missing internal model.");
        }

        live2DModel.textures = await Promise.all(textureLoadings);
        live2DModel.emit("textureLoaded", live2DModel.textures);
    } else {
        throw new TypeError("Missing settings.");
    }
};

/**
 * A middleware that creates the InternalModel. Requires ModelSettings in context.
 */
export const createInternalModel: Middleware<Live2DFactoryContext> = async (context, next) => {
    const settings = context.settings;

    if (settings instanceof ModelSettings) {
        const runtime = Live2DFactory.findRuntime(settings);

        if (!runtime) {
            throw new TypeError("Unknown model settings.");
        }

        const modelData = await Live2DLoader.load<ArrayBuffer>({
            settings,
            url: settings.moc,
            type: "arraybuffer",
            target: context.live2dModel,
        });

        if (!runtime.isValidMoc(modelData)) {
            throw new Error("Invalid moc data");
        }

        const coreModel = runtime.createCoreModel(modelData);

        context.internalModel = runtime.createInternalModel(coreModel, settings, context.options);

        return next();
    }

    throw new TypeError("Missing settings.");
};
