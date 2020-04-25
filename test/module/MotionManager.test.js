import sinon from 'sinon';
import { config, ModelSettings, MotionManager, Priority } from '../../src';
import { TEST_MODEL } from '../env';

describe('MotionManager', function() {
    let clock, manager;

    const originalLogLevel = config.logLevel;

    function expectMotionStartedInGroup(group) {
        expect(manager.startMotion).to.be.calledWithMatch(sinon.match.in(manager.motionGroups[group]));
    }

    before(() => {
        clock = sinon.useFakeTimers({ shouldAdvanceTime: true });

        manager = new MotionManager(TEST_MODEL.model, new ModelSettings(TEST_MODEL.json, TEST_MODEL.file));

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

    it('should load motions', async function() {
        const motion = await manager.loadMotion('tapBody', 0);

        expect(motion).to.be.instanceOf(Live2DMotion);

        const motions = await manager.loadMotion('tapBody');

        expect(motions).to.be.an('array').that.includes(motion);

        // suppress warnings about nonexistent motions
        config.logLevel = config.LOG_LEVEL_NONE;

        const nonexistentMotion = await manager.loadMotion('nonexistent', 0);

        expect(nonexistentMotion).to.be.undefined;

        const nonexistentMotions = await manager.loadMotion('nonexistent');

        expect(nonexistentMotions).to.be.an('array').that.is.empty;
    });

    it('should start idle motion when no motion is playing', function(done) {
        // sinon provides no way to spy with a callback, strangely
        const originalStartMotion = manager.startMotion;

        manager.startMotion = motion => {
            originalStartMotion.apply(manager, arguments);

            // now do the test
            expect(motion).to.be.oneOf(manager.motionGroups['idle']);

            // restore the method
            manager.startMotion = originalStartMotion;
            done();
        };

        // should start an idle motion
        manager.update();
    });

    it('should start idle motion when current motion has finished', function(done) {
        // should start an idle motion
        manager.update();
        manager.startMotion.resetHistory();

        clock.tick(20 * 1000);

        const originalStartMotion = manager.startMotion;

        manager.startMotion = motion => {
            originalStartMotion.apply(manager, arguments);

            // now do the test
            expect(motion).to.be.oneOf(manager.motionGroups['idle']);

            // restore the method
            manager.startMotion = originalStartMotion;
            done();
        };

        manager.update();
        expect(manager.isFinished()).to.be.true;
        manager.update();
    });

    it('should start specific motion as given priority', async function() {
        // should start an idle motion
        manager.update();
        manager.startMotion.resetHistory();

        let result = await manager.startMotionByPriority('tapBody', 0, Priority.None);

        expect(result).to.be.false;

        result = await manager.startMotionByPriority('tapBody', 0, Priority.Idle);

        expect(result).to.be.false;

        result = await manager.startMotionByPriority('tapBody', 0, Priority.Normal);

        expect(result).to.be.true;
        expectMotionStartedInGroup('tapBody');
        manager.startMotion.resetHistory();

        result = await manager.startMotionByPriority('tapBody', 0, Priority.Force);

        expect(result).to.be.true;
        expectMotionStartedInGroup('tapBody');
    });

    it('should start random motion', async function() {
        const result = await manager.startRandomMotion('tapBody');

        expect(result).to.be.true;
        expectMotionStartedInGroup('tapBody');
    });
});
