import { Live2DModel } from '../src';

describe('Typescript usage suite', () => {
    it('should be able to execute a test', () => {
        const m = Live2DModel.fromModelSettingsFile('test/assets/shizuku/shizuku.model.json');
    });
});
