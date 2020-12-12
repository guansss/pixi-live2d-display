import { config } from '@/config';
import {
    MOTION_PRELOAD_ALL,
    MOTION_PRELOAD_IDLE,
    MOTION_PRELOAD_NONE,
    MOTION_PRIORITY_FORCE,
    MOTION_PRIORITY_IDLE,
    MOTION_PRIORITY_NONE,
    MOTION_PRIORITY_NORMAL,
} from '@/cubism-common/constants';
import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Cubism2MotionManager } from '@/cubism2/Cubism2MotionManager';
import '@/factory';
import sinon from 'sinon';
import { TEST_MODEL } from '../env';

describe('MotionManager', function() {
    /** @type {Cubism2MotionManager} */
    let manager;
    let clock;

    const originalLogLevel = config.logLevel;

    function expectMotionStartedInGroup(method, group) {
        expect(method).to.be.calledWithMatch(sinon.match.in(manager.motionGroups[group]));
        method.resetHistory();
    }

    function updateManager() {
        manager.update(TEST_MODEL.model, performance.now());
    }

    before(() => {
        clock = sinon.useFakeTimers({ shouldAdvanceTime: true });

        manager = new Cubism2MotionManager(new Cubism2ModelSettings(TEST_MODEL.json));

        sinon.spy(manager);
    });

    after(function() {
        clock.restore();
    });

    afterEach(() => {
        config.logLevel = originalLogLevel;

        manager.stopAllMotions();

        // reset call history for each method
        Object.keys(manager).forEach(member => typeof manager[member] === 'function' && manager[member].resetHistory());
    });

    it('should preload motions according to config', function() {
        const callRecord = [];
        const loadMotionStub = sinon.stub(Cubism2MotionManager.prototype, 'loadMotion').callsFake((group, index) => {
            callRecord.push({ group, index });
            return Promise.resolve(undefined);
        });

        // exclude expression definitions to prevent creating ExpressionManager
        const settingsJSON = {
            ...TEST_MODEL.json,
            expressions: undefined,
        };

        manager = new Cubism2MotionManager(new Cubism2ModelSettings(settingsJSON), { motionPreload: MOTION_PRELOAD_NONE });

        expect(callRecord).to.be.empty;

        manager = new Cubism2MotionManager(new Cubism2ModelSettings(settingsJSON), { motionPreload: MOTION_PRELOAD_IDLE });

        expect(callRecord).to.eql(settingsJSON.motions.idle.map((_, index) => ({ group: 'idle', index })));

        callRecord.length = 0;
        manager = new Cubism2MotionManager(new Cubism2ModelSettings(settingsJSON), { motionPreload: MOTION_PRELOAD_ALL });

        const expectedRecord = [];
        for (const [group, motions] of Object.entries(settingsJSON.motions)) {
            expectedRecord.push(...motions.map((_, index) => ({ group, index })));
        }
        expect(callRecord).to.eql(expectedRecord);

        loadMotionStub.restore();
    });

    it('should load motions', async function() {
        const motion = await manager.loadMotion('tap_body', 0);

        expect(motion).to.be.instanceOf(Live2DMotion);

        // suppress warnings about nonexistent motions
        config.logLevel = config.LOG_LEVEL_NONE;

        const nonexistentMotion = await manager.loadMotion('nonexistent', 0);

        expect(nonexistentMotion).to.be.undefined;
    });

    it('should start idle motion when no motion is playing', function(done) {
        const startMotionStub = sinon.stub(manager, '_startMotion')
            .callsFake(motion => {
                expect(motion).to.be.oneOf(manager.motionGroups['idle']);

                startMotionStub.restore();
                done();
            });

        // should start an idle motion
        updateManager();
    });

    it('should start idle motion when current motion has finished', async function() {
        // start an idle motion
        await manager.startMotion('idle', 0);
        updateManager();

        // skip the motion
        clock.tick(30 * 1000);

        updateManager();
        expect(manager.isFinished()).to.be.true;

        this.timeout(500);

        const startMotionStub = sinon.stub(manager, '_startMotion');
        const startMotionCalled = new Promise(resolve => {
            startMotionStub.callsFake(motion => {
                expect(motion).to.be.oneOf(manager.motionGroups['idle']);
                resolve();
            });
        }).finally(() => startMotionStub.restore());

        // should start another idle motion
        updateManager();
        await startMotionCalled;
    });

    it('should ', function() {

    });

    it('should start specific motion as given priority', async function() {
        const startMotionStub = sinon.stub(manager, '_startMotion');

        // start an idle motion
        await manager.startMotion('idle', 0);
        updateManager();

        let result = await manager.startMotion('tap_body', 0, MOTION_PRIORITY_NONE);

        expect(result).to.be.false;

        result = await manager.startMotion('tap_body', 1, MOTION_PRIORITY_IDLE);

        expect(result).to.be.false;

        result = await manager.startMotion('tap_body', 2, MOTION_PRIORITY_NORMAL);

        expect(result).to.be.true;
        expectMotionStartedInGroup(startMotionStub, 'tap_body');

        result = await manager.startMotion('tap_body', 0, MOTION_PRIORITY_FORCE);

        expect(result).to.be.true;
        expectMotionStartedInGroup(startMotionStub, 'tap_body');

        startMotionStub.restore();
    });

    it('should start random motion', async function() {
        const startMotionStub = sinon.stub(manager, '_startMotion');

        const result = await manager.startRandomMotion('tap_body');

        expect(result).to.be.true;
        expectMotionStartedInGroup(startMotionStub, 'tap_body');

        startMotionStub.restore();
    });
});
