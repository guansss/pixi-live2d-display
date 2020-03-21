import Live2DExpression from '@/live2d/Live2DExpression';
import { ExpressionDefinition } from '@/live2d/ModelSettings';
import { error, log } from '@/core/utils/log';
import { getJSON } from '@/core/utils/net';
import sample from 'lodash/sample';

export default class ExpressionManager extends MotionQueueManager {
    tag: string;

    readonly definitions: ExpressionDefinition[];
    readonly expressions: Live2DExpression[] = [];

    defaultExpression: Live2DExpression;
    currentExpression: Live2DExpression;

    constructor(name: string, readonly internalModel: Live2DModelWebGL, definitions: ExpressionDefinition[]) {
        super();

        this.tag = `ExpressionManager\n(${name})`;
        this.definitions = definitions;

        this.defaultExpression = new Live2DExpression(internalModel, {}, '(default)');
        this.currentExpression = this.defaultExpression;

        this.loadExpressions().then();
        this.stopAllMotions();
    }

    private async loadExpressions() {
        for (const { name, file } of this.definitions) {
            try {
                const json = await getJSON(file);
                this.expressions.push(new Live2DExpression(this.internalModel, json, name));
            } catch (e) {
                error(this.tag, `Failed to load expression [${name}]: ${file}`, e);
            }
        }

        this.expressions.push(this.defaultExpression); // at least put a normal expression
    }

    setRandomExpression() {
        if (this.expressions.length == 1) {
            this.setExpression(this.expressions[0]);
        } else {
            let expression;

            // prevent showing same expression twice
            do {
                expression = sample(this.expressions);
            } while (expression == this.currentExpression);

            this.setExpression(expression!);
        }
    }

    resetExpression() {
        this.startMotion(this.defaultExpression);
    }

    restoreExpression() {
        this.startMotion(this.currentExpression);
    }

    setExpression(expression: Live2DExpression) {
        log(this.tag, 'Set expression:', expression.name);

        this.currentExpression = expression;
        this.startMotion(expression);
    }

    update() {
        if (!this.isFinished()) {
            return this.updateParam(this.internalModel);
        }
    }
}
