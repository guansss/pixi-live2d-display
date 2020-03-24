import { Loader, LoaderResource } from '@pixi/loaders';
import sample from 'lodash/sample';
import { warn } from '../utils/log';
import Live2DExpression from './Live2DExpression';
import ModelSettings from './ModelSettings';
import { ExpressionDefinition } from './ModelSettingsJSON';

export default class ExpressionManager extends MotionQueueManager {
    tag: string;

    readonly definitions: ExpressionDefinition[];
    readonly expressions: Live2DExpression[] = [];

    defaultExpression: Live2DExpression;
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

    private async loadExpressions() {
        return new Promise(resolve => {
            const loader = new Loader();

            this.definitions.forEach(({ name, file }) => loader.add(this.modelSettings.resolvePath(file), { name }));

            loader
                .on('load', (loader: Loader, resource: LoaderResource) => {
                    if (resource.type === LoaderResource.TYPE.JSON) {
                        this.expressions.push(new Live2DExpression(this.coreModel, resource.data, resource.name));
                    } else {
                        warn(this.tag, `Unexpected format of expression file "${resource.name}"`);
                    }
                })
                .on('error', (error: Error, loader: Loader, resource: LoaderResource) => {
                    warn(this.tag, `Failed to load expression file "${resource.name}"`);
                })
                .load(() => {
                    this.expressions.push(this.defaultExpression); // at least put a normal expression

                    resolve();
                });
        });
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
        this.currentExpression = expression;
        this.startMotion(expression);
    }

    update() {
        if (!this.isFinished()) {
            return this.updateParam(this.coreModel);
        }
    }
}
