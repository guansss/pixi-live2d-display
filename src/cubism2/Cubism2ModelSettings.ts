import { ModelSettings } from '@/cubism-common/ModelSettings';
import { copyArray, copyProperty } from '../utils';
import {
    Cubism2ExpressionDef,
    Cubism2HitAreaDef,
    Cubism2InitOpacitiesDef,
    Cubism2InitParamsDef,
    Cubism2LayoutDef,
    Cubism2ModelSettingsDef,
    Cubism2MotionDef,
} from './defs';

/**
 * Normalized Live2D model settings.
 */
export class Cubism2ModelSettings extends ModelSettings<Cubism2ModelSettingsDef> {
    // files
    moc: string;
    textures!: string[];
    pose?: string;
    physics?: string;

    // metadata
    layout?: Cubism2LayoutDef;
    hitAreas?: Cubism2HitAreaDef[];
    initParams?: Cubism2InitParamsDef[];
    initOpacities?: Cubism2InitOpacitiesDef[];

    // motions
    expressions?: Cubism2ExpressionDef[];
    motions: Record<string, Cubism2MotionDef[]> = {};

    /**
     * Checks if a JSON object is valid model settings.
     * @param json
     */
    static isValidJSON(json: any): json is Cubism2ModelSettingsDef {
        // should always return a boolean
        return !!json
            && typeof json.model === 'string'
            && Array.isArray(json.textures)

            // textures array must include at least one string
            && json.textures.some((item: any) => typeof item === 'string');
    }

    constructor(json: Cubism2ModelSettingsDef) {
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
    protected copy(json: Cubism2ModelSettingsDef): void {
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
