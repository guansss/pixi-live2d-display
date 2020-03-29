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

export function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
    });
}

export function createApp(appClass) {
    const app = new appClass({
        width: innerWidth,
        height: 1000,
        autoStart: true,
        autoDensity: true,
    });
    document.body.appendChild(app.view);

    window.addEventListener('resize', () => app.renderer.resize(innerWidth, 1000));

    return app;
}
