import { ModelSettings } from '@/cubism-common/ModelSettings';
import { applyMixins } from '@/utils';
import { CubismModelSettingsJson } from '@cubism/settings/cubismmodelsettingsjson';
import { CubismModelSettingsDef } from '@cubism/settings/defs';

export interface Cubism4ModelSettings extends CubismModelSettingsJson {}

export class Cubism4ModelSettings extends ModelSettings<CubismModelSettingsDef> {
    moc!: string;
    textures!: string[];

    static isValidJSON(json: any): json is CubismModelSettingsDef {
        return !!json?.FileReferences &&
            typeof json.FileReferences.Moc === 'string' &&
            Array.isArray(json.FileReferences.Textures) &&

            // textures must be an array of strings
            json.FileReferences.Textures.every((item: any) => typeof item === 'string');
    }

    constructor(json: CubismModelSettingsDef) {
        super(json);

        if (!Cubism4ModelSettings.isValidJSON(json)) {
            throw new TypeError('Invalid JSON.');
        }

        CubismModelSettingsJson.call(this, json);
    }
}

applyMixins(Cubism4ModelSettings, [CubismModelSettingsJson]);
