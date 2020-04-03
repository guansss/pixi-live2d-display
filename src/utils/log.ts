import { config } from '../config';

export namespace logger {
    export function log(tag: string, ...messages: any[]) {
        if (config.logLevel >= config.LOG_LEVEL_VERBOSE) {
            console.log(`[${tag}]`, ...messages);
        }
    }

    export function warn(tag: string, ...messages: any[]) {
        if (config.logLevel >= config.LOG_LEVEL_WARNING) {
            console.warn(`[${tag}]`, ...messages);
        }
    }

    export function error(tag: string, ...messages: any[]) {
        if (config.logLevel >= config.LOG_LEVEL_ERROR) {
            console.error(`[${tag}]`, ...messages);
        }
    }
}
