import { MOTION_FADING_DURATION } from '@/cubism-common/constants';
import { MotionManager, MotionManagerOptions } from '@/cubism-common/MotionManager';
import { Cubism2ExpressionManager } from '@/cubism2/Cubism2ExpressionManager';
import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Cubism2MotionDef } from '@/cubism2/defs';
import { LoaderResource } from '@pixi/loaders';
import './patch-motion';

export interface Cubism2MotionGroups {
    idle: any;
}

export class Cubism2MotionManager extends MotionManager<Live2DModelWebGL, Cubism2ModelSettings, Cubism2ExpressionManager, Live2DMotion, Cubism2MotionDef, keyof Cubism2MotionGroups> {
    readonly groups = { idle: 'idle' } as const;

    readonly motionDataType = LoaderResource.XHR_RESPONSE_TYPE.BUFFER;

    readonly queueManager = new MotionQueueManager();

    expressionManager?: Cubism2ExpressionManager;

    constructor(settings: Cubism2ModelSettings, options?: MotionManagerOptions) {
        super(settings, options);

        if (settings.expressions) {
            this.expressionManager = new Cubism2ExpressionManager(settings);
        }

        this.init(options);
    }

    isFinished(): boolean {
        return this.queueManager.isFinished();
    }

    createMotion(data: ArrayBuffer, definition: Cubism2MotionDef): Live2DMotion {
        const motion = Live2DMotion.loadMotion(data);

        motion.setFadeIn(definition.fade_in! > 0 ? definition.fade_in! : MOTION_FADING_DURATION);
        motion.setFadeOut(definition.fade_out! > 0 ? definition.fade_out! : MOTION_FADING_DURATION);

        return motion;
    }

    getMotionFile(definition: Cubism2MotionDef): string {
        return definition.file;
    }

    protected getDefinitions(): Partial<Record<keyof Cubism2MotionGroups, Cubism2MotionDef[]>> {
        return this.settings.motions;
    }

    protected getMotionName(definition: Cubism2MotionDef): string {
        return definition.file;
    }

    protected getSoundFile(definition: Cubism2MotionDef): string | undefined {
        return definition.sound && this.settings.resolvePath(definition.sound);
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
