import { XHRLoader } from '@/loader/XHRLoader';

declare global {
    interface File {
        webkitRelativePath?: string;
    }
}

/**
 * Experimental loader to load resources from uploaded files.
 */
export class FileLoader extends XHRLoader {
    static instance = new FileLoader();

    filesMap: Record<string, Record<string, string | undefined> | undefined> = {};

    upload(files: File[], settingsFile?: File): string {
        settingsFile ||= files.find(file => file.name.endsWith('.model.json') || file.name.endsWith('.model3.json'));

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

    resolveURL(path: string, baseURL: string): string {
        // resolve the path to related object URL
        return this.filesMap[baseURL]?.[path] ?? '';
    }
}
