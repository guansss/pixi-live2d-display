import { MOTION_FADING_DURATION } from '@/cubism-common/constants';
import { MotionManager, MotionManagerOptions } from '@/cubism-common/MotionManager';
import { Cubism2ExpressionManager } from '@/cubism2/Cubism2ExpressionManager';
import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { LoaderResource } from '@pixi/loaders';
import './patch-motion';
import Motion = Cubism2Spec.Motion;

export interface Cubism2MotionGroups {
    idle: any;
}

export class Cubism2MotionManager extends MotionManager<Live2DMotion, Motion, keyof Cubism2MotionGroups> {
    readonly definitions: Partial<Record<keyof Cubism2MotionGroups, Cubism2Spec.Motion[]>>;

    readonly groups = { idle: 'idle' } as const;

    readonly motionDataType = LoaderResource.XHR_RESPONSE_TYPE.BUFFER;

    readonly queueManager = new MotionQueueManager();

    readonly settings!: Cubism2ModelSettings;

    expressionManager?: Cubism2ExpressionManager;

    constructor(settings: Cubism2ModelSettings, options?: MotionManagerOptions) {
        super(settings, options);

        this.definitions = this.settings.motions;

        this.init();
    }

    protected init(options?: MotionManagerOptions) {
        super.init();

        if (this.settings.expressions) {
            this.expressionManager = new Cubism2ExpressionManager(this.settings, options);
        }
    }

    isFinished(): boolean {
        return this.queueManager.isFinished();
    }

    createMotion(data: ArrayBuffer, definition: Motion): Live2DMotion {
        const motion = Live2DMotion.loadMotion(data);

        motion.setFadeIn(definition.fade_in! > 0 ? definition.fade_in! : MOTION_FADING_DURATION);
        motion.setFadeOut(definition.fade_out! > 0 ? definition.fade_out! : MOTION_FADING_DURATION);

        return motion;
    }

    getMotionFile(definition: Motion): string {
        return definition.file;
    }

    protected getMotionName(definition: Motion): string {
        return definition.file;
    }

    protected getSoundFile(definition: Motion): string | undefined {
        return definition.sound && this.settings.resolveURL(definition.sound);
    }

    protected _startMotion(motion: Live2DMotion, onFinish?: (motion: Live2DMotion) => void): number {
        motion.onFinishHandler = onFinish;

        return this.queueManager.startMotion(motion);
    }

    protected _stopAllMotions(): void {
        this.queueManager.stopAllMotions();
    }

    protected updateMotion(model: Live2DModelWebGL, now: DOMHighResTimeStamp): boolean {
        return this.queueManager.updateParam(model);
    }
}
