import { config } from '@/config';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import '@/factory';
import { expect } from 'chai';
import sinon from 'sinon';
import { Cubism4ExpressionManager } from '../../src';
import { TEST_MODEL4 } from '../env';
import { readJSON } from '../utils';

describe('ExpressionManager', function () {
    let clock;

    before(() => {
        clock = sinon.useFakeTimers();
    });

    after(function () {
        clock.restore();
    });

    it('should update parameters', async function () {
        const epsilon = 1e-5;

        const expManager = new Cubism4ExpressionManager(new Cubism4ModelSettings(TEST_MODEL4.json));
        const expJson = readJSON('assets/haru/expressions/F01.exp3.json');
        const expParamId = expJson.Parameters[0].Id;
        const expParamValue = expJson.Parameters[0].Value;

        expect(TEST_MODEL4.coreModel.getParameterValueById(expParamId)).to.not.closeTo(expParamValue, epsilon);

        await expManager.setExpression('f00');

        // let the expression start
        expManager.update(TEST_MODEL4.coreModel, performance.now());

        clock.tick(config.expressionFadingDuration);

        const updated = expManager.update(TEST_MODEL4.coreModel, performance.now());

        expect(updated).to.be.true;
        expect(TEST_MODEL4.coreModel.getParameterValueById(expParamId)).to.closeTo(expParamValue, epsilon);
    });
});
