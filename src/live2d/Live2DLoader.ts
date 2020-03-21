import Live2DPhysics from '@/live2d/Live2DPhysics';
import Live2DPose from '@/live2d/Live2DPose';
import ModelSettings from '@/live2d/ModelSettings';
import { log } from '@/core/utils/log';
import { getArrayBuffer, getJSON } from '@/core/utils/net';
import { dirname } from 'path';
import { parse as urlParse } from 'url';

const TAG = 'Live2DLoader';

export async function loadModelSettings(file?: string) {
    if (!file) throw 'Missing model settings file';

    log(TAG, `Loading model settings:`, file);

    const url = urlParse(file);
    const baseDir = dirname(url.pathname || '') + '/';
    const json = await getJSON(file);

    if (!json) {
        throw new TypeError('Empty response');
    }

    return new ModelSettings(json, baseDir);
}

export async function loadModel(file?: string) {
    if (!file) throw 'Missing model file';

    log(TAG, `Loading model:`, file);

    const buffer = await getArrayBuffer(file);
    const model = Live2DModelWebGL.loadModel(buffer);

    const error = Live2D.getError();
    if (error) throw error;

    return model;
}

export async function loadPose(file: string, internalModel: Live2DModelWebGL) {
    log(TAG, 'Loading pose:', file);

    const json = await getJSON(file);
    return new Live2DPose(internalModel, json);
}

export async function loadPhysics(file: string, internalModel: Live2DModelWebGL) {
    log(TAG, 'Loading physics:', file);

    const json = await getJSON(file);
    return new Live2DPhysics(internalModel!, json);
}
