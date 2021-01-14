import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionManagerOptions } from '@/cubism-common/MotionManager';
import { logger } from '@/utils';
import { EventEmitter } from '@pixi/utils';

export abstract class ExpressionManager<Expression = any, ExpressionSpec = any> extends EventEmitter {
    /**
     * Tag for logging.
     */
    tag: string;

    /**
     * Expression definitions copied from {@link ModelSettings#expressions};
     */
    abstract readonly definitions: ExpressionSpec[];

    readonly settings: ModelSettings;

    /**
     * Instances of `Live2DExpression`. The structure is the same as {@link ExpressionManager#definitions};
     */
    expressions: (Expression | null | undefined)[] = [];

    /**
     * An empty `Live2DExpression`, used to reset the expression.
     */
    defaultExpression!: Expression;

    /**
     * Current expression. This won't change even when the expression has been reset in {@link ExpressionManager#resetExpression}.
     */
    currentExpression!: Expression;

    reserveExpressionIndex = -1;

    destroyed = false;

    protected constructor(settings: ModelSettings, options?: MotionManagerOptions) {
        super();
        this.settings = settings;
        this.tag = `ExpressionManager(${settings.name})`;
    }

    protected init() {
        this.defaultExpression = this.createExpression({}, undefined);
        this.currentExpression = this.defaultExpression;

        this.stopAllMotions();
    }

    /**
     * Loads an expression.
     * @param index
     */
    protected async loadExpression(index: number): Promise<Expression | undefined> {
        if (!this.definitions[index]) {
            logger.warn(this.tag, `Undefined expression at [${index}]`);
            return undefined;
        }

        if (this.expressions[index] === null) {
            logger.warn(this.tag, `Cannot set expression at [${index}] because it's already failed in loading.`);
            return undefined;
        }

        if (this.expressions[index]) {
            return this.expressions[index] as Expression;
        }

        const expression = await this._loadExpression(index);

        this.expressions[index] = expression;

        return expression;
    }

    private _loadExpression(index: number): Promise<Expression | undefined> {
        throw new Error('Not implemented.');
    }

    /**
     * Sets a random expression that differs from current one.
     */
    async setRandomExpression(): Promise<boolean> {
        if (this.definitions.length === 0) {
            return false;
        }

        if (this.definitions.length === 1) {
            return this.setExpression(0);
        }

        let index;

        do {
            index = Math.floor(Math.random() * this.definitions.length);
        } while (index === this.reserveExpressionIndex);

        return this.setExpression(index);
    }

    /**
     * Resets expression using {@link ExpressionManager#defaultExpression}.
     */
    resetExpression(): void {
        this.startMotion(this.defaultExpression);
    }

    /**
     * Restores expression to {@link ExpressionManager#currentExpression}.
     */
    restoreExpression(): void {
        this.startMotion(this.currentExpression);
    }

    /**
     * Sets an expression.
     * @param index
     */
    async setExpression(index: number | string): Promise<boolean> {
        if (typeof index !== 'number') {
            index = this.getExpressionIndex(index);
        }

        if (!(index > -1 && index < this.definitions.length)) {
            return false;
        }

        this.reserveExpressionIndex = index;

        const expression = await this.loadExpression(index);

        if (!expression || this.reserveExpressionIndex !== index) {
            return false;
        }

        this.reserveExpressionIndex = -1;
        this.currentExpression = expression;
        this.startMotion(expression);

        return true;
    }

    /**
     * Update parameters of a core model.
     * @return True if the parameters are actually updated.
     */
    update(model: object, now: DOMHighResTimeStamp) {
        if (!this.isFinished()) {
            return this.updateMotion(model, now);
        }

        return false;
    }

    destroy() {
        this.destroyed = true;
        this.emit('destroy');

        const self = this as Mutable<Partial<this>>;
        self.definitions = undefined;
        self.expressions = undefined;
    }

    abstract isFinished(): boolean;

    abstract getExpressionIndex(name: string): number;

    abstract getExpressionFile(definition: ExpressionSpec): string;

    abstract createExpression(data: object, definition: ExpressionSpec | undefined): Expression;

    protected abstract startMotion(motion: Expression): number;

    protected abstract stopAllMotions(): void;

    protected abstract updateMotion(model: object, now: DOMHighResTimeStamp): boolean;
}
