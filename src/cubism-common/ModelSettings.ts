import { folderName } from '@/utils';
import { url } from '@pixi/utils';

export abstract class ModelSettings {
    json: object;

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
    protected constructor(json: object) {
        this.json = json;

        let url = (json as any).url;

        if (typeof url !== 'string') {
            // this is not allowed because it'll typically result in errors, including a
            // fatal error - an OOM that crashes the browser while initializing this cubism2 model,
            // I'm not kidding!
            throw new TypeError('The `url` property must be specified in settings JSON.');
        }

        this.url = url;

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
