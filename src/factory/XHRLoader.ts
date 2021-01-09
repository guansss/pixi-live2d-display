import { Live2DLoaderContext, Live2DLoaderTarget } from '@/factory/Live2DLoader';
import { logger } from '@/utils';
import { Middleware } from '@/utils/middleware';

const TAG = 'XHRLoader';

function createNetworkError(message: string, url: string, status: number, aborted = false): Error {
    const err = new Error(message);
    (err as any).url = url;
    (err as any).status = status;
    (err as any).aborted = aborted;

    return err;
}

export class XHRLoader {
    static xhrMap = new WeakMap<Live2DLoaderTarget, Set<XMLHttpRequest>>();
    static allXhrSet = new Set<XMLHttpRequest>();

    static loader: Middleware<Live2DLoaderContext> = (context, next) => {
        return new Promise<void>((resolve, reject) => {
            const xhr = XHRLoader.createXHR(
                context.target,
                context.settings ? context.settings.resolveURL(context.url) : context.url,
                context.type,
                data => {
                    context.result = data;
                    resolve();
                },
                reject,
            );
            xhr.send();
        });
    };

    static createXHR<Data extends any>(
        target: Live2DLoaderTarget | undefined,
        url: string,
        type: XMLHttpRequestResponseType,
        onload: (data: Data) => void,
        onerror: (e: Error) => void,
    ): XMLHttpRequest {
        const xhr = new XMLHttpRequest();

        XHRLoader.allXhrSet.add(xhr);

        if (target) {
            let xhrSet = XHRLoader.xhrMap.get(target);

            if (!xhrSet) {
                xhrSet = new Set([xhr]);
                XHRLoader.xhrMap.set(target, xhrSet);
            } else {
                xhrSet.add(xhr);
            }

            if (!target.listeners('destroy').includes(XHRLoader.cancelXHRs)) {
                target.once('destroy', XHRLoader.cancelXHRs);
            }
        }

        xhr.open('GET', url);
        xhr.responseType = type;
        xhr.onload = () => {
            if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
                onload(xhr.response);
            } else {
                (xhr.onerror as any)();
            }
        };
        xhr.onerror = () => {
            logger.warn(TAG, `Failed to load resource as ${xhr.responseType} (Status ${xhr.status}): ${url}`);
            onerror(createNetworkError('Network error.', url, xhr.status));
        };
        xhr.onabort = () => onerror(createNetworkError('Aborted.', url, xhr.status, true));
        xhr.onloadend = () => {
            XHRLoader.allXhrSet.delete(xhr);

            if (target) {
                XHRLoader.xhrMap.get(target)?.delete(xhr);
            }
        };

        return xhr;
    }

    static cancelXHRs(this: Live2DLoaderTarget) {
        XHRLoader.xhrMap.get(this)?.forEach(xhr => {
            xhr.abort();
            XHRLoader.allXhrSet.delete(xhr);
        });
        XHRLoader.xhrMap.delete(this);
    }

    static release() {
        XHRLoader.allXhrSet.forEach(xhr => xhr.abort());
        XHRLoader.allXhrSet.clear();
        XHRLoader.xhrMap = new WeakMap();
    }
}
