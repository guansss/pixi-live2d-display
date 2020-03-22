import ModelSettings from '@/live2d/ModelSettings';
import { log, warn } from '@/utils/log';
import { Loader, LoaderResource } from '@pixi/loaders';
import { parse as urlParse, resolve as urlResolve } from 'url';

export interface Live2DResource extends LoaderResource {
    modelSettings: ModelSettings;
    model: ArrayBuffer;
    textures: PIXI.ITextureDictionary;
    pose?: any;
    physics?: any;
}

const TAG = 'Live2DLoader';

export class Live2DLoader implements PIXI.ILoaderPlugin {
    static use(this: Loader, resource: LoaderResource, next: (...args: any[]) => {}) {
        // skip if the resource is not a model.json
        if (!resource.data
            || resource.type !== LoaderResource.TYPE.JSON
            || !ModelSettings.isModelSettingsJSON(resource.data)
        ) {
            next();
            return;
        }

        const live2DResource = resource as Live2DResource;

        const basePath = urlParse(live2DResource.url).pathname || '';

        let settings;

        try {
            settings = new ModelSettings(resource.data, basePath);
        } catch (e) {
            next(e);
            return;
        }

        const baseLoaderOptions = {
            crossOrigin: live2DResource.crossOrigin,
            parentResource: live2DResource,
        };

        // load core model

        const modelURL = urlResolve(basePath, settings.model);

        if (!this.resources[modelURL]) {
            this.add(
                modelURL,
                Object.assign(
                    { xhrType: LoaderResource.XHR_RESPONSE_TYPE.BUFFER },
                    baseLoaderOptions,
                ),
                (modelRes: LoaderResource) => {
                    if (modelRes.error) {
                        warn(TAG, `Failed to load model data from "${modelURL}"`, modelRes.error);
                        next(modelRes.error);
                        return;
                    }

                    live2DResource.model = modelRes.data;

                    log(`Loaded model data (${live2DResource.model.byteLength}) :`, modelRes.name);

                    next();
                },
            );
        }

        // load textures

        live2DResource.textures = {};

        settings.textures.forEach((texture: string, index: number) => {
            const textureURL = urlResolve(basePath, texture);

            if (!this.resources[textureURL]) {
                this.add(textureURL, baseLoaderOptions, (textureRes: LoaderResource) => {
                        if (textureRes.error) {
                            warn(TAG, `Failed to load texture from "${textureURL}"`, textureRes.error);
                            next(textureRes.error);
                            return;
                        }

                    live2DResource.textures![index] = textureRes.texture;

                    log(`Loaded texture (${textureRes.texture.width}x${textureRes.texture.height}) :`, textureRes.name);

                        next();
                    },
                );
            }
        });

        // load pose

        if (settings.pose) {
            const poseURL = urlResolve(basePath, settings.pose);

            if (!this.resources[poseURL]) {
                this.add(poseURL, baseLoaderOptions, (poseRes: LoaderResource) => {
                        if (poseRes.error) {
                            warn(TAG, `Failed to load pose data from "${poseURL}"`, poseRes.error);
                            next(poseRes.error);
                            return;
                        }

                    live2DResource.pose = poseRes.data;

                    log(`Loaded pose data :`, poseRes.name);

                        next();
                    },
                );
            }
        }

        // load physics

        if (settings.physics) {
            const physicsURL = urlResolve(basePath, settings.physics);

            if (!this.resources[physicsURL]) {
                this.add(physicsURL, baseLoaderOptions, (physicsRes: LoaderResource) => {
                        if (physicsRes.error) {
                            warn(TAG, `Failed to load physics data from "${physicsURL}"`, physicsRes.error);
                            next(physicsRes.error);
                            return;
                        }

                    live2DResource.physics = physicsRes.data;

                    log(`Loaded physics data :`, physicsRes.name);

                        next();
                    },
                );
            }
        }
    }
}
