import { logger, remove } from "@/utils";

const TAG = "SoundManager";
const VOLUME = 0.5;

/**
 * Manages all the sounds.
 */
export class SoundManager {
    /**
     * Audio elements playing or pending to play. Finished audios will be removed automatically.
     */
    static audios: HTMLAudioElement[] = [];
    static analysers: AnalyserNode[] = [];
    static contexts: AudioContext[] = [];

    protected static _volume = VOLUME;

    /**
     * Global volume that applies to all the sounds.
     */
    static get volume(): number {
        return this._volume;
    }

    static set volume(value: number) {
        this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
        this.audios.forEach((audio) => (audio.volume = this._volume));
    }

    // TODO: return an ID?
    /**
     * Creates an audio element and adds it to the {@link audios}.
     * @param file - URL of the sound file.
     * @param onFinish - Callback invoked when the playback has finished.
     * @param onError - Callback invoked when error occurs.
     * @return Created audio element.
     */
    static add(
        file: string,
        onFinish?: () => void,
        onError?: (e: Error) => void,
        crossOrigin?: string
    ): HTMLAudioElement {
        const audio = new Audio(file);

        audio.volume = this._volume;
        audio.preload = 'auto';
        audio.autoplay = true;
        audio.crossOrigin = crossOrigin!;

        audio.addEventListener("ended", () => {
            this.dispose(audio);
            onFinish?.();
        });

        audio.addEventListener("error", (e: ErrorEvent) => {
            this.dispose(audio);
            logger.warn(TAG, `Error occurred on "${file}"`, e.error);
            onError?.(e.error);
        });

        this.audios.push(audio);

        return audio;
    }

    /**
     * Plays the sound.
     * @param audio - An audio element.
     * @return Promise that resolves when the audio is ready to play, rejects when error occurs.
     */
    static play(audio: HTMLAudioElement): Promise<void> {
        return new Promise((resolve, reject) => {
            // see https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
            audio.play()?.catch((e) => {
                audio.dispatchEvent(new ErrorEvent("error", { error: e }));
                reject(e);
            });

            if (audio.readyState === audio.HAVE_ENOUGH_DATA) {
                resolve();
            } else {
                audio.addEventListener("canplaythrough", resolve as () => void);
            }
        });
    }

    static addContext(audio: HTMLAudioElement): AudioContext {
        /* Create an AudioContext */
        const context = new (AudioContext)();

        this.contexts.push(context);
        return context;
    }

    static addAnalyzer(audio: HTMLAudioElement, context: AudioContext): AnalyserNode {
        /* Create an AnalyserNode */
        const source = context.createMediaElementSource(audio);
        const analyser = context.createAnalyser();

        analyser.fftSize = 256;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.85;

        source.connect(analyser);
        analyser.connect(context.destination);

        this.analysers.push(analyser);
        return analyser;
    }

    /**
     * Get volume for lip sync
     * @param analyser - An analyzer element.
     * @return Returns value to feed into lip sync
     */
    static analyze(analyser: AnalyserNode): number {

        if(analyser != undefined){
            let pcmData = new Float32Array(analyser.fftSize);
            let sumSquares = 0.0;
            analyser.getFloatTimeDomainData(pcmData);

            for (const amplitude of pcmData) { sumSquares += amplitude*amplitude; }
            return parseFloat(Math.sqrt((sumSquares / pcmData.length) * 20).toFixed(1));
        } else {
            return parseFloat(Math.random().toFixed(1));
        }
    }

    /**
     * Disposes an audio element and removes it from {@link audios}.
     * @param audio - An audio element.
     */
    static dispose(audio: HTMLAudioElement): void {
        audio.pause();
        audio.removeAttribute("src");

        remove(this.audios, audio);
    }

    /**
     * Destroys all managed audios.
     */
    static destroy(): void {
        // dispose() removes given audio from the array, so the loop must be backward
        for (let i = this.contexts.length - 1; i >= 0; i--) {
            this.contexts[i]!.close()
        }
        
        for (let i = this.audios.length - 1; i >= 0; i--) {
            this.dispose(this.audios[i]!);
        }
    }
}
