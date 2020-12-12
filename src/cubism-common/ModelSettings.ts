import { folderName } from '@/utils';
import { url } from '@pixi/utils';

export abstract class ModelSettings<ModelSettingsSpec = any> {
    json: ModelSettingsSpec;

    /**
     * Model's name, typically for displaying or logging.
     */
    name: string;

    /**
     * Path of the model settings file, used to resolve paths of resources defined in settings.
     */
    url: string;

    // common resource files
    abstract moc: string;
    abstract textures: string[];
    pose?: string;
    physics?: string;

    /**
     * @param json - The raw JSON.
     */
    protected constructor(json: ModelSettingsSpec) {
        this.json = json;

        let url = (json as any).url;
        this.url = typeof url === 'string' ? url : '';

        // set default name to folder's name
        this.name = folderName(this.url);
    }

    /**
     * Resolves a relative path to be absolute using {@link ModelSettings.url}.
     * @param path
     */
    resolveURL(path: string): string {
        return url.resolve(this.url, path);
    }
}
