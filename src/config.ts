import { CubismConfig } from "@cubism/config";

/**
 * Global configs.
 */
export namespace config {
    export const LOG_LEVEL_VERBOSE = 0;
    export const LOG_LEVEL_WARNING = 1;
    export const LOG_LEVEL_ERROR = 2;
    export const LOG_LEVEL_NONE = 999;

    /**
     * Global log level.
     * @default {@link LOG_LEVEL_WARNING}
     */
    export const logLevel = __DEV__ ? LOG_LEVEL_VERBOSE : LOG_LEVEL_WARNING;

    /**
     * Enabling sound for motions.
     */
    export const sound = true;

    /**
     * Deferring motion and corresponding sound until both are loaded.
     */
    export const motionSync = true;

    /**
     * Default fading duration for motions without such value specified.
     */
    export const motionFadingDuration = 500;

    /**
     * Default fading duration for idle motions without such value specified.
     */
    export const idleMotionFadingDuration = 2000;

    /**
     * Default fading duration for expressions without such value specified.
     */
    export const expressionFadingDuration = 500;

    /**
     * If false, expression will be reset to default when playing non-idle motions.
     */
    export const preserveExpressionOnMotion = true;

    export const cubism4 = CubismConfig;
}

/**
 * Consistent with the `version` in package.json.
 */
export const VERSION = __VERSION__;
