import { Texture } from '@pixi/core';

export function createTexture(url: string, options: { crossOrigin?: string } = {}): Promise<Texture> {
    const textureOptions: any = { resourceOptions: { crossorigin: options.crossOrigin } };

    // there's already such a method since Pixi v5.3.0
    if ((Texture as any).fromURL) {
        return Texture.fromURL(url, textureOptions).catch(e => {
            if (e instanceof Error) {
                throw e;
            }

            // assume e is an ErrorEvent, let's convert it to an Error
            const err = new Error('Texture loading error');
            (err as any).event = e;

            throw err;
        });
    }

    // and in order to provide backward compatibility for older Pixi versions,
    // we have to manually implement this method
    // see https://github.com/pixijs/pixi.js/pull/6687/files

    textureOptions.resourceOptions.autoLoad = false;

    const texture = Texture.from(url, textureOptions);

    if (texture.baseTexture.valid) {
        return Promise.resolve(texture);
    }

    const resource = texture.baseTexture.resource as any;

    // before Pixi v5.2.2, the Promise will not be rejected when loading has failed,
    // we have to manually handle the "error" event
    // see https://github.com/pixijs/pixi.js/pull/6374
    resource._live2d_load ??= new Promise<Texture>((resolve, reject) => {
        const errorHandler = (event: ErrorEvent) => {
            (resource.source as HTMLImageElement).removeEventListener('error', errorHandler);

            // convert the ErrorEvent to an Error
            const err = new Error('Texture loading error');
            (err as any).event = event;

            reject(err);
        };

        (resource.source as HTMLImageElement).addEventListener('error', errorHandler);

        (resource.load() as Promise<unknown>).then(() => resolve(texture)).catch(errorHandler);
    });

    return resource._live2d_load;
}
