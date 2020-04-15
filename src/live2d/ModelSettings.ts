import { basename, dirname } from 'path';
import { resolve as urlResolve } from 'url';
import { cloneWithCamelCase, copyArray, copyArrayDeep, copyProperty } from '../utils';
import { ExpressionDefinition, Layout, ModelSettingsJSON, MotionDefinition } from './ModelSettingsJSON';

/**
 * The container of Live2D model settings.
 *
 * The structure of properties is the same as a raw model settings JSON,
 * but **all the keys are converted into camelCase**.
 *
 * @example
 * ```js
 * let settings = new ModelSettings({
 *     "motions": {
 *         "tap_body": []
 *     }
 * }, 'path/to/my-model.model.json');
 *
 * let tapBodyMotions = settings.motion.tapBody;
 * ```
 */
export class ModelSettings {
    name?: string;

    // files
    model: string = '';
    pose?: string;
    physics?: string;
    textures: string[] = [];

    // metadata
    layout?: Layout;
    hitAreas?: { name: string; id: string }[];
    initParams?: { id: string; value: number }[];
    initOpacities?: { id: string; value: number }[];

    // motions
    expressions?: ExpressionDefinition[];
    motions: { [group: string]: MotionDefinition[] } = {};

    /**
     * Checks if a JSON object is valid model settings.
     * @param json
     */
    static isModelSettingsJSON(json: any): json is ModelSettingsJSON {
        return json && json.model && json.textures?.length > 0;
    }

    /**
     * @param json - The model settings JSON.
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

    /**
     * Resolves a relative path to be absolute using {@link ModelSettings.path}.
     * @param path
     */
    resolvePath(path: string): string {
        return urlResolve(this.path, path);
    }

    /**
     * Validates and copies properties from raw JSON.
     * @param json
     */
    protected copy(json: ModelSettingsJSON): void {
        copyProperty(this, json, 'model', 'string');

        if (!this.model) {
            throw new TypeError('Missing model file.');
        }

        copyArray(this, json, 'textures', 'string');

        if (this.textures.length === 0) {
            throw new TypeError('Missing textures.');
        }

        copyProperty(this, json, 'name', 'string');
        copyProperty(this, json, 'pose', 'string');
        copyProperty(this, json, 'physics', 'string');

        if (json.layout && typeof json.layout === 'object') {
            this.layout = {};

            // copy only the number properties
            for (const [key, value] of Object.entries(json.layout)) {
                if (!isNaN(value as number)) {
                    (this.layout as any)[key] = value;
                }
            }
        }

        copyArrayDeep(this, json, 'hitAreas', { name: 'string', id: 'string' });
        copyArrayDeep(this, json, 'expressions', { name: 'string', file: 'string' });
        copyArrayDeep(this, json, 'initParams', { id: 'string', value: 'string' });
        copyArrayDeep(this, json, 'initOpacities', { id: 'string', value: 'string' });

        // copy all motion groups
        if (json.motions && typeof json.motions === 'object') {
            for (const group of Object.keys(json.motions)) {
                copyArrayDeep(this.motions, json.motions, group, { file: 'string' });
            }
        }
    }
}
