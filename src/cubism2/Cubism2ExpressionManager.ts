import { MotionManagerOptions } from '@/cubism-common';
import { ExpressionManager } from '@/cubism-common/ExpressionManager';
import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Live2DExpression } from './Live2DExpression';
import Expression = Cubism2Spec.Expression;

export class Cubism2ExpressionManager extends ExpressionManager<Live2DExpression> {
    readonly queueManager = new MotionQueueManager();

    readonly definitions: Expression[];

    readonly settings!: Cubism2ModelSettings;

    constructor(settings: Cubism2ModelSettings, options?: MotionManagerOptions) {
        super(settings, options);

        this.definitions = this.settings.expressions ?? [];

        this.init();
    }

    isFinished(): boolean {
        return this.queueManager.isFinished();
    }

    getExpressionIndex(name: string): number {
        return this.definitions.findIndex(def => def.name === name);
    }

    getExpressionFile(definition: Expression): string {
        return definition.file;
    }

    createExpression(data: object, definition: Expression | undefined): Live2DExpression {
        return new Live2DExpression(data);
    }

    protected startMotion(motion: Live2DExpression): number {
        return this.queueManager.startMotion(motion);
    }

    protected stopAllMotions(): void {
        this.queueManager.stopAllMotions();
    }

    protected updateMotion(model: Live2DModelWebGL, dt: number): boolean {
        return this.queueManager.updateParam(model);
    }
}
