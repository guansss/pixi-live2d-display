import { Loader, LoaderResource } from '@pixi/loaders';

export function remoteRequire(path) {
    return require('electron').remote.require('../../../test/' + path);
}

export function loadArrayBuffer(url) {
    return new Promise((resolve, reject) => {
        new Loader()
            .add(url, { xhrType: LoaderResource.XHR_RESPONSE_TYPE.BUFFER })
            .load((loader, resources) => {
                const resource = resources[url];

                if (!resource.error) {
                    resolve(resource.data);
                } else {
                    reject(resource.error);
                }
            })
            .on('error', reject);
    });
}

export function resetState(model) {
    model.scale.set(1, 1);
    model.position.set(0, 0);
    model.anchor.set(0, 0);
}
