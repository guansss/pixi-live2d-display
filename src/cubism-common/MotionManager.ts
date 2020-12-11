import { config } from '@/config';
import {
    MOTION_PRELOAD_ALL,
    MOTION_PRELOAD_IDLE,
    MOTION_PRELOAD_NONE,
    MOTION_PRIORITY_FORCE,
    MOTION_PRIORITY_IDLE,
    MOTION_PRIORITY_NONE,
    MOTION_PRIORITY_NORMAL,
    MotionPreloadStrategy,
    MotionPriority,
} from '@/cubism-common/constants';
import { ExpressionManager } from '@/cubism-common/ExpressionManager';
import { ModelSettings } from '@/cubism-common/ModelSettings';
import { SoundManager } from '@/cubism-common/SoundManager';
import { Live2DFactory } from '@/factory';
import { logger } from '@/utils';
import { EventEmitter } from '@pixi/utils';
import noop from 'lodash/noop';

export interface MotionManagerOptions {
    motionPreload?: MotionPreloadStrategy;
}

/**
 * Creates an ID from given group and index.
 */
export function motionID(group: string, index: number): string {
    return group + '#' + index;
}

export abstract class MotionManager<Model = any, Settings extends ModelSettings = ModelSettings, ExpManager extends ExpressionManager<Model, Settings> = ExpressionManager<Model, Settings>, Motion = any, MotionSpec = any, Groups extends string = string> extends EventEmitter {
    /**
     * Tag for logging.
     */
    tag: string;

    abstract readonly groups: { idle: Groups };

    abstract readonly motionDataType: 'json' | 'arraybuffer';

    /**
     * Can be undefined if missing {@link ModelSettings#expressions}.
     */
    abstract expressionManager?: ExpManager;

    readonly settings: Settings;

    /**
     * Motion definitions copied from {@link ModelSettings#motions};
     */
    readonly definitions!: Partial<Record<Groups, MotionSpec[]>>;

    /**
     * Instances of `Live2DMotion`. The structure is the same as {@link MotionManager#definitions};
     */
    motionGroups: Partial<Record<Groups, (Motion | undefined | null)[]>> = {};

    /**
     * Priority of currently playing motion.
     */
    currentPriority: MotionPriority = MOTION_PRIORITY_NONE;

    /**
     * Priority of reserved motion, i.e. the motion that will play subsequently.
     */
    reservePriority: MotionPriority = MOTION_PRIORITY_NONE;

    /**
     * ID of motion that is still loading and will be played once loaded.
     */
    reserveMotionID?: string;

    /**
     * Audio element of currently playing motion.
     */
    currentAudio?: HTMLAudioElement;

    motionPreload: MotionPreloadStrategy = MOTION_PRELOAD_IDLE;

    destroyed = false;

    protected constructor(settings: Settings, options?: MotionManagerOptions) {
        super();
        this.settings = settings;
        this.tag = `MotionManager(${settings.name})`;

        this.motionPreload = options?.motionPreload ?? this.motionPreload;
    }

    protected init() {
        (this as Mutable<this>).definitions = this.getDefinitions();

        this.setupMotions();
        this.stopAllMotions();
    }

