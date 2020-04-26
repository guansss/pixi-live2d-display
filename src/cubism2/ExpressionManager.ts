import { Loader, LoaderResource } from '@pixi/loaders';
import sample from 'lodash/sample';
import { logger } from '../utils';
import { Live2DExpression } from './Live2DExpression';
import { ModelSettings } from './ModelSettings';
import { ExpressionDefinition } from './ModelSettingsJSON';

export class ExpressionManager extends MotionQueueManager {
    /**
     * Tag for logging.
     */
    tag: string;

    /**
     * Expression definitions copied from {@link ModelSettings#expressions};
     */
    readonly definitions: ExpressionDefinition[];

    /**
     * Instances of `Live2DExpression`. The structure is the same as {@link ExpressionManager#definitions};
     */
    readonly expressions: Live2DExpression[] = [];

    /**
     * An empty `Live2DExpression`, used to reset the expression.
     */
    defaultExpression: Live2DExpression;

    /**
     * Current expression. This won't change even when the expression has been reset in {@link ExpressionManager#resetExpression}.
     */
    currentExpression: Live2DExpression;

    constructor(readonly coreModel: Live2DModelWebGL, readonly modelSettings: ModelSettings) {
        super();

        this.tag = `ExpressionManager(${modelSettings.name})`;

        this.definitions = modelSettings.expressions || [];

        this.defaultExpression = new Live2DExpression(coreModel, {}, '(default)');
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

            this.definitions.forEach(({ name, file }) => loader.add(this.modelSettings.resolvePath(file), { name }));

            loader
                .on('load', (loader: Loader, resource: LoaderResource) => {
                    if (resource.type === LoaderResource.TYPE.JSON) {
                        this.expressions.push(new Live2DExpression(this.coreModel, resource.data, resource.name));
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
     * Sets a random expression. Selected expression won't be the same as previous one.
     */
    setRandomExpression(): void {
        if (this.expressions.length == 1) {
            this.setExpression(this.expressions[0]);
        } else {
            let expression;

            do {
                expression = sample(this.expressions);
            } while (expression == this.currentExpression);

            this.setExpression(expression!);
        }
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
     * @param expression
     */
    setExpression(expression: Live2DExpression): void {
        this.currentExpression = expression;
        this.startMotion(expression);
    }

    /**
     * Update parameters of core model.
     * @return True if the parameters are actually updated.
     */
    update() {
        if (!this.isFinished()) {
            return this.updateParam(this.coreModel);
        }
        // TODO: return false
    }
}
