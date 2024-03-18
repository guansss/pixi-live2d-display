import type { ModelSettings } from "@/common";
import { SoundManager, clamp, logger } from "@/common";

export interface LipSyncPlayOptions {
    /**
     * Volume of the sound (0-1).
     * @default The value of `SoundManager.volume`
     */
    volume?: number;

    /**
     * `crossorigin` attribute for the audio element.
     * @default null
     */
    crossOrigin?: string | null;
}

export class LipSync {
    tag = "LipSync";

    audioContext: AudioContext | undefined;
    analyser: AnalyserNode | undefined;

    currentAudio: HTMLAudioElement | undefined;
    playing = false;

    private pcmData: Float32Array | undefined;

    constructor(settings: ModelSettings) {
        this.tag = `LipSync(${settings.name})`;
    }

    /**
     * Plays a sound with lip sync.
     * @param sound - The audio's URL. Unlike other asset URLs (which are defined in the model settings JSON),
     * this URL will not be resolved based on the model's URL.
     * @returns Promise that resolves with true if the sound is playing, false if it's not
     */
    async play(sound: string, { volume, crossOrigin = null }: LipSyncPlayOptions = {}) {
        const soundForLogging = sound.startsWith("data:")
            ? sound.slice(0, sound.indexOf(",") + 1) + "..."
            : sound;

        try {
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }

            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                this.analyser.minDecibels = -90;
                this.analyser.maxDecibels = -10;
                this.analyser.smoothingTimeConstant = 0.85;
                this.analyser.connect(this.audioContext.destination);
                this.pcmData = new Float32Array(this.analyser.fftSize);
            }

            if (this.playing) {
                this.stop();
            }

            const audio = SoundManager.add(
                sound,
                () => {
                    this.currentAudio = undefined;
                    this.playing = false;
                },
                () => {
                    this.currentAudio = undefined;
                    this.playing = false;
                },
            );

            audio.crossOrigin = crossOrigin;

            if (volume !== undefined) {
                audio.volume = volume;
            }

            this.currentAudio = audio;

            const source = this.audioContext.createMediaElementSource(audio);
            source.connect(this.analyser);

            await SoundManager.play(audio);

            this.playing = true;

            logger.log(this.tag, "Play audio", soundForLogging);
        } catch (e) {
            logger.warn(this.tag, "Failed to play audio", soundForLogging, e);
            this.stop();
            throw e;
        }
    }

    analyze() {
        if (!this.analyser || !this.pcmData) {
            return 0;
        }

        this.analyser.getFloatTimeDomainData(this.pcmData);
        let sumSquares = 0.0;

        for (const amplitude of this.pcmData) {
            sumSquares += amplitude * amplitude;
        }

        return Math.sqrt((sumSquares / this.pcmData.length) * 20);
    }

    /**
     * Get value for lip sync
     * @return A number between 0 and 1
     */
    getValue() {
        let value = this.analyze();

        if (value === 0) {
            return value;
        }

        const bias_weight = 1.2;
        const bias_power = 0.7;

        value = Math.pow(value, bias_power) * bias_weight;

        return clamp(value, 0.4, 1);
    }

    stop() {
        if (this.currentAudio) {
            SoundManager.dispose(this.currentAudio);
            this.currentAudio = undefined;
        }

        this.playing = false;
    }

    destroy() {
        this.stop();
        this.audioContext?.close();
        this.audioContext = undefined;
        this.pcmData = undefined;
    }
}
