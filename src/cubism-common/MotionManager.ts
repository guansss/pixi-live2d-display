import { config } from '@/config';
import { ExpressionManager } from '@/cubism-common/ExpressionManager';
import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionPriority, MotionState } from '@/cubism-common/MotionState';
import { SoundManager } from '@/cubism-common/SoundManager';
import { logger } from '@/utils';
import { EventEmitter } from '@pixi/utils';
import { JSONObject, Mutable } from '../types/helpers';

export interface MotionManagerOptions {
    /**
     * How to preload the motions.
     * @default {@link MotionPreloadStrategy.NONE}
     */
    motionPreload?: MotionPreloadStrategy;

    /**
     * Specifies the idle motion group.
     * @default "idle" in Cubism 2 and "Idle" in Cubism 4.
     */
    idleMotionGroup?: string;
}

/**
 * Indicates how the motions will be preloaded.
 */
export enum MotionPreloadStrategy {
    /** Preload all the motions. */
    ALL = 'ALL',

    /** Preload only the idle motions. */
    IDLE = 'IDLE',

    /** No preload. */
    NONE = 'NONE',
}

/**
 * Handles the motion playback.
 * @emits {@link MotionManagerEvents}
 */
export abstract class MotionManager<Motion = any, MotionSpec = any> extends EventEmitter {
    /**
     * Tag for logging.
     */
    tag: string;

    /**
     * Motion definitions copied from ModelSettings.
     */
    abstract readonly definitions: Partial<Record<string, MotionSpec[]>>;

    /**
     * Motion groups with particular internal usages. Currently there's only the `idle` field,
     * which specifies the actual name of the idle motion group, so the idle motions
     * can be correctly found from the settings JSON of various Cubism versions.
     */
    abstract readonly groups: { idle: string };

    /**
     * Indicates the content type of the motion files, varies in different Cubism versions.
     * This will be used as `xhr.responseType`.
     */
    abstract readonly motionDataType: 'json' | 'arraybuffer';

    /**expressionManager
     * Can be undefined if the settings defines no expression.
     */
    abstract expressionManager?: ExpressionManager;

    /**
     * The ModelSettings reference.
     */
    readonly settings: ModelSettings;

    /**
     * The Motions. The structure is the same as {@link definitions}, initially each group contains
     * an empty array, which means all motions will be `undefined`. When a Motion has been loaded,
     * it'll fill the place in which it should be; when it fails to load, the place will be filled
     * with `null`.
     */
    motionGroups: Partial<Record<string, (Motion | undefined | null)[]>> = {};

    /**
     * Maintains the state of this MotionManager.
     */
    state = new MotionState();

    /**
     * Audio element of the current motion if a sound file is defined with it.
     */
    currentAudio?: HTMLAudioElement;

    /**
     * Analyzer element for the current sound being played.
     */
    currentAnalyzer?: AnalyserNode;

    /**
     * Context element for the current sound being played.
     */
    currentContext?: AudioContext;

    /**
     * Flags there's a motion playing.
     */
    playing = false;

    /**
     * Flags the instances has been destroyed.
     */
    destroyed = false;

    protected constructor(settings: ModelSettings, options?: MotionManagerOptions) {
        super();
        this.settings = settings;
        this.tag = `MotionManager(${settings.name})`;
        this.state.tag = this.tag;
    }

    /**
     * Should be called in the constructor of derived class.
     */
    protected init(options?: MotionManagerOptions) {
        if (options?.idleMotionGroup) {
            this.groups.idle = options.idleMotionGroup;
        }

        this.setupMotions(options);
        this.stopAllMotions();
    }

    /**
     * Sets up motions from the definitions, and preloads them according to the preload strategy.
     */
    protected setupMotions(options?: MotionManagerOptions): void {
        for (const group of Object.keys(this.definitions)) {
            // init with the same structure of definitions
            this.motionGroups[group] = [];
        }

        // preload motions

        let groups;

        switch (options?.motionPreload) {
            case MotionPreloadStrategy.NONE:
                return;

            case MotionPreloadStrategy.ALL:
                groups = Object.keys(this.definitions);
                break;

            case MotionPreloadStrategy.IDLE:
            default:
                groups = [this.groups.idle];
                break;
        }

        for (const group of groups) {
            if (this.definitions[group]) {
                for (let i = 0; i < this.definitions[group]!.length; i++) {
                    this.loadMotion(group, i).then();
                }
            }
        }
    }

    /**
     * Loads a Motion in a motion group. Errors in this method will not be thrown,
     * but be emitted with a "motionLoadError" event.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
     * @emits {@link MotionManagerEvents.motionLoaded}
     * @emits {@link MotionManagerEvents.motionLoadError}
     */
    async loadMotion(group: string, index: number): Promise<Motion | undefined> {
        if (!this.definitions[group] ?. [index]) {
            logger.warn(this.tag, `Undefined motion at "${group}"[${index}]`);
            return undefined;
        }

        if (this.motionGroups[group]![index] === null) {
            logger.warn(this.tag, `Cannot start motion at "${group}"[${index}] because it's already failed in loading.`);
            return undefined;
        }

        if (this.motionGroups[group]![index]) {
            return this.motionGroups[group]![index]!;
        }

        const motion = await this._loadMotion(group, index);

        if (this.destroyed) {
            return;
        }

        this.motionGroups[group]![index] = motion ?? null;

        return motion;
    }

