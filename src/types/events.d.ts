import { InternalModel, ModelSettings } from '@/cubism-common';
import { Texture } from '@pixi/core';

declare interface Live2DModelEvents {
    /**
     * One or more hit areas are hit.
     * @event hit
     * @param The names of *hit* hit areas.
     */
    hit: [string[]];

    /**
     * The settings JSON has been loaded.
     * @event settingsJSONLoaded
     * @param The settings JSON object.
     */
    settingsJSONLoaded: [any];

    /**
     * The ModelSettings has been loaded.
     * @event settingsLoaded
     * @param The ModelSettings instance.
     */
    settingsLoaded: [ModelSettings];

    /**
     * The textures have all been loaded.
     * @event textureLoaded
     * @param The texture array.
     */
    textureLoaded: [Texture[]];

    /**
     * The InternalModel has been loaded.
     * @event modelLoaded
     * @param The InternalModel instance.
     */
    modelLoaded: [InternalModel];

    /**
     * The Pose has been loaded.
     * @event poseLoaded
     * @param The Pose instance, varies in different Cubism version.
     */
    poseLoaded: [any];

    /**
     * The Physics has been loaded.
     * @event physicsLoaded
     * @param The Physics instance, varies in different Cubism version.
     */
    physicsLoaded: [any];

    /**
     * All the essential resources have been loaded.
     * @event ready
     */
    ready: [];

    /**
     * All the resources have been loaded.
     * @event load
     */
    load: [];
}

declare interface MotionManagerEvents<Motion = any> {
    /**
     * A Motion has been loaded.
     * @event motionLoaded
     * @param The Motion instance, varies in different Cubism version.
     */
    motionLoaded: [Motion];

    /**
     * An error occurs when loading a Motion.
     * @event motionLoadError
     * @param The error.
     */
    motionLoadError: [any];

    /**
     * Before destroyed.
     * @event destroy
     */
    destroy: [];
}

declare interface ExpressionManagerEvents<Expression = any> {
    /**
     * An Expression has been loaded.
     * @event expressionLoaded
     * @param The Expression instance, varies in different Cubism version.
     */
    expressionLoaded: [Expression];

    /**
     * An error occurs when loading an Expression.
     * @event expressionLoadError
     * @param The error.
     */
    expressionLoadError: [any];

    /**
     * Before destroyed.
     * @event destroy
     */
    destroy: [];
}

declare interface InternalModelEvents {
    /**
     * Before destroyed.
     * @event destroy
     */
    destroy: [];
}
