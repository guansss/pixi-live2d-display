const fs = require('electron').remote.require('fs');
const { resolve } = require('electron').remote.require('url');

export const BASE_PATH = '../../../test/';

export function remoteRequire(path) {
    return require('electron').remote.require(resolve(BASE_PATH, path));
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

export function readArrayBuffer(url) {
    const buffer = fs.readFileSync(resolve(process.cwd() + '/test/', url));

    // convert the Buffer to ArrayBuffer
    // https://stackoverflow.com/a/31394257/13237325
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export function readText(url) {
    return fs.readFileSync(resolve(process.cwd() + '/test/', url), 'utf-8');
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
