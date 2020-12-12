import { Live2DLoaderContext, Live2DLoaderTarget } from '@/factory/Live2DLoader';
import { logger } from '@/utils';
import { Middleware } from '@/utils/middleware';
import { url } from '@pixi/utils';

const TAG = 'XHRLoader';

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
        type: 'json' | 'arraybuffer',
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

            if (!target.listeners('destroy').includes(this.cancelXHRs)) {
                target.once('destroy', this.cancelXHRs, this);
            }
        }

        xhr.open('GET', url);
        xhr.responseType = type;
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

    static cancelXHRs(target: Live2DLoaderTarget) {
        this.xhrMap.get(target)?.forEach(xhr => {
            xhr.abort();
            this.allXhrSet.delete(xhr);
        });
        this.xhrMap.delete(target);
    }

    static release() {
        this.allXhrSet.forEach(xhr => xhr.abort());
        this.allXhrSet.clear();
        this.xhrMap = new WeakMap();
    }
}
