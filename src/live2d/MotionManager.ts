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
    tag: string;

    definitions: { [group: string]: MotionDefinition[] };
    motionGroups: { [group: string]: Live2DMotion[] } = {};

    expressionManager?: ExpressionManager;

    currentPriority = Priority.None;
    reservePriority = Priority.None;

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

    protected setupMotions() {
        // initialize all motion groups with empty arrays
        Object.keys(this.definitions).forEach(group => (this.motionGroups[group] = []));

        // preload idle motions
        this.loadMotion(Group.Idle).then();
    }

    /**
     * Loads a motion, or entire motion group if no index specified.
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

    async startMotionByPriority(group: string, index: number, priority: Priority = Priority.Normal): Promise<boolean> {
        if (priority !== Priority.Force && (priority <= this.currentPriority || priority <= this.reservePriority)) {
            logger.log(this.tag, 'Cannot start motion because another motion of same or higher priority is running');
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

    startRandomMotion(group: string, priority: Priority = Priority.Normal) {
        const groupDefinitions = this.definitions[group];

        if (groupDefinitions?.length > 0) {
            const index = Math.floor(Math.random() * groupDefinitions.length);
            this.startMotionByPriority(group, index, priority).then();
        }
    }

    update() {
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

        this.expressionManager?.update();

        return updated;
    }

    // to be overridden
    onMotionStart(group: string, index: number, audio?: HTMLAudioElement) {}
}