    /**
     * Loads the Motion. Will be implemented by Live2DFactory in order to avoid circular dependency.
     * @ignore
     */
     private _loadMotion(group: string, index: number): Promise<Motion | undefined> {
        throw new Error('Not implemented.');
    }


    /**
     * Only play sound with lip sync
     * @param sound - The audio url to file or base64 content 
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @returns Promise that resolves with true if the sound is playing, false if it's not
     */
    async speakUp(sound: string, expression?: number | string) {
        if (!config.sound) {
            return false;
        }


        
        let audio: HTMLAudioElement | undefined;
        let analyzer: AnalyserNode | undefined;
        let context: AudioContext | undefined;


        if(this.currentAudio){
            if (!this.currentAudio.ended){
                return false;
            }
        }
        let soundURL: string | undefined;
        const isBase64Content = sound && sound.startsWith('data:audio/wav;base64');

        if(sound && !isBase64Content){
            var A = document.createElement('a');
            A.href = sound;
            sound = A.href; // This should be the absolute url
            // since resolveURL is not working for some reason
            soundURL = sound;
        }
        else {
            soundURL = 'data:audio/wav;base64';
        }
        const isUrlPath = sound && sound.startsWith('http');
        let file: string | undefined;
        if (isUrlPath || isBase64Content) {
            file = sound;
        }
        const that = this;
        if (file) {
            try {
                // start to load the audio
                audio = SoundManager.add(
                    file,
                    () => {expression && that.expressionManager && that.expressionManager.resetExpression();
                            that.currentAudio = undefined}, // reset expression when audio is done
                    () => {expression && that.expressionManager && that.expressionManager.resetExpression();
                        that.currentAudio = undefined} // on error
                );
                this.currentAudio = audio!;

                // Add context
                context = SoundManager.addContext(this.currentAudio);
                this.currentContext = context;
                
                // Add analyzer
                analyzer = SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
                this.currentAnalyzer = analyzer;

            } catch (e) {
                logger.warn(this.tag, 'Failed to create audio', soundURL, e);
            }
        }

        
        if (audio) {
            const readyToPlay = SoundManager.play(audio)
                .catch(e => logger.warn(this.tag, 'Failed to play audio', audio!.src, e));

            if (config.motionSync) {
                // wait until the audio is ready
                await readyToPlay;
            }
        }
        
        if (this.state.shouldOverrideExpression()) {
            this.expressionManager && this.expressionManager.resetExpression();
        }
        if (expression && this.expressionManager){
            this.expressionManager.setExpression(expression)
        }

        this.playing = true;

        return true;
    }

