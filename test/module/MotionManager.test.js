import { config } from '@/config';
import { MotionManager, MotionPreloadStrategy, MotionPriority } from '@/cubism-common';
import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Cubism2MotionManager } from '@/cubism2/Cubism2MotionManager';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { Cubism4MotionManager } from '@/cubism4/Cubism4MotionManager';
import { SoundManager } from '@/cubism-common/SoundManager';
import '@/factory';
import fromPairs from 'lodash/fromPairs';
import sinon from 'sinon';
import { STT } from '../../scripts/motion-stt';
import { TEST_MODEL, TEST_MODEL4 } from '../env';

describe('MotionManager', function() {
    let clock;

    const originalLogLevel = config.logLevel;

    this.timeout(2000);

    function createManager2(options = { motionPreload: MotionPreloadStrategy.NONE }) {
        return new Cubism2MotionManager(new Cubism2ModelSettings({
            ...TEST_MODEL.json,

            // exclude expression definitions to prevent creating ExpressionManager
            expressions: undefined,
        }), options);
    }

    function createManager4(options = { motionPreload: MotionPreloadStrategy.NONE }) {
        return new Cubism4MotionManager(new Cubism4ModelSettings(TEST_MODEL4.json), options);
    }

    function updateManager(manager) {
        manager.update(TEST_MODEL.coreModel, performance.now());
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

        createManager2({ motionPreload: MotionPreloadStrategy.NONE });

        expect(callRecord).to.be.empty;

        createManager2({ motionPreload: MotionPreloadStrategy.IDLE });

        expect(callRecord).to.eql(TEST_MODEL.json.motions.idle.map((_, index) => ({ group: 'idle', index })));

        callRecord.length = 0;
        createManager2({ motionPreload: MotionPreloadStrategy.ALL });

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

        sinon.stub(manager, '_startMotion')
            .callsFake(motion => {
                expect(motion).to.be.oneOf(manager.motionGroups['idle']);

                done();
            });

        // should start an idle motion
        updateManager(manager);
    });

    it('should start idle motion when current motion has finished', async function() {
        const manager = createManager2();

        await manager.startMotion('idle', 0, MotionPriority.IDLE);
        updateManager(manager);

        // skip the motion
        clock.tick(30 * 1000);

        updateManager(manager);
        expect(manager.isFinished()).to.be.true;

        await new Promise(resolve => {
            sinon.stub(manager, '_startMotion')
                .callsFake(motion => {
                    expect(motion).to.be.oneOf(manager.motionGroups['idle']);
                    resolve();
                });

            // should start another idle motion
            updateManager(manager);
        });
    });

    it('should start a random motion', async function() {
        const manager = createManager2();
        const startMotionStub = sinon.stub(manager, '_startMotion');

        const result = await manager.startRandomMotion('tap_body');

        expect(result).to.be.true;
        expect(startMotionStub).to.be.calledOnceWith(sinon.match.in(manager.motionGroups['tap_body']));
    });

    it('should meet the state-transition table', async function() {
        config.logLevel = config.LOG_LEVEL_WARNING;

        const settings = new Cubism2ModelSettings({
            ...TEST_MODEL.json,
            motions: { test: [{ file: 'A' }, { file: 'B' }, { file: 'C' }] },
        });

        const indexMap = fromPairs(settings.motions.test.map((def, index) => [def.file, index]));

        for (let x = 0; x < STT.inputPriorities.length; x++) {
            for (let y = 0; y < STT.currentStates.length; y++) {
                const playingMotion = STT.currentStates[y].playing;
                const reservedMotion = STT.currentStates[y].reserved;
                const playingPriority = STT.currentStates[y].playingPriority;
                const reservedPriority = STT.currentStates[y].reservedPriority;
                const expectedResult = STT.results[y * STT.inputPriorities.length + x];

                const manager = new Cubism2MotionManager(settings, { motionPreload: MotionPreloadStrategy.NONE });
                const startMotionStub = sinon.stub(manager, '_startMotion');
                const loadMotionStub = sinon.stub(manager, 'loadMotion').callsFake(
                    (group, index) => Promise.resolve({ group, index }),
                );

                // if (x === 1 && y === 8) debugger
                // console.log(x, y, expectedResult, STT.inputPriorities[x], JSON.stringify(STT.currentStates[y]));

                const msg = `(${x}, ${y}) Start motion C as ${STT.inputPriorities[x]}` +
                    ' when playing ' + (playingMotion ? playingMotion + ' as ' + playingPriority : 'none') +
                    ' and reserved ' + (reservedMotion ? reservedMotion + ' as ' + reservedPriority : 'none') +
                    ', expecting ' + (expectedResult || 'none');

                if (playingMotion) {
                    const result = await manager.startMotion('test', indexMap[playingMotion], MotionPriority[playingPriority]);
                    expect(result, msg + ' @playing ' + playingMotion).to.be.true;
                }

                let startReservedMotion;

                if (reservedMotion) {
                    startReservedMotion = manager.startMotion('test', indexMap[reservedMotion], MotionPriority[reservedPriority]).then();
                    expect(loadMotionStub.lastCall, msg + ' @reserved ' + reservedMotion).to.be.calledWith('test', indexMap[reservedMotion]);
                }

                const result = await manager.startMotion('test', indexMap['C'], MotionPriority[STT.inputPriorities[x]]);

                expect(result, msg + ' @starting C').to.equal(expectedResult === 'C');

                await startReservedMotion;

                // there's a chance that the expected result is undefined, which means "none"
                if (expectedResult) {
                    expect(startMotionStub, msg + ' @result').to.be.calledWithMatch({
                        group: 'test',
                        index: indexMap[expectedResult],
                    });
                } else {
                    expect(startMotionStub, msg + ' @result').to.not.be.called;
                }
            }
        }
    });

    it('should keep on starting idle motion when the reserved motion has not been loaded', async function() {
        const manager = createManager2();
        const startMotionStub = sinon.stub(manager, '_startMotion');

        let resumeLoadMotion;

        sinon.stub(manager, 'loadMotion').callsFake(
            (group, index) => group === 'idle'
                ? Promise.resolve({ group, index })
                : new Promise(resolve => resumeLoadMotion = () => resolve({ group, index })),
        );

        await manager.startMotion('idle', 0, MotionPriority.IDLE);

        expect(startMotionStub).to.be.calledWithMatch({ group: 'idle', index: 0 });

        const suspendedStartMotion = manager.startMotion('tap_body', 0, MotionPriority.NORMAL);

        // skip the idle motion
        clock.tick(30 * 1000);

        updateManager(manager);
        expect(manager.isFinished()).to.be.true;

        // should start another idle motion
        await new Promise(resolve => {
            let fakeCalled = false;

            startMotionStub.callsFake(motion => {
                if (!fakeCalled) {
                    fakeCalled = true;
                    expect(motion.group).to.equal('idle');
                    resolve();
                }
            });

            updateManager(manager);
        });

        resumeLoadMotion();
        await suspendedStartMotion;

        expect(startMotionStub.lastCall).to.be.calledWithMatch({ group: 'tap_body', index: 0 });
    });

    it('should refuse the same motion', async function() {
        config.logLevel = config.LOG_LEVEL_WARNING;

        const manager = createManager2();

        sinon.stub(manager, '_startMotion');

        expect(await manager.startMotion('idle', 0, MotionPriority.IDLE)).to.be.true;
        expect(await manager.startMotion('idle', 0, MotionPriority.IDLE)).to.be.false;
        expect(await manager.startMotion('idle', 0, MotionPriority.NORMAL)).to.be.false;
        expect(await manager.startMotion('idle', 0, MotionPriority.FORCE)).to.be.false;

        expect(await manager.startMotion('idle', 1, MotionPriority.NORMAL)).to.be.true;
        expect(await manager.startMotion('idle', 1, MotionPriority.NORMAL)).to.be.false;
        expect(await manager.startMotion('idle', 2, MotionPriority.FORCE)).to.be.true;
        expect(await manager.startMotion('idle', 2, MotionPriority.FORCE)).to.be.false;

        manager.stopAllMotions();

        let resumeLoadMotion;

        sinon.stub(manager, 'loadMotion').callsFake(() => new Promise(resolve => {
            if (resumeLoadMotion) {
                throw new Error('loadMotion() called before resumeLoadMotion()');
            }

            resumeLoadMotion = () => {
                resumeLoadMotion = undefined;
                resolve({});
            };
        }));

        let suspendedStartMotion = manager.startMotion('idle', 0, MotionPriority.IDLE);
        expect(await manager.startMotion('idle', 0, MotionPriority.IDLE)).to.be.false;
        expect(await manager.startMotion('idle', 0, MotionPriority.NORMAL)).to.be.false;
        expect(await manager.startMotion('idle', 0, MotionPriority.FORCE)).to.be.false;
        resumeLoadMotion();
        expect(await suspendedStartMotion).to.be.true;

        suspendedStartMotion = manager.startMotion('idle', 1, MotionPriority.NORMAL);
        expect(await manager.startMotion('idle', 1, MotionPriority.NORMAL)).to.be.false;
        resumeLoadMotion();
        expect(await suspendedStartMotion).to.be.true;

        suspendedStartMotion = manager.startMotion('idle', 2, MotionPriority.FORCE);
        expect(await manager.startMotion('idle', 2, MotionPriority.FORCE)).to.be.false;
        resumeLoadMotion();
        expect(await suspendedStartMotion).to.be.true;
    });

    it('should handle race condition', async function() {
        config.logLevel = config.LOG_LEVEL_WARNING;

        const manager = createManager2();
        const startMotionStub = sinon.stub(manager, '_startMotion');

        const tasks = {};

        sinon.stub(manager, 'loadMotion').callsFake((group, index) => new Promise(resolve => {
            tasks[group + index] = () => resolve(group + index);
        }));

        {
            const idle = manager.startMotion('idle', 0, MotionPriority.IDLE);
            const normal = manager.startMotion('tap_body', 0, MotionPriority.NORMAL);
            tasks.tap_body0();
            expect(await normal).to.be.true;
            tasks.idle0();
            expect(await idle).to.be.false;
            expect(startMotionStub).to.be.calledOnceWith('tap_body0');

            startMotionStub.resetHistory();
            manager.stopAllMotions();
        }
        {
            const normal = manager.startMotion('tap_body', 0, MotionPriority.NORMAL);
            const force = manager.startMotion('tap_body', 1, MotionPriority.FORCE);
            tasks.tap_body1();
            expect(await force).to.be.true;
            tasks.tap_body0();
            expect(await normal).to.be.false;
            expect(startMotionStub).to.be.calledOnceWith('tap_body1');

            startMotionStub.resetHistory();
            manager.stopAllMotions();
        }
        {
            const suspendedForce0 = manager.startMotion('tap_body', 0, MotionPriority.FORCE);
            const suspendedForce1 = manager.startMotion('tap_body', 1, MotionPriority.FORCE);
            tasks.tap_body1();
            expect(await suspendedForce1).to.be.true;
            tasks.tap_body0();
            expect(await suspendedForce0).to.be.false;
            expect(startMotionStub).to.be.calledOnceWith('tap_body1');
        }
    });

    it('should not break motion when the sound fails to play', async function() {
        config.sound = true;

        const playStub = sinon.stub(SoundManager, 'play').rejects(new Error('foo'));

        try {
            const manager = createManager2();

            await manager.startMotion('tap_body', 0);

            expect(playStub.to.be.called);
        } finally {
            playStub.restore();
            config.sound = false;
        }
    });

    it('should not start idle motion when not fully idle', function() {
        const manager = createManager2();

        sinon.stub(manager, 'loadMotion').returns(new Promise(noResolve => {}));

        manager.startMotion('idle', 0);

        sinon.stub(manager, 'startRandomMotion');

        updateManager(manager);

        expect(manager.startRandomMotion).to.not.be.called;
    });
});
