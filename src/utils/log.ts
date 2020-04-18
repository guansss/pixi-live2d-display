import { config } from '../config';

/**
 * A logger that supports tagging.
 *
 * You can replace the methods with your own ones.
 *
 * ```js
 * import { logger } from 'pixi-live2d-display';
 *
 * function myLog(tag, ...messages) {
 *     console.log(tag, 'says:', ...messages);
 * }
 *
 * logger.log = myLog;
 * ```
 */
export namespace logger {
    export function log(tag: string, ...messages: any[]) {
        if (config.logLevel <= config.LOG_LEVEL_VERBOSE) {
            console.log(`[${tag}]`, ...messages);
        }
    }

    export function warn(tag: string, ...messages: any[]) {
        if (config.logLevel <= config.LOG_LEVEL_WARNING) {
            console.warn(`[${tag}]`, ...messages);
        }
    }

    export function error(tag: string, ...messages: any[]) {
        if (config.logLevel <= config.LOG_LEVEL_ERROR) {
            console.error(`[${tag}]`, ...messages);
        }
    }
}
