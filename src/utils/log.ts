import { config } from "@/config";

/**
 * A simple tagged logger.
 *
 * You can replace the methods with your own ones.
 *
 * ```js
 * import { logger } from 'pixi-live2d-display';
 *
 * logger.log = (tag, ...messages) => {
 *     console.log(tag, 'says:', ...messages);
 * };
 * ```
 */
export const logger = {
    log(tag: string, ...messages: any[]) {
        if (config.logLevel <= config.LOG_LEVEL_VERBOSE) {
            console.log(`[${tag}]`, ...messages);
        }
    },

    warn(tag: string, ...messages: any[]) {
        if (config.logLevel <= config.LOG_LEVEL_WARNING) {
            console.warn(`[${tag}]`, ...messages);
        }
    },

    error(tag: string, ...messages: any[]) {
        if (config.logLevel <= config.LOG_LEVEL_ERROR) {
            console.error(`[${tag}]`, ...messages);
        }
    },
};
