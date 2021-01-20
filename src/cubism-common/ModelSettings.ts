import { folderName } from '@/utils';
import { url } from '@pixi/utils';

/**
 * Parses, and provides access to the settings JSON.
 */
export abstract class ModelSettings {
    json: JSONObject;

    /**
     * The model's name, typically used for displaying or logging. By default it's inferred from
     * the URL by taking the folder name (the second to last component). In Cubism 2 it'll be overwritten
     * by the `name` field of settings JSON.
     */
    name: string;

    /**
     * URL of the model settings file, used to resolve paths of the resource files defined in settings.
     * This typically ends with `.model.json` in Cubism 2 and `.model3.json` in Cubism 4.
     */
    url: string;

    /**
     * Relative path of he moc file, typically ends with `.moc` in Cubism 2 and `.moc3` in Cubism 4.
     */
    abstract moc: string;

    /**
     * Relative paths of the texture images.
     */
    abstract textures: string[];

    /**
     * Relative path of the pose file.
     */
    pose?: string;

    /**
     * Relative path of the physics file.
     */
    physics?: string;

    /**
     * @param json - The settings JSON object.
     * @param json.url - The `url` field must be defined to specify the settings file's URL.
     */
    protected constructor(json: JSONObject & { url: string }) {
        this.json = json;

        let url = (json as any).url;

        if (typeof url !== 'string') {
            // this is not allowed because it'll typically result in errors, including a
            // fatal error - an OOM that crashes the browser while initializing this cubism2 model,
            // I'm not kidding!
            throw new TypeError('The `url` field in settings JSON must be defined as a string.');
        }

        this.url = url;

        // set default name to folder's name
        this.name = folderName(this.url);
    }

    /**
     * Resolves a relative path using the {@link url}. This is used to resolve the resource files
     * defined in the settings.
     * @param path - Relative path.
     * @return Resolved path.
     */
    resolveURL(path: string): string {
        return url.resolve(this.url, path);
    }

    /**
     * Replaces the resource files by running each file through the `replacer`.
     * @param replacer - Invoked with two arguments: `(file, path)`, where `file` is the file definition,
     * and `path` is its property path in the ModelSettings instance. A string must be returned to be the replacement.
     *
     * ```js
     * modelSettings.replaceFiles((file, path) => {
     *     // file = "foo.moc", path = "moc"
     *     // file = "foo.png", path = "textures[0]"
     *     // file = "foo.mtn", path = "motions.idle[0].file"
     *     // file = "foo.motion3.json", path = "motions.idle[0].File"
     *
     *     return "bar/" + file;
     * });
     * ```
     */
    replaceFiles(replacer: (file: string, path: string) => string) {
        this.moc = replacer(this.moc, 'moc');

        if (this.pose !== undefined) {
            (this.pose = replacer(this.pose, 'pose'));
        }

        if (this.physics !== undefined) {
            (this.physics = replacer(this.physics, 'physics'));
        }

        for (let i = 0; i < this.textures.length; i++) {
            this.textures[i] = replacer(this.textures[i]!, `textures[${i}]`);
        }
    };

    /**
     * Retrieves all resource files defined in the settings.
     * @return A flat array of the paths of all resource files.
     *
     * ```js
     * modelSettings.getDefinedFiles();
     * // returns: ["foo.moc", "foo.png", ...]
     * ```
     */
    getDefinedFiles(): string[] {
        const files: string[] = [];

        this.replaceFiles((file: string) => {
            files.push(file);

            return file;
        });

        return files;
    }

    // TODO: return valid files
    /**
     * Validates that the essential files defined in the settings exist in given files. Each file will be
     * resolved by {@link resolveURL} before comparison.
     * @param files - A flat array of file paths.
     * @throws Error if any file is defined in settings but not included in given files.
     */
    validateFiles(files: string[]) {
        const assertFileExists = (expectedFile: string) => {
            const actualPath = this.resolveURL(expectedFile);

            if (!files.includes(actualPath)) {
                throw new Error(`File "${expectedFile}" is defined in settings, but doesn't exist in given files`);
            }
        };

        assertFileExists(this.moc);

        this.textures.forEach(assertFileExists);
    }
}
