import { Texture } from '@pixi/core';
import { ILoaderOptions, Loader, LoaderResource } from '@pixi/loaders';
import { TextureCache } from '@pixi/utils';
import { Live2DInternalModel, Live2DPhysics, Live2DPose, ModelSettings, ModelSettingsJSON } from './live2d';
import { Live2DModel, Live2DModelOptions } from './Live2DModel';
import { logger } from './utils';

const TAG = 'Live2DFactory';

export interface Class<T> {
    new(...args: any[]): T
}

export interface FactoryOptions extends Live2DModelOptions {
    /**
     * Options that will be passed to `PIXI.Loader#add`.
     * @default undefined
     */
    loaderOptions?: ILoaderOptions;

    /**
     * Use cache when loading model data.
     * @default true
     */
    modelDataCache?: boolean;

    /**
     * Use cache when loading textures.
     * @default true
     */
    textureCache?: boolean;
}

/**
 * Bundled resources for creating a `Live2DModel`.
 */
export interface Live2DResources {
    /**
     * The ModelSettings.
     */
    settings: ModelSettings;

    /**
     * Loaded model data.
     */
    model: ArrayBuffer;

    /**
     * Loaded textures.
     */
    textures: Texture[];

    /**
     * Loaded pose JSON.
     */
    pose?: any;

    /**
     * Loaded pose JSON.
     */
    physics?: any;
}

/**
 * Cached model data. Indexed with the URL.
 */
export const MODEL_DATA_CACHE: Record<string, ArrayBuffer> = {};

/**
 * Creates a `Live2DModel` from URL of model settings file.
 * @param url - The URL of model settings file that is typically named with `.model.json` extension.
 * @param options
 * @return Created `Live2DModel`.
 */
export async function fromModelSettingsFile<T extends Live2DModel>(this: Class<T>, url: string, options?: FactoryOptions): Promise<T> {
    return new Promise((resolve, reject) => {
        new Loader()
            .add(url, options?.loaderOptions)
            .load((loader: Loader, resources: Partial<Record<string, LoaderResource>>) => {
                const resource = resources[url]!;

                if (!resource.error) {
                    (fromModelSettingsJSON.call(this, resource.data, url, options) as Promise<T>).then(resolve).catch(reject);
                } else {
                    reject(resource.error);
                }
            })
            .on('error', reject);
    });
}

/**
 * Creates a `Live2DModel` from model settings JSON.
 * @param json - Model settings JSON
 * @param basePath - URL of the model settings file.
 * @param options
 * @return Created `Live2DModel`.
 */
export async function fromModelSettingsJSON<T extends Live2DModel>(this: Class<T>, json: ModelSettingsJSON, basePath: string, options?: FactoryOptions): Promise<T> {
    return await fromModelSettings.call(this, new ModelSettings(json, basePath), options) as T;
}

/**
 * Creates a `Live2DModel` from a {@link ModelSettings}.
 * @param settings
 * @param options
 * @return Created `Live2DModel`.
 */
export async function fromModelSettings<T extends Live2DModel>(this: Class<T>, settings: ModelSettings, options?: FactoryOptions): Promise<T> {
    return new Promise((resolve, reject) => {
        const resources: Partial<Live2DResources> = {
            settings,
            textures: [] as Texture[],
        };

        const loader = new Loader();

        const finish = (error?: Error) => {
            if (!error) {
                if (resources.model) {
                    try {
                        resolve(fromResources.call(this, resources as Live2DResources, options) as T);
                    } catch (e) {
                        error = e;
                    }
                } else {
                    error = new Error('Missing model data.');
                }
            }

            if (error) {
                // cancel all tasks
                loader.reset();
                reject(error);
            }
        };

        try {
            const modelURL = settings.resolvePath(settings.model);
            const modelCache = (options && 'modelDataCache' in options) ? options.modelDataCache : true;

            if (modelCache && MODEL_DATA_CACHE[modelURL]) {
                resources.model = MODEL_DATA_CACHE[modelURL];

                logger.log(TAG, `Loaded model data from cache (${resources.model!.byteLength}):`, modelURL);
            } else {
                loader.add(
                    modelURL,
                    Object.assign({ xhrType: LoaderResource.XHR_RESPONSE_TYPE.BUFFER }, options?.loaderOptions),
                    (modelRes: LoaderResource) => {
                        if (!modelRes.error) {
                            resources.model = modelRes.data;
                            logger.log(TAG, `Loaded model data (${resources.model!.byteLength}):`, modelRes.name);
                        } else {
                            finish(modelRes.error);
                        }
                    },
                );
            }

            const textureCache = (options && 'textureCache' in options) ? options.textureCache : true;

            settings.textures.forEach((texture: string, index: number) => {
                const textureURL = settings.resolvePath(texture);

                if (textureCache && TextureCache[textureURL]) {
                    const texture = TextureCache[textureURL];

                    resources.textures![index] = TextureCache[textureURL];

                    logger.log(TAG, `Loaded texture from cache (${texture.width}x${texture.height}):`, textureURL);
                } else if (!loader.resources[textureURL]) {
                    loader.add(textureURL, options?.loaderOptions, (textureRes: LoaderResource) => {
                            if (!textureRes.error) {
                                resources.textures![index] = textureRes.texture;
                                logger.log(TAG, `Loaded texture (${textureRes.texture.width}x${textureRes.texture.height}):`, textureRes.name);
                            } else {
                                logger.warn(TAG, `Failed to load texture from "${textureRes.url}"`, textureRes.error);
                            }
                        },
                    );
                }
            });

            if (settings.pose) {
                loader.add(settings.resolvePath(settings.pose), options?.loaderOptions, (poseRes: LoaderResource) => {
                        if (!poseRes.error) {
                            resources.pose = poseRes.data;
                            logger.log(TAG, `Loaded pose data:`, poseRes.name);
                        } else {
                            logger.warn(TAG, `Failed to load pose data from "${poseRes.url}"`, poseRes.error);
                        }
                    },
                );
            }

            if (settings.physics) {
                loader.add(settings.resolvePath(settings.physics), options?.loaderOptions, (physicsRes: LoaderResource) => {
                        if (!physicsRes.error) {
                            resources.physics = physicsRes.data;
                            logger.log(TAG, `Loaded physics data:`, physicsRes.name);
                        } else {
                            logger.warn(TAG, `Failed to load physics data from "${physicsRes.url}"`, physicsRes.error);
                        }
                    },
                );
            }

            loader.load(() => finish());
        } catch (e) {
            finish(e);
        }
    });
}

/**
 * Creates a `Live2DModel` from a {@link Live2DResources}.
 * @param resources
 * @param options
 * @return Created `Live2DModel`.
 */
export function fromResources<T extends Live2DModel>(this: Class<T>, resources: Live2DResources, options?: FactoryOptions): T {
    const coreModel = Live2DModelWebGL.loadModel(resources.model);

    const error = Live2D.getError();
    if (error) throw error;

    const internalModel = new Live2DInternalModel(coreModel, resources.settings);

    if (resources.pose) {
        internalModel.pose = new Live2DPose(coreModel, resources.pose);
    }

    if (resources.physics) {
        internalModel.physics = new Live2DPhysics(coreModel, resources.physics);
    }

    return new this(internalModel, resources.textures, options);
}
