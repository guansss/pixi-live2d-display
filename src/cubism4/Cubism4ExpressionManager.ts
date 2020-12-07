import { MotionManagerOptions } from '@/cubism-common';
import { ExpressionManager } from '@/cubism-common/ExpressionManager';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { CubismModel } from '@cubism/model/cubismmodel';
import { CubismExpressionMotion } from '@cubism/motion/cubismexpressionmotion';
import { CubismMotionQueueManager } from '@cubism/motion/cubismmotionqueuemanager';
import { CubismExpressionDef } from '@cubism/settings/defs';

export class Cubism4ExpressionManager extends ExpressionManager<CubismModel, Cubism4ModelSettings, CubismExpressionMotion, CubismExpressionDef> {
    readonly queueManager = new CubismMotionQueueManager();

    constructor(settings: Cubism4ModelSettings, options?: MotionManagerOptions) {
        super(settings, options);

        this.init();
    }

    isFinished(): boolean {
        return this.queueManager.isFinished();
    }

    getExpressionIndex(name: string): number {
        return this.definitions.findIndex(def => def.Name === name);
    }

    getExpressionFile(definition: CubismExpressionDef): string {
        return this.settings.resolvePath(definition.File);
    }

    createExpression(data: JSONObject, definition: CubismExpressionDef | undefined) {
        return CubismExpressionMotion.create(data);
    }

    protected getDefinitions(): CubismExpressionDef[] {
        return this.settings.expressions ?? [];
    }

    protected startMotion(motion: CubismExpressionMotion): number {
        return this.queueManager.startMotion(motion, false, performance.now());
    }

    protected stopAllMotions(): void {
        this.queueManager.stopAllMotions();
    }

    protected updateMotion(model: CubismModel, now: DOMHighResTimeStamp): boolean {
        return this.queueManager.doUpdateMotion(model, now);
    }
}
