import { ModelSettings } from '@/cubism-common/ModelSettings';
import { copyArray, copyProperty } from '../utils';

export class Cubism2ModelSettings extends ModelSettings {
    declare json: Cubism2Spec.ModelJSON;

    // files
    moc: string;
    textures!: string[];

    declare pose?: string;
    declare physics?: string;

    // metadata
    layout?: Cubism2Spec.Layout;
    hitAreas?: Cubism2Spec.HitArea[];
    initParams?: Cubism2Spec.InitParam[];
    initOpacities?: Cubism2Spec.InitOpacity[];

    // motions
    expressions?: Cubism2Spec.Expression[];
    motions: Record<string, Cubism2Spec.Motion[]> = {};

    /**
     * Checks if a JSON object is valid model settings.
     * @param json
     */
    static isValidJSON(json: any): json is Cubism2Spec.ModelJSON {
        // should always return a boolean
        return !!json
            && typeof json.model === 'string'
            && json.textures?.length > 0

            // textures must be an array of strings
            && json.textures.every((item: any) => typeof item === 'string');
    }

    constructor(json: Cubism2Spec.ModelJSON & { url: string }) {
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
     * Validates and copies *optional* properties from raw JSON.
     */
    protected copy(json: Cubism2Spec.ModelJSON): void {
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

    replaceFiles(replace: (file: string, path: string) => string) {
        super.replaceFiles(replace);

        for (const [group, motions] of Object.entries(this.motions)) {
            for (let i = 0; i < motions.length; i++) {
                motions[i]!.file = replace(motions[i]!.file, `motions.${group}[${i}].file`);

                if (motions[i]!.sound !== undefined) {
                    motions[i]!.sound = replace(motions[i]!.sound!, `motions.${group}[${i}].sound`);
                }
            }
        }

        if (this.expressions) {
            for (let i = 0; i < this.expressions.length; i++) {
                this.expressions[i]!.file = replace(this.expressions[i]!.file, `expressions[${i}].file`);
            }
        }
    }
}
