import { Live2DLoader, LoaderTarget } from '@/loader/loader';
import { logger } from '@/utils';
import { url } from '@pixi/utils';

const TAG = 'XHRLoader';

export class XHRLoader implements Live2DLoader {
    static instance = new XHRLoader();

    xhrMap = new WeakMap<LoaderTarget, Set<XMLHttpRequest>>();

    allXhrSet = new Set<XMLHttpRequest>();

    loadJSON(url: string, target?: LoaderTarget): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = this.createXHR(target, url, resolve, reject);
            xhr.responseType = 'json';
            xhr.send();
        });
    }

    createXHR<Data extends any>(
        target: LoaderTarget | undefined,
        url: string,
        onload: (data: Data) => void,
        onerror: (e: Error) => void,
    ): XMLHttpRequest {
        const xhr = new XMLHttpRequest();

        this.allXhrSet.add(xhr);

        if (target) {
            let xhrSet = this.xhrMap.get(target);

            if (!xhrSet) {
                xhrSet = new Set([xhr]);
                this.xhrMap.set(target, xhrSet);
            } else {
                xhrSet.add(xhr);
            }
        }

        xhr.open('GET', url);
        xhr.onload = () => {
            if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
                onload(xhr.response);
            } else {
                (xhr.onerror as () => {})();
            }
        };
        xhr.onerror = () => {
            logger.warn(TAG, `Failed to load resource as ${xhr.responseType} (Status ${xhr.status}): ${url}`);
            onerror(new Error('Network error.'));
        };
        xhr.onabort = () => onerror(new Error('Aborted.'));
        xhr.onloadend = () => {
            this.allXhrSet.delete(xhr);

            if (target) {
                this.xhrMap.get(target)?.delete(xhr);
            }
        };

        return xhr;
    }

    resolveURL(path: string, baseURL: string): string {
        return url.resolve(baseURL, path);
    }

    loadResJSON(path: string, baseURL: string, target: LoaderTarget): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = this.createXHR(target, this.resolveURL(path, baseURL), resolve, reject);
            xhr.responseType = 'json';
            xhr.send();
        });
    }

    loadResArrayBuffer(path: string, baseURL: string, target: LoaderTarget): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const xhr = this.createXHR(target, this.resolveURL(path, baseURL), resolve, reject);
            xhr.responseType = 'arraybuffer';
            xhr.send();
        });
    }

    releaseTarget(target: LoaderTarget): void {
        this.xhrMap.get(target)?.forEach(xhr => {
            xhr.abort();
            this.allXhrSet.delete(xhr);
        });
        this.xhrMap.delete(target);
    }

    release() {
        this.allXhrSet.forEach(xhr => xhr.abort());
        this.allXhrSet.clear();
        this.xhrMap = new WeakMap();
    }
}
