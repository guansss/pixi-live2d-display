import { basename, dirname } from 'path';
import { resolve as urlResolve } from 'url';
import { cloneWithCamelCase } from '../utils';
import { ExpressionDefinition, Layout, ModelSettingsJSON, MotionDefinition } from './ModelSettingsJSON';

export class ModelSettings {
    readonly name?: string;

    // files
    readonly model: string = '';
    readonly preview?: string;
    readonly pose?: string;
    readonly physics?: string;
    readonly subtitle?: string;
    readonly textures: string[] = [];

    // metadata
    readonly layout?: Layout;
    readonly hitAreas?: { name: string; id: string }[];
    readonly initParams?: [{ id: string; value: number }];
    readonly initOpacities?: [{ id: string; value: number }];

    // motions
    readonly expressions?: ExpressionDefinition[];
    readonly motions: { [group: string]: MotionDefinition[] } = {};

    static isModelSettingsJSON(json: any): json is ModelSettingsJSON {
        return json && json.model && json.textures;
    }

    /**
     * @param json - The model settings JSON
     * @param path - Path of the model settings file, used to resolve paths of resources defined in settings.
     */
    constructor(readonly json: ModelSettingsJSON, readonly path: string) {
        if (!ModelSettings.isModelSettingsJSON(json)) {
            throw new TypeError('Invalid JSON.');
        }

        // set default name to folder's name
        this.name = basename(dirname(path));

        this.copy(cloneWithCamelCase(json));
    }

    resolvePath(path: string) {
        return urlResolve(this.path, path);
    }

    /**
     * Validates and copies properties from JSON.
     */
    private copy(json: any) {
        // begin essential properties

        copyProperty(this, json, 'model', 'string');

        if (!this.model) {
            throw new TypeError('Missing model file.');
        }

        if (json.textures) {
            this.textures.push(...json.textures.filter((file: any) => typeof file === 'string'));
        }

        if (this.textures.length === 0) {
            throw new TypeError('Missing textures.');
        }

        // end essential properties

        copyProperty(this, json, 'name', 'string');
        copyProperty(this, json, 'pose', 'string');
        copyProperty(this, json, 'preview', 'string');
        copyProperty(this, json, 'physics', 'string');
        copyProperty(this, json, 'subtitle', 'string');

        if (json.layout && typeof json.layout === 'object') {
            // @ts-ignore
            this.layout = {};

            // copy only the number properties
            for (const [key, value] of Object.entries(json.layout)) {
                if (!isNaN(value as number)) {
                    (this.layout as any)[key] = value;
                }
            }
        }

        if (Array.isArray(json.hitAreas)) {
            const filter = (hitArea: any) => typeof hitArea.name === 'string' && typeof hitArea.id === 'string';
            // @ts-ignore
            this.hitAreas = json.hitAreas.filter(filter);
        }

        if (Array.isArray(json.expressions)) {
            const filter = (exp: any) => typeof exp.name === 'string' && typeof exp.file === 'string';
            // @ts-ignore
            this.expressions = json.expressions.filter(filter);
        }

        if (Array.isArray(json.initParam)) {
            const filter = (param: any) => typeof param.id === 'string' && typeof param.value === 'string';
            // @ts-ignore
            this.initParams = json.initParam.filter(filter);
        }

        if (Array.isArray(json.initPartsVisible)) {
            const filter = (param: any) => typeof param.id === 'string' && typeof param.value === 'string';
            // @ts-ignore
            this.initOpacities = json.initPartsVisible.filter(filter);
        }

        if (json.motions && typeof json.motions === 'object') {
            for (const [group, motionGroup] of Object.entries(json.motions)) {
                if (Array.isArray(motionGroup)) {
                    this.motions[group] = motionGroup

                    // filter out the motions without `file` defined
                        .filter(motion => motion && typeof motion.file === 'string')

                        // copy only the valid properties
                        .map((motion: any) => {
                            const copy: MotionDefinition = {
                                file: motion.file,
                            };

                            copyProperty(copy, motion, 'sound', 'string');
                            copyProperty(copy, motion, 'subtitle', 'string');
                            copyProperty(copy, motion, 'season', 'string');
                            copyProperty(copy, motion, 'fadeIn', 'number');
                            copyProperty(copy, motion, 'fadeOut', 'number');
                            copyProperty(copy, motion, 'time', 'number');

                            return copy;
                        });
                }
            }
        }
    }
}

/**
 * Copies a property at `path` only if it matches the `type`.
 */
function copyProperty(dest: any, src: any, path: string, type: string) {
    const value = src[path];

    if (typeof value === type) {
        dest[path] = value;
    }
}
