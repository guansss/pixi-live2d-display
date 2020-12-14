import { ModelSettings } from '@/cubism-common/ModelSettings';
import { applyMixins } from '@/utils';
import { CubismModelSettingsJson } from '@cubism/settings/cubismmodelsettingsjson';
import ModelJSON = CubismSpec.ModelJSON;

export interface Cubism4ModelSettings extends CubismModelSettingsJson {}

export class Cubism4ModelSettings extends ModelSettings<ModelJSON> {
    moc!: string;
    textures!: string[];

    static isValidJSON(json: any): json is ModelJSON {
        return !!json?.FileReferences &&
            typeof json.FileReferences.Moc === 'string' &&
            Array.isArray(json.FileReferences.Textures) &&

            // textures must be an array of strings
            json.FileReferences.Textures.every((item: any) => typeof item === 'string');
    }

    constructor(json: ModelJSON) {
        super(json);

        if (!Cubism4ModelSettings.isValidJSON(json)) {
            throw new TypeError('Invalid JSON.');
        }

        // this doesn't seem to be allowed in ES6 and above, calling it will throw an error:
        // "Class constructor CubismModelSettingsJson cannot be invoked without 'new'"

        // CubismModelSettingsJson.call(this, json);

        Object.assign(this, new CubismModelSettingsJson(json));
    }
}

applyMixins(Cubism4ModelSettings, [CubismModelSettingsJson]);
