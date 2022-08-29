import { InternalModel, ModelSettings } from '@/cubism-common';
import { Texture } from '@pixi/core';
import { JSONObject } from './helpers';

export interface Live2DModelEvents {
    /**
     * @event - One or more hit areas are hit.
     * @param - The names of *hit* hit areas.
     */
    hit: [string[]];

    /**
     * @event - The settings JSON has been loaded.
     * @param - The settings JSON object.
     */
    settingsJSONLoaded: [JSONObject];

    /**
     * @event - The ModelSettings has been loaded.
     * @param - The ModelSettings instance.
     */
    settingsLoaded: [ModelSettings];

    /**
     * @event - The textures have all been loaded.
     * @param - The texture array.
     */
    textureLoaded: [Texture[]];

    /**
     * @event - The InternalModel has been loaded.
     * @param - The InternalModel instance.
     */
    modelLoaded: [InternalModel];

    /**
     * @event - The Pose has been loaded.
     * @param - The Pose instance, varies in different Cubism version.
     */
    poseLoaded: [unknown];

    /**
     * @event - The Physics has been loaded.
     * @param - The Physics instance, varies in different Cubism version.
     */
    physicsLoaded: [unknown];

    /**
     * @event - All the essential resources have been loaded.
     */
    ready: [];

    /**
     * @event - All the resources have been loaded.
     */
    load: [];
}

export interface MotionManagerEvents<Motion = any> {
    /**
     * @event - A Motion has been loaded.
     * @param - The Motion instance, varies in different Cubism version.
     */
    motionLoaded: [Motion];

    /**
     * @event - An error occurs when loading a Motion.
     * @param - The error.
     */
    motionLoadError: [unknown];

    /**
     * @event - Before destroyed.
     */
    destroy: [];
}

export interface ExpressionManagerEvents<Expression = any> {
    /**
     * @event - An Expression has been loaded.
     * @param - The Expression instance, varies in different Cubism version.
     */
    expressionLoaded: [Expression];

    /**
     * @event - An error occurs when loading an Expression.
     * @param - The error.
     */
    expressionLoadError: [unknown];

    /**
     * @event - Before destroyed.
     */
    destroy: [];
}

export interface InternalModelEvents {
    /**
     * @event - Before the model's parameters are updated by the motion.
     */
    beforeMotionUpdate: [];

    /**
     * @event - After the model's parameters are updated by the motion.
     */
    afterMotionUpdate: [];

    /**
     * @event - Before the model is updated with its parameters applied.
     */
    beforeModelUpdate: [];

    /**
     * @event - Before destroyed.
     */
    destroy: [];
}
