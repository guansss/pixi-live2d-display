import { Live2DLoaderContext, Live2DLoaderTarget } from '@/factory/Live2DLoader';
import { logger } from '@/utils';
import { Middleware } from '@/utils/middleware';

const TAG = 'XHRLoader';

class NetworkError extends Error {
    constructor(message: string, public url: string, public status: number, public aborted = false) {
        super(message);
    }
}

/**
 * The basic XHR loader.
 *
 * A network error will be thrown with the following properties:
 * - `url` - The request URL.
 * - `status` - The HTTP status.
 * - `aborted` - True if the error is caused by aborting the XHR.
 */
export class XHRLoader {
    /**
     * All the created XHRs, keyed by their owners respectively.
     */
    static xhrMap = new WeakMap<Live2DLoaderTarget, Set<XMLHttpRequest>>();

    /**
     * All the created XHRs as a flat array.
     */
    static allXhrSet = new Set<XMLHttpRequest>();

    /**
     * Middleware for Live2DLoader.
     */
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

    /**
     * Creates a managed XHR.
     * @param target - If provided, the XHR will be canceled when receiving an "destroy" event from the target.
     * @param url - The URL.
     * @param type - The XHR response type.
     * @param onload - Load listener.
     * @param onerror - Error handler.
     */
    static createXHR<T = any>(
        target: Live2DLoaderTarget | undefined,
        url: string,
        type: XMLHttpRequestResponseType,
        onload: (data: T) => void,
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
            onerror(new NetworkError('Network error.', url, xhr.status));
        };
        xhr.onabort = () => onerror(new NetworkError('Aborted.', url, xhr.status, true));
        xhr.onloadend = () => {
            XHRLoader.allXhrSet.delete(xhr);

            if (target) {
                XHRLoader.xhrMap.get(target)?.delete(xhr);
            }
        };

        return xhr;
    }

    /**
     * Cancels all XHRs related to this target.
     */
    static cancelXHRs(this: Live2DLoaderTarget) {
        XHRLoader.xhrMap.get(this)?.forEach(xhr => {
            xhr.abort();
            XHRLoader.allXhrSet.delete(xhr);
        });
        XHRLoader.xhrMap.delete(this);
    }

    /**
     * Release all XHRs.
     */
    static release() {
        XHRLoader.allXhrSet.forEach(xhr => xhr.abort());
        XHRLoader.allXhrSet.clear();
        XHRLoader.xhrMap = new WeakMap();
    }
}
