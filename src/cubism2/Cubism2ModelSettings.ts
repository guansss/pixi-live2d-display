import { ModelSettings } from '@/cubism-common/ModelSettings';
import { copyArray, copyProperty } from '../utils';
import ModelJSON = Cubism2Spec.ModelJSON;
import Layout = Cubism2Spec.Layout;
import HitArea = Cubism2Spec.HitArea;
import InitParam = Cubism2Spec.InitParam;
import InitOpacity = Cubism2Spec.InitOpacity;
import Expression = Cubism2Spec.Expression;
import Motion = Cubism2Spec.Motion;

/**
 * Normalized Live2D model settings.
 */
export class Cubism2ModelSettings extends ModelSettings<ModelJSON> {
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
        copyArray('string', this, json, 'textures', 'textures');

        this.copy(json);
    }

    /**
     * Validates and copies **optional** properties from raw JSON.
     * @param json
     */
    protected copy(json: ModelJSON): void {
        copyProperty('string', this, json, 'name', 'name');
        copyProperty('string', this, json, 'pose', 'pose');
        copyProperty('string', this, json, 'physics', 'physics');

        copyProperty('object', this, json, 'layout', 'layout');
        copyProperty('object', this, json, 'motions', 'motions');

        copyArray('object', this, json, 'hitAreas', 'hit_areas');
        copyArray('object', this, json, 'expressions', 'expressions');
        copyArray('object', this, json, 'initParams', 'init_params');
        copyArray('object', this, json, 'initOpacities', 'init_opacities');
    }
}
