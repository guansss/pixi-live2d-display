import { resolve as urlResolve } from 'url';
import { readArrayBuffer, remoteRequire } from './utils';
import { CubismMoc } from '@cubism/model/cubismmoc';
import { merge } from 'lodash-es';

export const shizuku = {
    file: './assets/shizuku/shizuku.model.json',
    width: 1280,
    height: 1380,
    layout: {
        center_x: 0,
        y: 1.2,
        width: 2.4,
    },
    hitTests: [
        { x: 620, y: 200, hitArea: ['head'] },
        { x: 620, y: 350, hitArea: ['head', 'mouth'] },
        { x: 750, y: 700, hitArea: ['body'] },
    ],
    interaction: {
        exp: 'head',
        motion: {
            body: 'tap_body',
        },
    },
};

export const haru = {
    file: './assets/haru/haru_greeter_t03.model3.json',
    width: 2400,
    height: 4500,
    Layout: {
        Width: 1.8,
        X: 0.9,
    },
    hitTests: [
        { x: 1166, y: 834, hitArea: ['Head'] },
        { x: 910, y: 981, hitArea: ['Body'] },
    ],
    interaction: {
        exp: 'Head',
        motion: {
            Body: 'Tap',
        },
    },
};

export const hiyori = {
    file: '../../CubismWebSamples/Samples/Resources/Hiyori/Hiyori.model3.json',
};

export const eksistere = {
    "Version": 3,
    "FileReferences": {
        "Moc": "0828upd__l2d_382.u.moc3",
        "Textures": ["textures/texture_00.png"],
        "Physics": "0828upd__l2d_382.u.physics3.json",
        "Motions": {
            "Idle": [{ "File": "motions/Mgirl12_stand.motion3.json" }, { "File": "motions/Mgirl12_stand_c.motion3.json" }, { "File": "motions/Mgirl12_stand_a.motion3.json" }, { "File": "motions/Mgirl12_stand.motion3.json" }, { "File": "motions/Mgirl12_stand02.motion3.json" }],
        },
    },
    "url": "https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/%E5%B0%91%E5%A5%B3%E5%92%96%E5%95%A1%E6%9E%AA%20girls%20cafe%20gun/0828upd__l2d_382.u/0828upd__l2d_382.u.model3.json",
};

export const TEST_MODEL = shizuku;
export const TEST_MODEL4 = haru;

// preload model settings JSON

const modelJSON = remoteRequire(TEST_MODEL.file);
modelJSON.url = TEST_MODEL.file;
modelJSON.layout = TEST_MODEL.layout;

Object.defineProperty(TEST_MODEL, 'json', { get: () => merge({}, modelJSON) });

const model4JSON = remoteRequire(TEST_MODEL4.file);
model4JSON.url = TEST_MODEL4.file;
model4JSON.Layout = TEST_MODEL4.Layout;

Object.defineProperty(TEST_MODEL4, 'json', { get: () => merge({}, model4JSON) });

export function setupENV() {
    // preload model data
    TEST_MODEL.modelData = readArrayBuffer(urlResolve(TEST_MODEL.file, TEST_MODEL.json.model));
    TEST_MODEL.coreModel = Live2DModelWebGL.loadModel(TEST_MODEL.modelData);
    
    TEST_MODEL4.modelData = readArrayBuffer(urlResolve(TEST_MODEL4.file, TEST_MODEL4.json.FileReferences.Moc));
    TEST_MODEL4.coreModel = CubismMoc.create(TEST_MODEL4.modelData).createModel();
}

export const TEST_SOUND = './assets/shizuku/sounds/shake_00.mp3';
export const TEST_TEXTURE = './assets/circle.png';

export const RUNTIMES = {
    cubism2: {
        definition: TEST_MODEL,
    },
    cubism4: {
        definition: TEST_MODEL4,
    },
    each(fn) {
        const results = [fn(this.cubism2, '[cubism2]'), fn(this.cubism4, '[cubism4]')];
        if (results[0] instanceof Promise) {
            return Promise.all(results);
        }
        return results;
    },
};
