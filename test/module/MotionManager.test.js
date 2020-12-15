import { config } from '@/config';
import { MotionManager } from '@/cubism-common';
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
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { Cubism4MotionManager } from '@/cubism4/Cubism4MotionManager';
import '@/factory';
import sinon from 'sinon';
import { TEST_MODEL, TEST_MODEL4 } from '../env';

describe('MotionManager', function() {
    let clock;

    const originalLogLevel = config.logLevel;

    function createManager2(options = { motionPreload: MOTION_PRELOAD_NONE }) {
        return new Cubism2MotionManager(new Cubism2ModelSettings({
            ...TEST_MODEL.json,

            // exclude expression definitions to prevent creating ExpressionManager
            expressions: undefined,
        }), options);
    }

    function createManager4(options = { motionPreload: MOTION_PRELOAD_NONE }) {
        return new Cubism4MotionManager(new Cubism4ModelSettings(TEST_MODEL4.json), options);
    }

    function updateManager(manager) {
        manager.update(TEST_MODEL.coreModel, performance.now());
    }

    function expectMotionStartedInGroup(manager, group) {
        expect(manager._startMotion).to.be.calledWithMatch(sinon.match.in(manager.motionGroups[group]));
        manager._startMotion.resetHistory();
    }

    before(() => {
        config.sound = false;
        clock = sinon.useFakeTimers({ shouldAdvanceTime: true });
    });

    after(function() {
        config.sound = true;
        clock.restore();
    });

    afterEach(() => {
        config.logLevel = originalLogLevel;
    });

    it('should preload motions according to config', function() {
        const callRecord = [];
        const loadMotionStub = sinon.stub(MotionManager.prototype, 'loadMotion').callsFake((group, index) => {
            callRecord.push({ group, index });
            return Promise.resolve(undefined);
        });

        createManager2({ motionPreload: MOTION_PRELOAD_NONE });

        expect(callRecord).to.be.empty;

        createManager2({ motionPreload: MOTION_PRELOAD_IDLE });

        expect(callRecord).to.eql(TEST_MODEL.json.motions.idle.map((_, index) => ({ group: 'idle', index })));

        callRecord.length = 0;
        createManager2({ motionPreload: MOTION_PRELOAD_ALL });

        const expectedRecord = [];
        for (const [group, motions] of Object.entries(TEST_MODEL.json.motions)) {
            expectedRecord.push(...motions.map((_, index) => ({ group, index })));
        }
        expect(callRecord).to.eql(expectedRecord);

        loadMotionStub.restore();
    });

    it('should load motions', async function() {
        const manager = createManager2();
        const motion = await manager.loadMotion('tap_body', 0);

        expect(motion).to.be.instanceOf(Live2DMotion);

        // suppress warnings about nonexistent motions
        config.logLevel = config.LOG_LEVEL_NONE;

        const nonexistentMotion = await manager.loadMotion('nonexistent', 0);

        expect(nonexistentMotion).to.be.undefined;
    });

    it('should start idle motion when no motion is playing', function(done) {
        const manager = createManager2();

        const startMotionStub = sinon.stub(manager, '_startMotion')
            .callsFake(motion => {
                expect(motion).to.be.oneOf(manager.motionGroups['idle']);

                startMotionStub.restore();
                done();
            });

        // should start an idle motion
        updateManager(manager);
    });

    it('should start idle motion when current motion has finished', async function() {
        const manager = createManager2();

        // start an idle motion
        await manager.startMotion('idle', 0);
        updateManager(manager);

        // skip the motion
        clock.tick(30 * 1000);

        updateManager(manager);
        expect(manager.isFinished()).to.be.true;

        this.timeout(500);

        const startMotionCalled = new Promise(resolve => {
            sinon.stub(manager, '_startMotion')
                .callsFake(motion => {
                    expect(motion).to.be.oneOf(manager.motionGroups['idle']);
                    resolve();
                });
        });

        // should start another idle motion
        updateManager(manager);
        await startMotionCalled;
    });

    it('should start specific motion as given priority', async function() {
        const manager = createManager2();
        const startMotionStub = sinon.stub(manager, '_startMotion');

        // start an idle motion
        await manager.startMotion('idle', 0);
        updateManager(manager);

        let result = await manager.startMotion('tap_body', 0, MOTION_PRIORITY_NONE);

        expect(result).to.be.false;

        result = await manager.startMotion('tap_body', 1, MOTION_PRIORITY_IDLE);

        expect(result).to.be.false;

        result = await manager.startMotion('tap_body', 2, MOTION_PRIORITY_NORMAL);

        expect(result).to.be.true;
        expectMotionStartedInGroup(manager, 'tap_body');

        result = await manager.startMotion('tap_body', 0, MOTION_PRIORITY_FORCE);

        expect(result).to.be.true;
        expectMotionStartedInGroup(manager, 'tap_body');

        startMotionStub.restore();
    });

    it('should start random motion', async function() {
        const manager = createManager2();
        const startMotionStub = sinon.stub(manager, '_startMotion');

        const result = await manager.startRandomMotion('tap_body');

        expect(result).to.be.true;
        expectMotionStartedInGroup(manager, 'tap_body');

        startMotionStub.restore();
    });
});