    protected setupMotions(): void {
        for (const group of Object.keys(this.definitions) as Groups[]) {
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

        for (const group of groups as Groups[]) {
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
    protected async loadMotion(group: Groups, index: number): Promise<Motion | undefined> {
        if (!this.definitions[group] ?. [index]) {
            logger.warn(this.tag, `Undefined motion at "${group}"[${index}]`);
            return undefined;
        }

        if (this.motionGroups[group]![index] === null) {
            logger.warn(this.tag, `Cannot start motion at "${group}"[${index}] because it's already failed in loading.`);
            return undefined;
        }

        if (this.motionGroups[group]![index]) {
            return this.motionGroups[group]![index] as Motion;
        }

        const motion = await Live2DFactory.loadMotion(this, group, index);

        this.motionGroups[group]![index] = motion ?? null;

        return motion;
    }

    /**
     * Starts a motion as given priority.
     * @param group
     * @param index
     * @param priority
     * @return Promise that resolves with true if the motion is successfully started.
     */
    async startMotion(group: Groups, index: number, priority: MotionPriority = MOTION_PRIORITY_NORMAL): Promise<boolean> {
        if (!(
            priority === MOTION_PRIORITY_FORCE

            // keep on starting idle motions even when there is a reserved motion
            || (priority === MOTION_PRIORITY_IDLE && this.currentPriority === MOTION_PRIORITY_NONE)

            || (priority > this.currentPriority && priority > this.reservePriority)
        )) {
            logger.log(this.tag, 'Cannot start motion because another motion is running as same or higher priority.');
            return false;
        }

        this.reservePriority = priority;

        let id;

        // update reserved motion only if this motion is not idle priority
        if (priority > MOTION_PRIORITY_IDLE) {
            id = motionID(group, index);

            // set this motion as reserved motion
            this.reserveMotionID = id;
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
                    soundURL,
                    () => this.currentAudio = undefined,
                    () => this.currentAudio = undefined,
                );

                this.currentAudio = audio;
            }
        }

        let motion = this.motionGroups[group]![index] || (await this.loadMotion(group, index));

        if (audio) {
            if (config.motionSync) {
                // wait until the audio is ready
                await SoundManager.play(audio).catch(noop);
            } else {
                SoundManager.play(audio).catch(noop);
            }
        }

        if (priority > MOTION_PRIORITY_IDLE) {
            if (!motion || this.reserveMotionID !== id) {
                return false;
            }

            // clear reserved motion
            this.reserveMotionID = undefined;
        } else if (!motion) {
            return false;
        }

        if (priority === this.reservePriority) {
            this.reservePriority = MOTION_PRIORITY_NONE;
        }

        this.currentPriority = priority;

        logger.log(this.tag, 'Start motion:', this.getMotionName(definition));

        this.onMotionStart(group, index, audio);

        if (priority > MOTION_PRIORITY_IDLE) {
            this.expressionManager && this.expressionManager.resetExpression();
        }

        this._startMotion(motion);

        return true;
    }

    /**
     * Starts a random motion in the group as given priority.
     * @param group
     * @param priority
     * @return Promise that resolves with true if the motion is successfully started.
     */
    startRandomMotion(group: Groups, priority?: MotionPriority): Promise<boolean> {
        const groupDefs = this.definitions[group];

        if (groupDefs?.length) {
            const index = Math.floor(Math.random() * groupDefs.length);

            return this.startMotion(group, index, priority);
        }

        return Promise.resolve(false);
    }

    stopAllMotions(): void {
        this._stopAllMotions();

        this.currentPriority = MOTION_PRIORITY_NONE;
        this.reservePriority = MOTION_PRIORITY_NONE;

        // make sure the reserved motion (if existing) won't start when it's loaded
        this.reserveMotionID = undefined;

        if (this.currentAudio) {
            SoundManager.dispose(this.currentAudio);
            this.currentAudio = undefined;
        }
    }

    /**
     * Updates parameters of core model.
     * @return True if the parameters have been actually updated.
     */
    update(model: Model, now: DOMHighResTimeStamp): boolean {
        if (this.isFinished()) {
            if (this.currentPriority > MOTION_PRIORITY_IDLE) {
                this.expressionManager?.restoreExpression();
            }

            this.currentPriority = MOTION_PRIORITY_NONE;

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

    abstract isFinished(): boolean;

    abstract createMotion(data: ArrayBuffer | JSONObject, definition: MotionSpec): Motion;

    abstract getMotionFile(definition: MotionSpec): string;

    protected abstract getDefinitions(): Partial<Record<Groups, MotionSpec[]>>;

    protected abstract getMotionName(definition: MotionSpec): string;

    protected abstract getSoundFile(definition: MotionSpec): string | undefined;

    protected abstract _startMotion(motion: Motion, onFinish?: (motion: Motion) => void): number;

    protected abstract _stopAllMotions(): void;

    /**
     * @return True if parameters are updated by any motion.
     */
    protected abstract updateMotion(model: Model, now: DOMHighResTimeStamp): boolean;

    /**
     * Called when a motion starts. Will be implemented when constructing {@link Live2DModel}.
     * @param group
     * @param index
     * @param audio
     */
    onMotionStart(group: string, index: number, audio?: HTMLAudioElement): void {}
}
