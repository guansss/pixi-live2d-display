import { MotionManagerOptions } from '@/cubism-common';
import { ExpressionManager } from '@/cubism-common/ExpressionManager';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { CubismModel } from '@cubism/model/cubismmodel';
import { CubismExpressionMotion } from '@cubism/motion/cubismexpressionmotion';
import { CubismMotionQueueManager } from '@cubism/motion/cubismmotionqueuemanager';
import Exp3 = CubismSpec.Exp3;

type Expression = NonNullable<CubismSpec.Model3['FileReferences']['Expressions']>[number]

export class Cubism4ExpressionManager extends ExpressionManager<CubismModel, Cubism4ModelSettings, CubismExpressionMotion, Expression> {
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

    getExpressionFile(definition: Expression): string {
        return this.settings.resolvePath(definition.File);
    }

    createExpression(data: JSONObject, definition: Expression | undefined) {
        return CubismExpressionMotion.create(data as unknown as Exp3);
    }

    protected getDefinitions(): Expression[] {
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
