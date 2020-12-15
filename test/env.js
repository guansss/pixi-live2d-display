import { CubismMoc } from '@cubism/model/cubismmoc';
import { resolve as urlResolve } from 'url';
import { readArrayBuffer, remoteRequire } from './utils';

export const shizuku = {
    file: './assets/shizuku/shizuku.model.json',
    width: 1280,
    height: 1380,
    hitTests: [
        { x: 620, y: 200, hitArea: ['head'] },
        { x: 620, y: 350, hitArea: ['head', 'mouth'] },
        { x: 750, y: 700, hitArea: ['body'] },
    ],
    interaction: {
        exp: 'head',
        tap: {
            body: 'tap_body',
        },
    },
};

export const haru = {
    file: './assets/haru/haru_greeter_t03.model3.json',
    width: 2400,
    height: 4500,
    hitTests: [],
    interaction: {
        exp: 'Head',
        tap: {
            Body: 'Tap',
        },
    },
};

export const TEST_MODEL = shizuku;
export const TEST_MODEL4 = haru;

// preload model settings JSON

TEST_MODEL.json = remoteRequire(TEST_MODEL.file);
TEST_MODEL.json.url = TEST_MODEL.file;

TEST_MODEL4.json = remoteRequire(TEST_MODEL4.file);
TEST_MODEL4.json.url = TEST_MODEL4.file;

// preload model data

TEST_MODEL.modelData = readArrayBuffer(urlResolve(TEST_MODEL.file, TEST_MODEL.json.model));
TEST_MODEL.coreModel = Live2DModelWebGL.loadModel(TEST_MODEL.modelData);

export function setupENV() {
    TEST_MODEL4.modelData = readArrayBuffer(urlResolve(TEST_MODEL4.file, TEST_MODEL4.json.FileReferences.Moc));
    TEST_MODEL4.coreModel = CubismMoc.create(TEST_MODEL4.modelData).createModel();
}

export const TEST_SOUND = './assets/shizuku/sounds/shake_00.mp3';

export const PLATFORMS = {
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
