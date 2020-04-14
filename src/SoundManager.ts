import { logger } from './utils';

const TAG = 'SoundManager';
const VOLUME = 0.5;

export class SoundManager {
    static audios: HTMLAudioElement[] = [];

    protected static _volume = VOLUME;

    static get volume(): number {
        return this._volume;
    }

    static set volume(value: number) {
        this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
        this.audios.forEach(audio => (audio.volume = this._volume));
    }

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

    static dispose(audio: HTMLAudioElement) {
        audio.pause();
        audio.src = '';

        const index = this.audios.indexOf(audio);

        if (index !== -1) {
            this.audios.splice(index, 1);
        }
    }

    static destroy() {
        for (const audio of this.audios) {
            this.dispose(audio);
        }
    }

    private constructor() {}
}
