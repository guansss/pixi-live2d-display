import { Live2DFactoryContext } from '@/factory';
import { Live2DLoaderContext } from '@/factory/Live2DLoader';
import { Middleware } from '@/utils/middleware';

declare global {
    interface File {
        webkitRelativePath?: string;
    }
}

/**
 * Experimental loader to load resources from uploaded files.
 */

export class FileLoader {
    static filesMap: {
        [settingsFile: string]: {
            [file: string]: string
        }
    } = {};

    static loader: Middleware<Live2DLoaderContext> = (context, next) => {
        // replace the relative URL with corresponding object URL
        if (context.baseURL) {
            context.url = FileLoader.filesMap[context.baseURL]?.[context.url] ?? context.url;
        }

        return next();
    };

    static factory: Middleware<Live2DFactoryContext> = (context, next) => {
        if (Array.isArray(context.source) && context.source[0] instanceof File) {
            // replace the source with an object URL of the settings file
            context.source = FileLoader.upload(context.source);
        }

        return next();
    };

    static upload(files: File[], settingsFile?: File): string {
        settingsFile ??= files.find(file => file.name.endsWith('.model.json') ?? file.name.endsWith('.model3.json'));

        if (!settingsFile) {
            throw new TypeError('Missing settings file.');
        }

        const settingsFileURL = URL.createObjectURL(settingsFile);

        const fileMap: Record<string, string> = {};

        files.forEach(file => {
            let id = file.webkitRelativePath || file.name;

            // remove the folder's name, only keep the path
            id = id.slice(id.indexOf('/') + 1);

            fileMap[id] = URL.createObjectURL(file);
        });

        this.filesMap[settingsFileURL] = fileMap;

        return settingsFileURL;
    }
}
