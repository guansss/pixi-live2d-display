import { Texture } from '@pixi/core';
import { Sprite } from '@pixi/sprite';
import { Live2DModel } from '@/Live2DModel';

const { remote } = require('electron');
const fs = remote.require('fs');
const { resolve } = remote.require('url');

export const BASE_PATH = '../../../test/';

export function remoteRequire(path) {
    return remote.require(resolve(BASE_PATH, path));
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

export function readJSON(url) {
    return JSON.parse(readText(url));
}

export function createApp(appClass, visible = true) {
    const app = new appClass({
        width: innerWidth,
        height: 1000,
        autoStart: false,
        autoDensity: true,
        antialias: visible,
    });

    if (visible) {
        document.body.appendChild(app.view);
        window.addEventListener('resize', () => app.renderer.resize(innerWidth, 1000));
    }

    return app;
}

export async function createModel(modelDef, options = {}) {
    options = Object.assign({
        modelClass: Live2DModel,
        motionPreload: 'NONE',
        zIndex: 0,
    }, options);

    const model = await options.modelClass.from(modelDef.file, options);
    model.zIndex = options.zIndex;
    options.app && options.app.stage.addChild(model);
    return model;
}

export function addBackground(model) {
    const foreground = Sprite.from(Texture.WHITE);
    foreground.width = model.internalModel.width;
    foreground.height = model.internalModel.height;
    foreground.alpha = 0.2;
    model.addChild(foreground);
}

export function draggable(model) {
    model.on('pointerdown', e => {
        model.dragging = true;
        model._dragX = e.data.global.x;
        model._dragY = e.data.global.y;
    });
    model.on('pointermove', e => {
        if (model.dragging) {
            model.position.x += e.data.global.x - model._dragX;
            model.position.y += e.data.global.y - model._dragY;
            model._dragX = e.data.global.x;
            model._dragY = e.data.global.y;
        }
    });
    model.on('pointerupoutside', () => model.dragging = false);
    model.on('pointerup', () => model.dragging = false);
}

export function callBefore(obj, method, fn) {
    const originalMethod = obj[method];

    obj[method] = function() {
        fn.apply(this, arguments);
        originalMethod.apply(this, arguments);
    };
}
