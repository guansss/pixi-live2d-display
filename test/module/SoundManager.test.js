import { config } from '@/config';
import { SoundManager } from '@/cubism-common/SoundManager';
import { TEST_SOUND } from '../env';

describe('SoundManager', function() {
    const originalLogLevel = config.logLevel;

    before(function() {
        sinon.spy(SoundManager);
    });

    after(function() {
        sinon.restore();
    });

    afterEach(function() {
        config.logLevel = originalLogLevel;
    });

    it('should play sound', function(done) {
        const audio = SoundManager.add(TEST_SOUND, () => {
            expect(audio, 'should be removed from internal array when finished').to.not.be.oneOf(SoundManager.audios);

            done();
        }, done);

        expect(audio, 'should be added to internal array').to.be.oneOf(SoundManager.audios);

        SoundManager.play(audio).then(() => {
            expect(audio.readyState, 'should be ready to play').to.gte(audio.HAVE_ENOUGH_DATA);

            // seek to the end so we don't have to wait for the playback
            audio.currentTime = audio.duration;
        });
    });

    it('should handle error when trying to play', async function() {
        // suppress the warning caused by expected error
        config.logLevel = config.LOG_LEVEL_NONE;

        await expect(new Promise((resolve, reject) => {
            const audio = SoundManager.add(TEST_SOUND, resolve, reject);

            sinon.stub(audio, 'play').rejects(new Error('expected error'));

            expect(SoundManager.play(audio)).to.be.rejectedWith('expected error');
        })).to.be.rejectedWith('expected error');
    });

    it('should destroy', function(done) {
        let pending = 2;

        [SoundManager.add(TEST_SOUND), SoundManager.add(TEST_SOUND)].forEach(audio => {
            SoundManager.play(audio).then(() => {
                pending--;

                if (pending === 0) {
                    SoundManager.destroy();

                    expect(SoundManager.audios).to.be.empty;

                    done();
                }
            }).catch(done);
        });
    });
});
