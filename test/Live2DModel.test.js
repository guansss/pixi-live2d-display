const { Live2DModel } = require('../lib');

describe('Typescript usage suite', () => {
    it('should be able to execute a test', () => {
        const m = Live2DModel.fromModelSettings('test/assets/shizuku/shizuku.model.json');
    });
});
