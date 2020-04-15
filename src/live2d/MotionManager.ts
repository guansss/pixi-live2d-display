import { Loader, LoaderResource } from '@pixi/loaders';
import noop from 'lodash/noop';
import { config } from '../config';
import { SoundManager } from '../SoundManager';
import { logger } from '../utils';
import { ExpressionManager } from './ExpressionManager';
import { ModelSettings } from './ModelSettings';
import { MotionDefinition } from './ModelSettingsJSON';

export enum Priority { None, Idle, Normal, Force }

enum Group {
    Idle = 'idle',
}

const DEFAULT_FADE_TIMEOUT = 500;

export class MotionManager extends MotionQueueManager {
    /**
     * Tag for logging.
     */
    tag: string;

    /**
     * Motion definitions copied from {@link ModelSettings#motions};
     */
    definitions: { [Group: string]: MotionDefinition[] };

    /**
     * Instances of `Live2DMotion`. The structure is the same as {@link MotionManager#definitions};
     */
    motionGroups: { [Group: string]: Live2DMotion[] } = {};

    /**
     * Can be undefined if missing {@link ModelSettings#expressions}.
     */
    expressionManager?: ExpressionManager;

    /**
     * Priority of currently playing motion.
     */
    currentPriority = Priority.None;

    /**
     * Priority of reserved motion, i.e. the motion that will play subsequently.
     */
    reservePriority = Priority.None;

    /**
     * Audio element of currently playing motion.
     */
    currentAudio?: HTMLAudioElement;

    constructor(readonly coreModel: Live2DModelWebGL, readonly modelSettings: ModelSettings) {
        super();

        this.tag = `MotionManager(${modelSettings.name})`;

        this.definitions = modelSettings.motions || {};

        if (modelSettings.expressions) {
            this.expressionManager = new ExpressionManager(coreModel, modelSettings);
        }

        this.setupMotions();
        this.stopAllMotions();
    }

    protected setupMotions(): void {
        // initialize all motion groups with empty arrays
        Object.keys(this.definitions).forEach(group => (this.motionGroups[group] = []));

        // preload idle motions
        this.loadMotion(Group.Idle).then();
    }

    /**
     * Loads a motion, or all motions, in a group.
     * @param group
     * @param index - If not specified, all motions in this group will be loaded.
     */
    async loadMotion(group: string, index?: number): Promise<Live2DMotion | void> {
        return new Promise(resolve => {
            const definitionGroup = this.definitions[group];

            if (definitionGroup) {
                const loader = new Loader();
                const indices = index !== undefined ? [index] : definitionGroup.keys();

                for (const i of indices as number[]) {
                    const definition = definitionGroup[i];

                    if (definition) {
                        loader.add(
                            this.modelSettings.resolvePath(definition.file),
                            {
                                xhrType: LoaderResource.XHR_RESPONSE_TYPE.BUFFER,
                                metadata: { definition, index: i },
                            },
                        );
                    } else {
                        logger.warn(this.tag, `Cannot find motion at "${group}"[${i}]`);
                    }
                }

                loader
                    .on('load', (loader: Loader, resource: LoaderResource) => {
                        const definition = resource.metadata.definition as MotionDefinition;

                        try {
                            const motion = Live2DMotion.loadMotion(resource.data);

                            motion.setFadeIn(definition.fadeIn! > 0 ? definition.fadeIn! : DEFAULT_FADE_TIMEOUT);
                            motion.setFadeOut(definition.fadeOut! > 0 ? definition.fadeOut! : DEFAULT_FADE_TIMEOUT);

                            this.motionGroups[group][resource.metadata.index] = motion;

                            resolve(motion);
                        } catch (e) {
                            logger.warn(this.tag, `Failed to load motion: ${definition.file}`, e);
                        }
                    })
                    .load(() => resolve());
            } else {
                logger.warn(this.tag, `Cannot find motion group "${group}"`);
                resolve();
            }
        });
    }

    /**
     * Starts a motion as given priority.
     * @param group
     * @param index
     * @param priority
     * @return Promise that resolves with true if a motion is successfully started.
     */
    async startMotionByPriority(group: string, index: number, priority: Priority = Priority.Normal): Promise<boolean> {
        if (priority !== Priority.Force && (priority <= this.currentPriority || priority <= this.reservePriority)) {
            logger.log(this.tag, 'Cannot start motion because another motion on same or higher priority is running');
            return false;
        }

        this.reservePriority = priority;

        const definition = this.definitions[group]?.[index];

        if (!definition) {
            return false;
        }

        if (this.currentAudio) {
            SoundManager.dispose(this.currentAudio);
        }

        let audio: HTMLAudioElement | undefined;

        if (config.sound && definition.sound) {
            // start to load the audio
            audio = SoundManager.add(this.modelSettings.resolvePath(definition.sound));

            this.currentAudio = audio;
        }

        let motion = this.motionGroups[group]?.[index] || (await this.loadMotion(group, index));

        if (!motion) {
            return false;
        }

        if (audio) {
            if (config.motionSync) {
                // wait until the audio has finished loading
                await SoundManager.play(audio).catch(noop);
            } else {
                SoundManager.play(audio).catch(noop);
            }
        }

        if (priority === this.reservePriority) {
            this.reservePriority = Priority.None;
        }

        this.currentPriority = priority;

        logger.log(this.tag, 'Start motion:', definition.file);

        if (priority > Priority.Idle) {
            this.expressionManager && this.expressionManager.resetExpression();
        }

        this.startMotion(motion);

        this.onMotionStart(group, index, audio);

        return true;
    }

    /**
     * Starts a random motion in the group as given priority.
     * @param group
     * @param priority
     */
    startRandomMotion(group: string, priority: Priority = Priority.Normal): void {
        const groupDefinitions = this.definitions[group];

        if (groupDefinitions?.length > 0) {
            const index = Math.floor(Math.random() * groupDefinitions.length);
            this.startMotionByPriority(group, index, priority).then();
        }
    }

    /**
     * Updates parameters of core model.
     * @return True if the parameters are actually updated.
     */
    update(): boolean {
        if (this.isFinished()) {
            if (this.currentPriority > Priority.Idle) {
                this.expressionManager?.restoreExpression();
            }

            this.currentPriority = Priority.None;

            if (this.reservePriority === Priority.None) {
                this.startRandomMotion(Group.Idle, Priority.Idle);
            }
        }

        const updated = this.updateParam(this.coreModel);

        // TODO: handle returned value
        this.expressionManager?.update();

        return updated;
    }

    /**
     * Called when a motion is started. Will be implemented when constructing {@link Live2DModel}.
     * @param group
     * @param index
     * @param audio
     */
    onMotionStart(group: string, index: number, audio?: HTMLAudioElement): void {}
}
