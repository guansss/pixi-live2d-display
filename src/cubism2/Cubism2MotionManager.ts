import { config } from "@/config";
import type { MotionManagerOptions } from "@/cubism-common/MotionManager";
import { MotionManager } from "@/cubism-common/MotionManager";
import { Cubism2ExpressionManager } from "@/cubism2/Cubism2ExpressionManager";
import type { Cubism2ModelSettings } from "@/cubism2/Cubism2ModelSettings";
import type { Cubism2Spec } from "../types/Cubism2Spec";
import type { Mutable } from "../types/helpers";
import "./patch-motion";

export class Cubism2MotionManager extends MotionManager<Live2DMotion, Cubism2Spec.Motion> {
    readonly definitions: Partial<Record<string, Cubism2Spec.Motion[]>>;

    readonly groups = { idle: "idle" } as const;

    readonly motionDataType = "arraybuffer";

    readonly queueManager = new MotionQueueManager();

    declare readonly settings: Cubism2ModelSettings;

    expressionManager?: Cubism2ExpressionManager;

    constructor(settings: Cubism2ModelSettings, options?: MotionManagerOptions) {
        super(settings, options);

        this.definitions = this.settings.motions;

        this.init(options);
    }

    protected init(options?: MotionManagerOptions) {
        super.init(options);

        if (this.settings.expressions) {
            this.expressionManager = new Cubism2ExpressionManager(this.settings, options);
        }
    }

    isFinished(): boolean {
        return this.queueManager.isFinished();
    }

    createMotion(data: ArrayBuffer, group: string, definition: Cubism2Spec.Motion): Live2DMotion {
        const motion = Live2DMotion.loadMotion(data);

        const defaultFadingDuration =
            group === this.groups.idle
                ? config.idleMotionFadingDuration
                : config.motionFadingDuration;

        motion.setFadeIn(definition.fade_in! > 0 ? definition.fade_in! : defaultFadingDuration);
        motion.setFadeOut(definition.fade_out! > 0 ? definition.fade_out! : defaultFadingDuration);

        return motion;
    }

    getMotionFile(definition: Cubism2Spec.Motion): string {
        return definition.file;
    }

    protected getMotionName(definition: Cubism2Spec.Motion): string {
        return definition.file;
    }

    protected getSoundFile(definition: Cubism2Spec.Motion): string | undefined {
        return definition.sound;
    }

    protected _startMotion(
        motion: Live2DMotion,
        onFinish?: (motion: Live2DMotion) => void,
    ): number {
        motion.onFinishHandler = onFinish;

        this.queueManager.stopAllMotions();

        return this.queueManager.startMotion(motion);
    }

    protected _stopAllMotions(): void {
        this.queueManager.stopAllMotions();
    }

    protected updateParameters(model: Live2DModelWebGL, now: DOMHighResTimeStamp): boolean {
        return this.queueManager.updateParam(model);
    }

    destroy() {
        super.destroy();

        (this as Partial<Mutable<this>>).queueManager = undefined;
    }
}
