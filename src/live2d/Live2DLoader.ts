import { ModelSettingsJSON } from '@/live2d/ModelSettingsJson';
import { Loader, LoaderResource } from '@pixi/loaders';
import { parse as urlParse, resolve as urlResolve } from 'url';

export interface Live2DResource extends LoaderResource {
    model: ArrayBuffer;
    textures: PIXI.ITextureDictionary;
    pose?: any;
    physics?: any;
}

function isModelSettingsJSON(json: any) {
    return json && json.model && json.textures;
}

export class Live2DLoader implements PIXI.ILoaderPlugin {

    static use(this: Loader, resource: LoaderResource, next: (...args: any[]) => {}) {
        // skip if the resource is not a model.json
        if (!resource.data
            || resource.type !== LoaderResource.TYPE.JSON
            || !isModelSettingsJSON(resource.data)
        ) {
            next();
            return;
        }

        const settings = resource.data as ModelSettingsJSON;
        const basePath = urlParse(resource.url).pathname || '';

        // load core model

        const modelURL = urlResolve(basePath, settings.model);

        if (!this.resources[modelURL]) {
            this.add(
                modelURL,
                {
                    crossOrigin: resource.crossOrigin,
                    xhrType: LoaderResource.XHR_RESPONSE_TYPE.BUFFER,
                    parentResource: resource,
                },
                (modelRes: LoaderResource) => {
                    if (modelRes.error) {
                        next(modelRes.error);
                        return;
                    }

                    console.log('Model Res:', modelRes.name);

                    (resource as Live2DResource).model = modelRes.data;

                    next();
                },
            );
        }

        // load textures

        resource.textures = {};

        settings.textures.forEach((texture: string, index: number) => {
            const textureURL = urlResolve(basePath, texture);

            if (!this.resources[textureURL]) {
                this.add(
                    textureURL,
                    {
                        crossOrigin: resource.crossOrigin,
                        parentResource: resource,
                    },
                    (textureRes: LoaderResource) => {
                        if (textureRes.error) {
                            next(textureRes.error);
                            return;
                        }

                        resource.textures![index] = textureRes.texture;

                        console.log('Texture Res:', textureRes.name, Object.keys(resource.textures!));

                        next();
                    },
                );
            }
        });

        // load pose

        if (settings.pose) {
            const poseURL = urlResolve(basePath, settings.pose);

            if (!this.resources[poseURL]) {
                this.add(
                    poseURL,
                    {
                        crossOrigin: resource.crossOrigin,
                        parentResource: resource,
                    },
                    (poseRes: LoaderResource) => {
                        if (poseRes.error) {
                            next(poseRes.error);
                            return;
                        }

                        (resource as Live2DResource).pose = poseRes.data;

                        console.log('Pose Res:', poseRes.name);

                        next();
                    },
                );
            }
        }

        // load physics

        if (settings.physics) {
            const physicsURL = urlResolve(basePath, settings.physics);

            if (!this.resources[physicsURL]) {
                this.add(
                    physicsURL,
                    {
                        crossOrigin: resource.crossOrigin,
                        parentResource: resource,
                    },
                    (physicsRes: LoaderResource) => {
                        if (physicsRes.error) {
                            next(physicsRes.error);
                            return;
                        }

                        (resource as Live2DResource).physics = physicsRes.data;

                        console.log('Physics Res:', physicsRes.name);

                        next();
                    },
                );
            }
        }
    }
}
