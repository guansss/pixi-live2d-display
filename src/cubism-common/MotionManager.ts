import { config } from '@/config';
import {
    MOTION_PRELOAD_ALL,
    MOTION_PRELOAD_IDLE,
    MOTION_PRELOAD_NONE,
    MOTION_PRIORITY_IDLE,
    MOTION_PRIORITY_NORMAL,
    MotionPreloadStrategy,
    MotionPriority,
} from '@/cubism-common/constants';
import { ExpressionManager } from '@/cubism-common/ExpressionManager';
import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionState } from '@/cubism-common/MotionState';
import { SoundManager } from '@/cubism-common/SoundManager';
import { logger } from '@/utils';
import { EventEmitter } from '@pixi/utils';
import noop from 'lodash/noop';

export interface MotionManagerOptions {
    motionPreload?: MotionPreloadStrategy;
}

export abstract class MotionManager<Motion = any, MotionSpec = any> extends EventEmitter {
    /**
     * Tag for logging.
     */
    tag: string;

    /**
     * Motion definitions copied from {@link ModelSettings#motions};
     */
    abstract readonly definitions: Partial<Record<string, MotionSpec[]>>;

    abstract readonly groups: { idle: string };

    abstract readonly motionDataType: 'json' | 'arraybuffer';

    /**
     * Can be undefined if missing {@link ModelSettings#expressions}.
     */
    abstract expressionManager?: ExpressionManager;

    readonly settings: ModelSettings;

    /**
     * Instances of `Live2DMotion`. The structure is the same as {@link MotionManager#definitions};
     */
    motionGroups: Partial<Record<string, (Motion | undefined | null)[]>> = {};

    state = new MotionState();

    /**
     * Audio element of currently playing motion.
     */
    currentAudio?: HTMLAudioElement;

    motionPreload: MotionPreloadStrategy = MOTION_PRELOAD_IDLE;

    playing = false;

    destroyed = false;

    protected constructor(settings: ModelSettings, options?: MotionManagerOptions) {
        super();
        this.settings = settings;
        this.tag = `MotionManager(${settings.name})`;
        this.state.tag = this.tag;

        this.motionPreload = options?.motionPreload ?? this.motionPreload;
    }

    protected init() {
        this.setupMotions();
        this.stopAllMotions();
    }

    protected setupMotions(): void {
        for (const group of Object.keys(this.definitions)) {
            // init with the same structure of definitions
            this.motionGroups[group] = [];
        }

        // preload motions

        let groups;

        switch (this.motionPreload) {
            case MOTION_PRELOAD_NONE:
                return;

            case MOTION_PRELOAD_ALL:
                groups = Object.keys(this.definitions);
                break;

            case MOTION_PRELOAD_IDLE:
            default:
                groups = [this.groups.idle];
                break;
        }

        for (const group of groups) {
            for (let i = 0; i < this.definitions[group]!.length; i++) {
                this.loadMotion(group, i).then();
            }
        }
    }

    /**
     * Loads a motion in a group.
     * @param group
     * @param index
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

        this.motionGroups[group]![index] = motion ?? null;

        return motion;
    }

    private _loadMotion(group: string, index: number): Promise<Motion | undefined> {
        throw new Error('Not implemented.');
    }

    /**
     * Starts a motion as given priority.
     * @param group
     * @param index
     * @param priority
     * @return Promise that resolves with true if the motion is successfully started.
     */
    async startMotion(group: string, index: number, priority: MotionPriority = MOTION_PRIORITY_NORMAL): Promise<boolean> {
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

        if (config.sound) {
            const soundURL = this.getSoundFile(definition);

            if (soundURL) {
                // start to load the audio
                audio = SoundManager.add(
                    this.settings.resolveURL(soundURL),
                    () => this.currentAudio = undefined,
                    () => this.currentAudio = undefined,
                );

                this.currentAudio = audio;
            }
        }

        let motion = await this.loadMotion(group, index);

        if (audio) {
            if (config.motionSync) {
                // wait until the audio is ready
                await SoundManager.play(audio).catch(noop);
            } else {
                SoundManager.play(audio).catch(noop);
            }
        }

        if (!this.state.start(motion, group, index, priority)) {
            return false;
        }

        logger.log(this.tag, 'Start motion:', this.getMotionName(definition));

        this.emit('motionStart', group, index, audio);

        if (this.state.shouldOverrideExpression()) {
            this.expressionManager && this.expressionManager.resetExpression();
        }

        this.playing = true;

        this._startMotion(motion!);

        return true;
    }

    /**
     * Starts a random motion in the group as given priority.
     * @param group
     * @param priority
     * @return Promise that resolves with true if the motion is successfully started.
     */
    startRandomMotion(group: string, priority?: MotionPriority): Promise<boolean> {
        const groupDefs = this.definitions[group];

        if (groupDefs?.length) {
            const index = Math.floor(Math.random() * groupDefs.length);

            return this.startMotion(group, index, priority);
        }

        return Promise.resolve(false);
    }

    stopAllMotions(): void {
        this._stopAllMotions();

        this.state.clear();

        if (this.currentAudio) {
            SoundManager.dispose(this.currentAudio);
            this.currentAudio = undefined;
        }
    }

    /**
     * Updates parameters of core model.
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

            // noinspection JSIgnoredPromiseFromCall
            this.startRandomMotion(this.groups.idle, MOTION_PRIORITY_IDLE);
        }

        let updated = this.updateMotion(model, now);

        updated = this.expressionManager?.update(model, now) || updated;

        return updated;
    }

    destroy() {
        this.destroyed = true;
        this.emit('destroy');

        this.stopAllMotions();
        this.expressionManager?.destroy();

        const self = this as Mutable<Partial<this>>;
        self.definitions = undefined;
        self.motionGroups = undefined;
    }

    release() {
        this.stopAllMotions();
    }

    abstract isFinished(): boolean;

    abstract createMotion(data: ArrayBuffer | object, definition: MotionSpec): Motion;

    abstract getMotionFile(definition: MotionSpec): string;

    protected abstract getMotionName(definition: MotionSpec): string;

    protected abstract getSoundFile(definition: MotionSpec): string | undefined;

    protected abstract _startMotion(motion: Motion, onFinish?: (motion: Motion) => void): number;

    protected abstract _stopAllMotions(): void;

    /**
     * @return True if parameters are updated by any motion.
     */
    protected abstract updateMotion(model: object, now: DOMHighResTimeStamp): boolean;
}
