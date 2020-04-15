/**
 * Global configs.
 */
export namespace config {
    export const LOG_LEVEL_NONE = 0;
    export const LOG_LEVEL_VERBOSE = 1;
    export const LOG_LEVEL_WARNING = 2;
    export const LOG_LEVEL_ERROR = 3;

    /**
     * Log level.
     * @default {@link LOG_LEVEL_WARNING}
     */
    export let logLevel = process.env.NODE_ENV === 'production' ? LOG_LEVEL_WARNING : LOG_LEVEL_VERBOSE;

    /**
     * Enabling sound for motions.
     */
    export let sound = true;

    /**
     * Deferring motion and corresponding sound until both are loaded.
     */
    export let motionSync = true;
}
