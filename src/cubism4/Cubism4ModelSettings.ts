import { ModelSettings } from '@/cubism-common/ModelSettings';
import { applyMixins } from '@/utils';
import { CubismModelSettingsJson } from '@cubism/settings/cubismmodelsettingsjson';

export interface Cubism4ModelSettings extends CubismModelSettingsJson {}

export class Cubism4ModelSettings extends ModelSettings {
    json!: CubismSpec.ModelJSON;

    moc!: string;
    textures!: string[];

    static isValidJSON(json: any): json is CubismSpec.ModelJSON {
        return !!json?.FileReferences
            && typeof json.FileReferences.Moc === 'string'
            && json.FileReferences.Textures?.length > 0

            // textures must be an array of strings
            && json.FileReferences.Textures.every((item: any) => typeof item === 'string');
    }

    constructor(json: CubismSpec.ModelJSON & { url: string }) {
        super(json);

        if (!Cubism4ModelSettings.isValidJSON(json)) {
            throw new TypeError('Invalid JSON.');
        }

        // this doesn't seem to be allowed in ES6 and above, calling it will cause an error:
        // "Class constructor CubismModelSettingsJson cannot be invoked without 'new'"

        // CubismModelSettingsJson.call(this, json);

        Object.assign(this, new CubismModelSettingsJson(json));
    }
}

applyMixins(Cubism4ModelSettings, [CubismModelSettingsJson]);
