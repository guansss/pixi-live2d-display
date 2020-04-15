import { logger } from './utils';

const TAG = 'SoundManager';
const VOLUME = 0.5;

/**
 * Manages all the sounds.
 */
export class SoundManager {
    /**
     * Audio elements that are playing or pending to play. Finished audios will be removed automatically.
     */
    static audios: HTMLAudioElement[] = [];

    protected static _volume = VOLUME;

    /**
     * Global volume that affects all the sounds.
     */
    static get volume(): number {
        return this._volume;
    }

    static set volume(value: number) {
        this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
        this.audios.forEach(audio => (audio.volume = this._volume));
    }

    /**
     * Adds a sound.
     * @param file - URL of the sound.
     * @param onFinish
     * @param onError
     * @return Added audio element.
     */
    static add(file: string, onFinish?: () => void, onError?: (e: Error) => void): HTMLAudioElement {
        const audio = new Audio(file);

        audio.volume = this._volume;
        audio.preload = 'auto';

        audio.addEventListener('ended', () => {
            this.dispose(audio);
            onFinish?.();
        });

        audio.addEventListener('error', (e: ErrorEvent) => {
            this.dispose(audio);
            logger.warn(TAG, `Error occurred when playing "${file}"`, e.error);
            onError?.(e.error);
        });

        this.audios.push(audio);

        return audio;
    }

    /**
     * Plays a sound.
     * @param audio
     * @return Promise that resolves when the audio is ready to play, rejects when error occurs.
     */
    static play(audio: HTMLAudioElement): Promise<void> {
        return new Promise((resolve, reject) => {
            // see https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
            audio.play()?.catch(e => {
                audio.dispatchEvent(new ErrorEvent('error', { error: e }));
                reject(e);
            });

            if (audio.readyState === audio.HAVE_ENOUGH_DATA) {
                resolve();
            } else {
                audio.addEventListener('canplaythrough', resolve as () => void);
            }
        });
    }

    /**
     * Disposes an audio element and removes it from {@link SoundManager.audios}.
     * @param audio
     */
    static dispose(audio: HTMLAudioElement): void {
        audio.pause();
        audio.src = '';

        const index = this.audios.indexOf(audio);

        if (index !== -1) {
            this.audios.splice(index, 1);
        }
    }

    /**
     * Destroys all audios.
     */
    static destroy(): void {
        for (const audio of this.audios) {
            this.dispose(audio);
        }
    }

    private constructor() {}
}
