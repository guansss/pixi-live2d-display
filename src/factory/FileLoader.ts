import { InternalModel, ModelSettings } from '@/cubism-common';
import { Live2DFactory, Live2DFactoryContext } from '@/factory';
import { Middleware } from '@/utils/middleware';
import { url as urlUtils } from '@pixi/utils';

declare global {
    interface File {
        readonly webkitRelativePath: string;
    }
}

declare module '@/cubism-common/ModelSettings' {
    interface ModelSettings {
        /** @ignore */
        _objectURL?: string;
    }
}

export type ExtendedFileList = File[] & { settings?: ModelSettings }

/**
 * Experimental loader to load resources from uploaded files.
 *
 * This loader relies on
 * [webkitRelativePath](https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath)
 * to recognize the file path.
 *
 * Though named as a "Loader", this class has nothing to do with Live2DLoader,
 * it only contains a middleware for the Live2DFactory.
 */
export class FileLoader {
    /**
     * Stores all the object URLs of uploaded files.
     */
    static filesMap: {
        [settingsFileURL: string]: {
            [resourceFileURL: string]: string
        }
    } = {};

    /**
     * Resolves the path of a resource file to the object URL.
     * @param settingsURL - Object URL of the settings file.
     * @param filePath - Resource file path.
     * @return Resolved object URL.
     */
    static resolveURL(settingsURL: string, filePath: string): string {
        const resolved = FileLoader.filesMap[settingsURL]?.[filePath];

        if (resolved === undefined) {
            throw new Error('Cannot find this file from uploaded files: ' + filePath);
        }

        return resolved;
    }

    /**
     * Middleware for Live2DFactory.
     */
    static factory: Middleware<Live2DFactoryContext> = async (context, next) => {
        if (Array.isArray(context.source) && context.source[0] instanceof File) {
            const files = context.source as File[];

            let settings = (files as ExtendedFileList).settings;

            if (!settings) {
                settings = await FileLoader.createSettings(files);
            } else if (!settings._objectURL) {
                throw  new Error('"_objectURL" must be specified in ModelSettings');
            }

            settings.validateFiles(files.map(file => encodeURI(file.webkitRelativePath)));

            await FileLoader.upload(files, settings);

            // override the default method to resolve URL from uploaded files
            settings.resolveURL = function(url) {
                return FileLoader.resolveURL(this._objectURL!, url);
            };

            context.source = settings;

            // clean up when destroying the model
            context.live2dModel.once('modelLoaded', (internalModel: InternalModel) => {
                internalModel.once('destroy', function(this: InternalModel) {
                    const objectURL = this.settings._objectURL!;

                    URL.revokeObjectURL(objectURL);

                    if (FileLoader.filesMap[objectURL]) {
                        for (const resourceObjectURL of Object.values(FileLoader.filesMap[objectURL]!)) {
                            URL.revokeObjectURL(resourceObjectURL);
                        }
                    }

                    delete FileLoader.filesMap[objectURL];
                });
            });
        }

        return next();
    };

    /**
     * Consumes the files by storing their object URLs. Files not defined in the settings will be ignored.
     */
    static async upload(files: File[], settings: ModelSettings): Promise<void> {
        const fileMap: Record<string, string> = {};

        // only consume the files defined in settings
        for (const definedFile of settings.getDefinedFiles()) {
            const actualPath = decodeURI(urlUtils.resolve(settings.url, definedFile));

            const actualFile = files.find(file => file.webkitRelativePath === actualPath);

            if (actualFile) {
                fileMap[definedFile] = URL.createObjectURL(actualFile);
            }
        }

        FileLoader.filesMap[settings._objectURL!] = fileMap;
    }

    /**
     * Creates a ModelSettings by given files.
     * @return Promise that resolves with the created ModelSettings.
     */
    static async createSettings(files: File[]): Promise<ModelSettings> {
        const settingsFile = files.find(file => file.name.endsWith('model.json') || file.name.endsWith('model3.json'));

        if (!settingsFile) {
            throw new TypeError('Settings file not found');
        }

        const settingsText = await FileLoader.readText(settingsFile);
        const settingsJSON = JSON.parse(settingsText);

        settingsJSON.url = settingsFile.webkitRelativePath;

        const runtime = Live2DFactory.findRuntime(settingsJSON);

        if (!runtime) {
            throw new Error('Unknown settings JSON');
        }

        const settings = runtime.createModelSettings(settingsJSON);

        settings._objectURL = URL.createObjectURL(settingsFile);

        return settings;
    }

    /**
     * Reads a file as text in UTF-8.
     */
    static async readText(file: File): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file, 'utf8');
        });
    }
}

Live2DFactory.live2DModelMiddlewares.unshift(FileLoader.factory);