    /**
     * Starts a motion as given priority.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @param sound - The audio url to file or base64 content 
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    async startMotion(group: string, index: number, priority = MotionPriority.NORMAL, sound?: string, expression?: number | string): Promise<boolean> {
        // Does not start a new motion if audio is still playing
        if(this.currentAudio){
            if (!this.currentAudio.ended){
                return false;
            }
        }

        if (!this.state.reserve(group, index, priority)) {
            return false;
        }

        const definition = this.definitions[group]?.[index];

        if (!definition) {
            return false;
        }

        if (this.currentAudio) {
            // TODO: reuse the audio?
            SoundManager.dispose(this.currentAudio);
        }

        let audio: HTMLAudioElement | undefined;
        let analyzer: AnalyserNode | undefined;
        let context: AudioContext | undefined;

        if (config.sound) {
            const isBase64Content = sound && sound.startsWith('data:audio/wav;base64');
            if(sound && !isBase64Content){
                var A = document.createElement('a');
                A.href = sound;
                sound = A.href; // This should be the absolute url
                // since resolveURL is not working for some reason
            }
            const isUrlPath = sound && sound.startsWith('http');
            const soundURL = this.getSoundFile(definition);
            let file = soundURL;
            if (soundURL) {
                file = this.settings.resolveURL(soundURL) + "?cache-buster=" + new Date().getTime();
            }
            if (isUrlPath || isBase64Content) {
                file = sound;
            }
            const that = this;
            if (file) {
                try {
                    // start to load the audio
                    audio = SoundManager.add(
                        file,
                        () => {expression && that.expressionManager && that.expressionManager.resetExpression();
                                that.currentAudio = undefined}, // reset expression when audio is done
                        () => {expression && that.expressionManager && that.expressionManager.resetExpression();
                            that.currentAudio = undefined} // on error
                    );
                    this.currentAudio = audio!;

                    // Add context
                    context = SoundManager.addContext(this.currentAudio);
                    this.currentContext = context;
                    
                    // Add analyzer
                    analyzer = SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
                    this.currentAnalyzer = analyzer;

                } catch (e) {
                    logger.warn(this.tag, 'Failed to create audio', soundURL, e);
                }
            }
        }

        const motion = await this.loadMotion(group, index);

        if (audio) {
            priority = 3; // FORCED: MAKE SURE SOUND IS PLAYED
            
            const readyToPlay = SoundManager.play(audio)
                .catch(e => logger.warn(this.tag, 'Failed to play audio', audio!.src, e));

            if (config.motionSync) {
                // wait until the audio is ready
                await readyToPlay;
            }
        }

        if (!this.state.start(motion, group, index, priority)) {
            if (audio) {
                SoundManager.dispose(audio);
                this.currentAudio = undefined;
            }

            return false;
        }

        
        if (this.state.shouldOverrideExpression()) {
            this.expressionManager && this.expressionManager.resetExpression();
        }

        logger.log(this.tag, 'Start motion:', this.getMotionName(definition));

        this.emit('motionStart', group, index, audio);
        
        if (expression && this.expressionManager){
            this.expressionManager.setExpression(expression)
        }

        this.playing = true;

        this._startMotion(motion!);

        return true;
    }

    /**
     * Starts a random Motion as given priority.
     * @param group - The motion group.
     * @param priority - The priority to be applied.
     * @param sound - The wav url file or base64 content
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    async startRandomMotion(group: string, priority?: MotionPriority, sound?: string): Promise<boolean> {
        const groupDefs = this.definitions[group];

        if (groupDefs?.length) {
            const availableIndices = [];

            for (let i = 0; i < groupDefs!.length; i++) {
                if (this.motionGroups[group]![i] !== null && !this.state.isActive(group, i)) {
                    availableIndices.push(i);
                }
            }

            if (availableIndices.length) {
                const index = Math.floor(Math.random() * availableIndices.length);

                return this.startMotion(group, availableIndices[index]!, priority, sound);
            }
        }

        return false;
    }

    /**
     * Stops all playing motions as well as the sound.
     */
    stopAllMotions(): void {
        this._stopAllMotions();

        this.state.reset();

        if (this.currentAudio) {
            SoundManager.dispose(this.currentAudio);
            this.currentAudio = undefined;
        }
    }

    /**
     * Updates parameters of the core model.
     * @param model - The core model.
     * @param now - Current time in milliseconds.
     * @return True if the parameters have been actually updated.
     */
    update(model: object, now: DOMHighResTimeStamp): boolean {
        if (this.isFinished()) {
            if (this.playing) {
                this.playing = false;
                this.emit('motionFinish');
            }

            if (this.state.shouldOverrideExpression()) {
                this.expressionManager?.restoreExpression();
            }

            this.state.complete();

            if (this.state.shouldRequestIdleMotion()) {
                // noinspection JSIgnoredPromiseFromCall
                this.startRandomMotion(this.groups.idle, MotionPriority.IDLE);
            }
        }

        return this.updateParameters(model, now);
    }

    /**
     * Move the mouth
     * 
     */
     mouthSync(): number {
        if (this.currentAnalyzer) {
            return SoundManager.analyze(this.currentAnalyzer);
        } else {
            return 0;
        }
    }

    /**
     * Destroys the instance.
     * @emits {@link MotionManagerEvents.destroy}
     */
    destroy() {
        this.destroyed = true;
        this.emit('destroy');

        this.stopAllMotions();
        this.expressionManager?.destroy();

        const self = this as Mutable<Partial<this>>;
        self.definitions = undefined;
        self.motionGroups = undefined;
    }

    /**
     * Checks if the motion playback has finished.
     */
    abstract isFinished(): boolean;

    /**
     * Creates a Motion from the data.
     * @param data - Content of the motion file. The format must be consistent with {@link MotionManager#motionDataType}.
     * @param group - The motion group.
     * @param definition - The motion definition.
     * @return The created Motion.
     */
    abstract createMotion(data: ArrayBuffer | JSONObject, group: string, definition: MotionSpec): Motion;

    /**
     * Retrieves the motion's file path by its definition.
     * @return The file path extracted from given definition. Not resolved.
     */
    abstract getMotionFile(definition: MotionSpec): string;

    /**
     * Retrieves the motion's name by its definition.
     * @return The motion's name.
     */
    protected abstract getMotionName(definition: MotionSpec): string;

    /**
     * Retrieves the motion's sound file by its definition.
     * @return The motion's sound file, can be undefined.
     */
    protected abstract getSoundFile(definition: MotionSpec): string | undefined;

    /**
     * Starts the Motion.
     */
    protected abstract _startMotion(motion: Motion, onFinish?: (motion: Motion) => void): number;

    /**
     * Stops all playing motions.
     */
    protected abstract _stopAllMotions(): void;

    /**
     * Updates parameters of the core model.
     * @param model - The core model.
     * @param now - Current time in milliseconds.
     * @return True if the parameters have been actually updated.
     */
    protected abstract updateParameters(model: object, now: DOMHighResTimeStamp): boolean;
}
