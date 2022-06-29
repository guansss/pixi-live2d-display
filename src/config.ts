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
    export let logLevel = __DEV__ ? LOG_LEVEL_VERBOSE : LOG_LEVEL_WARNING;

    /**
     * Enabling sound for motions.
     */
    export let sound = true;

    /**
     * Deferring motion and corresponding sound until both are loaded.
     */
    export let motionSync = true;

    /**
     * Default fading duration for motions without such value specified.
     */
    export let motionFadingDuration = 500;

    /**
     * Default fading duration for idle motions without such value specified.
     */
    export let idleMotionFadingDuration = 2000;

    /**
     * Default fading duration for expressions without such value specified.
     */
    export let expressionFadingDuration = 500;

    export let cubism4: {
        /**
         * Should masks support 4x4 division, which is unofficial and experimental.
         * See [official manual](https://docs.live2d.com/cubism-sdk-manual/ow-sdk-mask-premake-web/?locale=en_us).
         * @default true
         */
        supportMoreMaskDivisions: boolean;
    } | undefined;
}

/**
 * Consistent with the `version` in package.json.
 */
export const VERSION = __VERSION__;
