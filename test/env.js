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
};

export const TEST_MODEL = shizuku;

// preload model settings JSON
TEST_MODEL.json = remoteRequire(TEST_MODEL.file);
TEST_MODEL.json.url = TEST_MODEL.file;

// preload model data
TEST_MODEL.modelData = readArrayBuffer(urlResolve(TEST_MODEL.file, TEST_MODEL.json.model));

TEST_MODEL.model = Live2DModelWebGL.loadModel(TEST_MODEL.modelData);

export const TEST_SOUND = './assets/shizuku/sounds/shake_00.mp3';
