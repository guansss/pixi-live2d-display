/**
 * Global configs.
 */
export namespace config {
    export const LOG_LEVEL_VERBOSE = 0;
    export const LOG_LEVEL_WARNING = 1;
    export const LOG_LEVEL_ERROR = 2;
    export const LOG_LEVEL_NONE = 999;

    declare const __PRODUCTION__: boolean;

    /**
     * Log level.
     * @default {@link LOG_LEVEL_WARNING}
     */
    export let logLevel = __PRODUCTION__ ? LOG_LEVEL_WARNING : LOG_LEVEL_VERBOSE;

    /**
     * Enabling sound for motions.
     */
    export let sound = true;

    /**
     * Deferring motion and corresponding sound until both are loaded.
     */
    export let motionSync = true;
}

declare const __VERSION__: string;

export const VERSION = __VERSION__;
