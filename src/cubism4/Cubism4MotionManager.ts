import { MotionManager, MotionManagerOptions } from '@/cubism-common/MotionManager';
import { Cubism4ExpressionManager } from '@/cubism4/Cubism4ExpressionManager';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { CubismModel } from '@cubism/model/cubismmodel';
import { ACubismMotion } from '@cubism/motion/acubismmotion';
import { CubismMotion } from '@cubism/motion/cubismmotion';
import { CubismMotionQueueManager } from '@cubism/motion/cubismmotionqueuemanager';

export interface Cubism4MotionGroups {
    Idle: any;
}

export class Cubism4MotionManager extends MotionManager<CubismMotion, CubismSpec.Motion, keyof Cubism4MotionGroups> {
    readonly definitions: Partial<Record<keyof Cubism4MotionGroups, CubismSpec.Motion[]>>;

    readonly groups = { idle: 'Idle' } as const;

    readonly motionDataType = 'json';

    readonly queueManager = new CubismMotionQueueManager();

    readonly settings!: Cubism4ModelSettings;

    expressionManager?: Cubism4ExpressionManager;

    eyeBlinkIds: string[];
    lipSyncIds: string[];

    constructor(settings: Cubism4ModelSettings, options?: MotionManagerOptions) {
        super(settings, options);

        this.definitions = settings.motions ?? {};
        this.eyeBlinkIds = settings.getEyeBlinkParameters() || [];
        this.lipSyncIds = settings.getLipSyncParameters() || [];

        this.init(options);
    }

    protected init(options?: MotionManagerOptions) {
        super.init();

        if (this.settings.expressions) {
            this.expressionManager = new Cubism4ExpressionManager(this.settings, options);
        }
    }

    isFinished(): boolean {
        return this.queueManager.isFinished();
    }

    protected _startMotion(motion: CubismMotion, onFinish?: (motion: CubismMotion) => void): number {
        motion.setFinishedMotionHandler(onFinish as (motion: ACubismMotion) => void);

        this.queueManager.stopAllMotions();

        return this.queueManager.startMotion(motion, false, performance.now());
    }

    protected _stopAllMotions(): void {
        this.queueManager.stopAllMotions();
    }

    createMotion(data: object, definition: CubismSpec.Motion): CubismMotion {
        const motion = CubismMotion.create(data as unknown as CubismSpec.MotionJSON);

        if (definition.FadeInTime! >= 0) {
            motion.setFadeInTime(definition.FadeInTime!);
        }

        if (definition.FadeOutTime! >= 0) {
            motion.setFadeOutTime(definition.FadeOutTime!);
        }

        motion.setEffectIds(this.eyeBlinkIds, this.lipSyncIds);

        return motion;
    }

    getMotionFile(definition: CubismSpec.Motion): string {
        return definition.File;
    }

    protected getMotionName(definition: CubismSpec.Motion): string {
        return definition.File;
    }

    protected getSoundFile(definition: CubismSpec.Motion): string | undefined {
        return definition.Sound;
    }

    protected updateMotion(model: CubismModel, now: DOMHighResTimeStamp): boolean {
        return this.queueManager.doUpdateMotion(model, now);
    }
}
