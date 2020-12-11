import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionManagerOptions } from '@/cubism-common/MotionManager';
import { Live2DFactory } from '@/factory';
import { logger } from '@/utils';
import { Loader, LoaderResource } from '@pixi/loaders';
import { EventEmitter } from '@pixi/utils';

export abstract class ExpressionManager<Model = any, Settings extends ModelSettings = ModelSettings, Expression = any, ExpressionSpec = any> extends EventEmitter {
    /**
     * Tag for logging.
     */
    tag: string;

    readonly settings: Settings;

    /**
     * Expression definitions copied from {@link ModelSettings#expressions};
     */
    readonly definitions!: ExpressionSpec[];

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

    protected constructor(settings: Settings, options?: MotionManagerOptions) {
        super();
        this.settings = settings;
        this.tag = `ExpressionManager(${settings.name})`;
    }

    protected init() {
        (this.definitions as this['definitions']) = this.getDefinitions();

        this.defaultExpression = this.createExpression({}, undefined);
        this.currentExpression = this.defaultExpression;

        this.loadExpressions().then();
        this.stopAllMotions();
    }

    /**
     * Loads all expressions.
     */
    protected async loadExpressions(): Promise<void> {
        return new Promise(resolve => {
            const loader = new Loader();

            for (const definition of this.definitions) {
                loader.add(this.getExpressionFile(definition), { definition });
            }

            loader
                .on('load', (loader: Loader, resource: LoaderResource) => {
                    if (resource.type === LoaderResource.TYPE.JSON) {
                        this.expressions.push(this.createExpression(resource.metadata.definition, resource.data));
                    } else {
                        logger.warn(this.tag, `Unexpected format of expression file "${resource.name}"`);
                    }
                })
                .on('error', (error: Error, loader: Loader, resource: LoaderResource) => {
                    logger.warn(this.tag, `Failed to load expression file "${resource.name}"`);
                })
                .load(() => {
                    this.expressions.push(this.defaultExpression); // at least put a normal expression

                    resolve();
                });
        });
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

        const expression = await Live2DFactory.loadExpression(this, index);

        this.expressions[index] = expression;

        return expression;
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

        this.currentExpression = expression;
        this.startMotion(expression);

        return true;
    }

    /**
     * Update parameters of a core model.
     * @return True if the parameters are actually updated.
     */
    update(model: Model, now: DOMHighResTimeStamp) {
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

    abstract createExpression(data: JSONObject, definition: ExpressionSpec | undefined): Expression;

    protected abstract getDefinitions(): ExpressionSpec[];

    protected abstract startMotion(motion: Expression): number;

    protected abstract stopAllMotions(): void;

    protected abstract updateMotion(model: Model, now: DOMHighResTimeStamp): boolean;
}
