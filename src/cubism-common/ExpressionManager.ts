import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionManagerOptions } from '@/cubism-common/MotionManager';
import { logger } from '@/utils';
import { EventEmitter } from '@pixi/utils';

/**
 * Abstract expression manager.
 */
export abstract class ExpressionManager<Expression = any, ExpressionSpec = any> extends EventEmitter {
    /**
     * Tag for logging.
     */
    tag: string;

    /**
     * Expression definitions copied from ModelSettings.
     */
    abstract readonly definitions: ExpressionSpec[];

    /**
     * The ModelSettings reference.
     */
    readonly settings: ModelSettings;

    /**
     * The Expressions. The structure is the same as {@link definitions}, initially there's only
     * an empty array, which means all expressions will be `undefined`. When an Expression has
     * been loaded, it'll fill the place in which it should be; when it fails to load,
     * the place will be filled with `null`.
     */
    expressions: (Expression | null | undefined)[] = [];

    /**
     * An empty Expression to reset all the expression parameters.
     */
    defaultExpression!: Expression;

    /**
     * Current Expression. This will not be overwritten by the {@link defaultExpression}.
     */
    currentExpression!: Expression;

    /**
     * The pending Expression.
     */
    reserveExpressionIndex = -1;

    /**
     * Flags the instance has been destroyed.
     */
    destroyed = false;

    protected constructor(settings: ModelSettings, options?: MotionManagerOptions) {
        super();
        this.settings = settings;
        this.tag = `ExpressionManager(${settings.name})`;
    }

    /**
     * Should be called in the constructor of derived class.
     */
    protected init() {
        this.defaultExpression = this.createExpression({}, undefined);
        this.currentExpression = this.defaultExpression;

        this.stopAllExpressions();
    }

    /**
     * Loads an Expression. Errors in this method will not be thrown,
     * but be emitted with an "expressionLoadError" event.
     * @param index - Index of the expression in definitions.
     * @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
     * @emits {@link ExpressionManagerEvents.expressionLoaded}
     * @emits {@link ExpressionManagerEvents.expressionLoadError}
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

    /**
     * Loads the Expression. Will be implemented by Live2DFactory.
     * @ignore
     */
    private _loadExpression(index: number): Promise<Expression | undefined> {
        throw new Error('Not implemented.');
    }

    /**
     * Sets a random Expression that differs from current one.
     * @return Promise that resolves with true if succeeded, with false otherwise.
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
     * Resets model's expression using {@link defaultExpression}.
     */
    resetExpression(): void {
        this._setExpression(this.defaultExpression);
    }

    /**
     * Restores model's expression to {@link currentExpression}.
     */
    restoreExpression(): void {
        this._setExpression(this.currentExpression);
    }

    /**
     * Sets an Expression.
     * @param index - Either the index, or the name of the expression.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    async setExpression(index: number | string): Promise<boolean> {
        if (typeof index !== 'number') {
            index = this.getExpressionIndex(index);
        }
        // TODO: check if the same as current

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
        this._setExpression(expression);

        return true;
    }

    /**
     * Updates parameters of the core model.
     * @return True if the parameters are actually updated.
     */
    update(model: object, now: DOMHighResTimeStamp) {
        if (!this.isFinished()) {
            return this.updateParameters(model, now);
        }

        return false;
    }

    /**
     * Destroys the instance.
     * @emits {@link ExpressionManagerEvents.destroy}
     */
    destroy() {
        this.destroyed = true;
        this.emit('destroy');

        const self = this as Mutable<Partial<this>>;
        self.definitions = undefined;
        self.expressions = undefined;
    }

    /**
     * Checks if the expression playback has finished.
     */
    abstract isFinished(): boolean;

    /**
     * Retrieves the expression's index by its name.
     * @return The index. `-1` if not found.
     */
    abstract getExpressionIndex(name: string): number;

    /**
     * Retrieves the expression's file path by its definition.
     * @return The file path extracted from given definition. Not resolved.
     */
    abstract getExpressionFile(definition: ExpressionSpec): string;

    /**
     * Creates an Expression from the data.
     * @param data - Content of the expression file.
     * @param definition - The expression definition. Can be undefined when creating the {@link defaultExpression}.
     * @return The created Expression.
     */
    abstract createExpression(data: JSONObject, definition: ExpressionSpec | undefined): Expression;

    /**
     * Applies the Expression to the model.
     */
    protected abstract _setExpression(motion: Expression): number;

    /**
     * Cancels expression playback.
     */
    protected abstract stopAllExpressions(): void;

    /**
     * Updates parameters of the core model.
     * @return True if the parameters are actually updated.
     */
    protected abstract updateParameters(model: object, now: DOMHighResTimeStamp): boolean;
}
