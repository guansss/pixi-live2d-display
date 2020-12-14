import { ModelSettings } from '@/cubism-common/ModelSettings';
import { copyArray, copyProperty } from '../utils';
import Expression = Cubism2Spec.Expression;
import HitArea = Cubism2Spec.HitArea;
import InitOpacity = Cubism2Spec.InitOpacity;
import InitParam = Cubism2Spec.InitParam;
import Layout = Cubism2Spec.Layout;
import ModelJSON = Cubism2Spec.ModelJSON;
import Motion = Cubism2Spec.Motion;

/**
 * Normalized Live2D model settings.
 */
export class Cubism2ModelSettings extends ModelSettings {
    json!: ModelJSON;

    // files
    moc: string;
    textures!: string[];
    pose?: string;
    physics?: string;

    // metadata
    layout?: Layout;
    hitAreas?: HitArea[];
    initParams?: InitParam[];
    initOpacities?: InitOpacity[];

    // motions
    expressions?: Expression[];
    motions: Record<string, Motion[]> = {};

    /**
     * Checks if a JSON object is valid model settings.
     * @param json
     */
    static isValidJSON(json: any): json is ModelJSON {
        // should always return a boolean
        return !!json
            && typeof json.model === 'string'
            && Array.isArray(json.textures)

            // textures must be an array of strings
            && json.textures.every((item: any) => typeof item === 'string');
    }

    constructor(json: ModelJSON) {
        super(json);

        if (!Cubism2ModelSettings.isValidJSON(json)) {
            throw new TypeError('Invalid JSON.');
        }

        this.moc = json.model;

        // copy textures array
        copyArray('string', json, this, 'textures', 'textures');

        this.copy(json);
    }

    /**
     * Validates and copies **optional** properties from raw JSON.
     * @param json
     */
    protected copy(json: ModelJSON): void {
        copyProperty('string', json, this, 'name', 'name');
        copyProperty('string', json, this, 'pose', 'pose');
        copyProperty('string', json, this, 'physics', 'physics');

        copyProperty('object', json, this, 'layout', 'layout');
        copyProperty('object', json, this, 'motions', 'motions');

        copyArray('object', json, this, 'hit_areas', 'hitAreas');
        copyArray('object', json, this, 'expressions', 'expressions');
        copyArray('object', json, this, 'init_params', 'initParams');
        copyArray('object', json, this, 'init_opacities', 'initOpacities');
    }
}
