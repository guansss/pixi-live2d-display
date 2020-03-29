import { warn } from '../utils/log';

const TAG = 'SoundManager';

export default class SoundManager {
    static VOLUME = 0.5;

    private _volume = SoundManager.VOLUME;

    get volume(): number {
        return this._volume;
    }

    set volume(value: number) {
        this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
        this.audios.forEach(audio => (audio.volume = this._volume));
    }

    audios: HTMLAudioElement[] = [];

    playSound(file: string): HTMLAudioElement {
        const audio = new Audio(file);
        audio.volume = this._volume;

        this.audios.push(audio);

        audio.addEventListener('ended', () => {
            this.audios.splice(this.audios.indexOf(audio));
        });
        audio.addEventListener('error', (e: ErrorEvent) => {
            this.audios.splice(this.audios.indexOf(audio));
            warn(TAG, e.error);
        });

        const playResult = audio.play();

        if (playResult) {
            playResult.catch(e => warn(TAG, e));
        }

        return audio;
    }
}
