import { ModelSettings } from '@/cubism-common/ModelSettings';
import { applyMixins } from '@/utils';
import { CubismModelSettingsJson } from '@cubism/settings/cubismmodelsettingsjson';
import Model3 = CubismSpec.Model3;

export interface Cubism4ModelSettings extends CubismModelSettingsJson {}

export class Cubism4ModelSettings extends ModelSettings<Model3> {
    moc!: string;
    textures!: string[];

    static isValidJSON(json: any): json is Model3 {
        return !!json?.FileReferences &&
            typeof json.FileReferences.Moc === 'string' &&
            Array.isArray(json.FileReferences.Textures) &&

            // textures must be an array of strings
            json.FileReferences.Textures.every((item: any) => typeof item === 'string');
    }

    constructor(json: Model3) {
        super(json);

        if (!Cubism4ModelSettings.isValidJSON(json)) {
            throw new TypeError('Invalid JSON.');
        }

        CubismModelSettingsJson.call(this, json);
    }
}

applyMixins(Cubism4ModelSettings, [CubismModelSettingsJson]);
