// Another nightmare of generics.

import { DerivedInternalModel, ExpressionManager, ModelSettings, MotionManager } from '@/cubism-common';
import { Live2DModelOptions } from '@/cubism-common/defs';
import { Live2DModel } from '@/Live2DModel';
import { Live2DLoader } from '@/loader/loader';
import { XHRLoader } from '@/loader/XHRLoader';
import { logger } from '@/utils';
import { Texture } from '@pixi/core';
import noop from 'lodash/noop';

const TAG = 'Live2DFactory';

export interface Live2DFactoryOptions extends Live2DModelOptions {
    /**
     * String to use for crossOrigin properties on `<img>` elements.
     * @default undefined
     */
    crossOrigin?: string;
}

export interface SubFactory<IM extends DerivedInternalModel> {
    version: number;

    createModelSettings(json: any): IM['settings'] | undefined;

    test(settings: ModelSettings): settings is IM['settings'];

    createCoreModel(data: ArrayBuffer): IM['coreModel'];

    createInternalModel(coreModel: IM['coreModel'], settings: IM['settings'], options?: Live2DFactoryOptions): IM;

    createPose(coreModel: IM['coreModel'], data: any): NonNullable<IM['pose']>;

    createPhysics(coreModel: IM['coreModel'], data: any): NonNullable<IM['physics']>;
}

export class Live2DFactory {
    static instance = new Live2DFactory(XHRLoader.instance);

    static subFactories: SubFactory<DerivedInternalModel>[] = [];

    static registerSubFactory<IM extends DerivedInternalModel>(subFactory: SubFactory<IM>) {
        this.subFactories.push(subFactory);

        // higher version as higher priority
        this.subFactories.sort((a, b) => b.version - a.version);
    }

    /**
     * loading tasks of each motion. The structure of each value in this map is the same as {@link MotionManager#definitions}.
     */
    motionTasksMap = new WeakMap<MotionManager, Partial<Record<string, (Promise<any> | undefined)[]>>>();

    expressionTasksMap = new WeakMap<ExpressionManager, (Promise<any> | undefined)[]>();

    loader: Live2DLoader;

    constructor(loader: Live2DLoader) {
        this.loader = loader;
    }

    async initBySource<IM extends DerivedInternalModel>(model: Live2DModel<IM>, source: any, options?: Live2DFactoryOptions) {
        if (typeof source === 'string') {
            await this.initByURL(model, source);
        }

        if (source && typeof source === 'object') {
            if (source instanceof ModelSettings) {
                await this.initBySettings(model, source as DerivedInternalModel['settings']);
            }

            await this.initByJSON(model, source);
        }

        throw new TypeError('Unknown source.');
    }

    async initByURL<IM extends DerivedInternalModel>(model: Live2DModel<IM>, url: string, options?: Live2DFactoryOptions) {
        try {
            const data = await this.loader.loadJSON(url, model);

            data.url = url;

            model.emit('settingsJSONLoaded', data);

            return this.initByJSON(model, data, options);
        } catch (e) {
            logger.warn(TAG, 'Failed to initialize Live2DModel by URL:', url);
            throw e;
        }
    }

    async initByJSON<IM extends DerivedInternalModel>(model: Live2DModel<IM>, json: any, options?: Live2DFactoryOptions) {
        try {
            let settings: DerivedInternalModel['settings'] | undefined;

            for (const subFactory of Live2DFactory.subFactories) {
                settings = subFactory.createModelSettings(json);

                if (settings) break;
            }

            if (!settings) {
                throw new TypeError('Unknown settings format.');
            }

            model.emit('settingsLoaded', settings);

            return this.initBySettings(model, settings, options);
        } catch (e) {
            logger.warn(TAG, 'Failed to initialize Live2DModel by JSON:', '\n', json);
            throw e;
        }
    }

    async initBySettings<IM extends DerivedInternalModel>(live2DModel: Live2DModel<IM>, settings: IM['settings'], options?: Live2DFactoryOptions) {
        try {
            live2DModel.textures = settings.textures.map(tex => Texture.from(tex, { resourceOptions: { crossorigin: options?.crossOrigin } }));

            // emit event when all textures have been loaded
            // TODO: possible memory leak?
            live2DModel.textures.forEach(tex => tex.on('loaded', () => {
                if (live2DModel.textures.every(tex => tex.valid)) {
                    live2DModel.emit('textureLoaded');
                }
            }));

            live2DModel.internalModel = await this.createInternalModel(live2DModel, settings, options);

            live2DModel.emit('modelLoaded', settings);
        } catch (e) {
            logger.warn(TAG, 'Failed to initialize Live2DModel with settings.');
            throw e;
        }
    }

