export namespace config {
    export const LOG_LEVEL_NONE = 0;
    export const LOG_LEVEL_VERBOSE = 1;
    export const LOG_LEVEL_WARNING = 2;
    export const LOG_LEVEL_ERROR = 3;

    export let logLevel = process.env.NODE_ENV === 'production' ? LOG_LEVEL_WARNING : LOG_LEVEL_VERBOSE;

    export let sound = true;
}