    async createInternalModel<IM extends DerivedInternalModel>(live2DModel: Live2DModel<IM>, settings: IM['settings'], options?: Live2DFactoryOptions): Promise<IM> {
        const subFactory = Live2DFactory.subFactories.find(f => f.test(settings));

        if (!subFactory) {
            throw new TypeError('Unknown model settings.');
        }

        const [modelData, poseData, physicsData] = await Promise.all<any>([
            this.loader.loadResArrayBuffer(settings.moc, settings.url, live2DModel),

            // errors will be ignored while loading optional resources
            settings.pose && this.loader.loadResArrayBuffer(settings.pose, settings.url, live2DModel).catch(noop),
            settings.physics && this.loader.loadResArrayBuffer(settings.physics, settings.url, live2DModel).catch(noop),
        ]) as [ArrayBuffer, any, any];

        const coreModel = subFactory.createCoreModel(modelData);
        const internalModel = subFactory.createInternalModel(coreModel, settings, options);

        if (poseData) {
            internalModel.pose = subFactory.createPose(coreModel, poseData);
        }
        if (physicsData) {
            internalModel.physics = subFactory.createPhysics(coreModel, poseData);
        }

        return internalModel as IM;
    }

    loadMotion<Motion, MotionDef, Groups extends string>(motionManager: MotionManager<any, ModelSettings, any, Motion, MotionDef, Groups>, group: Groups, index: number): Promise<Motion | undefined> {
        try {
            const definition = motionManager.definitions[group] ?. [index];

            if (!definition) {
                return Promise.resolve(undefined);
            }

            let tasks = this.motionTasksMap.get(motionManager);

            if (!tasks) {
                tasks = {};
                this.motionTasksMap.set(motionManager, tasks);
            }

            let taskGroup = tasks[group];

            if (!taskGroup) {
                taskGroup = [];
                tasks[group] = taskGroup;
            }

            const path = motionManager.getMotionFile(definition);
            const loadMethod = motionManager.motionDataType === 'json' ? this.loader.loadResJSON : this.loader.loadResArrayBuffer;

            taskGroup[index] ??= loadMethod(path, motionManager.settings.url, motionManager)
                .then(data => {
                    delete taskGroup![index];

                    return motionManager.createMotion(data, definition);
                })
                .catch(e => {
                    logger.warn(motionManager.tag, `Failed to load motion: ${path}\n`, e);
                });

            return taskGroup[index]!;
        } catch (e) {
            logger.warn(motionManager.tag, `Failed to load motion at "${group}"[${index}]\n`, e);
        }

        return Promise.resolve(undefined);
    }

    releaseMotionManager(motionManager: MotionManager) {
        this.loader.releaseTarget(motionManager);
        this.motionTasksMap.delete(motionManager);
    }

    loadExpression<Expression>(expressionManager: ExpressionManager<any, ModelSettings, Expression>, index: number): Promise<Expression | undefined> {
        try {
            const definition = expressionManager.definitions[index];

            if (!definition) {
                return Promise.resolve(undefined);
            }

            let tasks = this.expressionTasksMap.get(expressionManager);

            if (!tasks) {
                tasks = [];
                this.expressionTasksMap.set(expressionManager, tasks);
            }

            const path = expressionManager.getExpressionFile(definition);

            tasks[index] ??= this.loader.loadResJSON(path, expressionManager.settings.url, expressionManager)
                .then(data => {
                    delete tasks![index];

                    return expressionManager.createExpression(definition, data);
                })
                .catch(e => {
                    logger.warn(expressionManager.tag, `Failed to load expression: ${path}\n`, e);
                });

            return tasks[index]!;
        } catch (e) {
            logger.warn(expressionManager.tag, `Failed to load expression at [${index}]\n`, e);
        }

        return Promise.resolve(undefined);
    }

    releaseExpressionManager(expressionManager: ExpressionManager) {
        this.loader.releaseTarget(expressionManager);
        this.expressionTasksMap.delete(expressionManager);
    }
}
