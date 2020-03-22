import { Config } from '../Config';

export function log(tag: string, ...messages: any[]) {
    if (Config.logLevel >= Config.LogLevel.Verbose) {
        console.log(`[${tag}]`, ...messages);
    }
}

export function warn(tag: string, ...messages: any[]) {
    if (Config.logLevel >= Config.LogLevel.Warning) {
        console.warn(`[${tag}]`, ...messages);
    }
}

export function error(tag: string, ...messages: any[]) {
    if (Config.logLevel >= Config.LogLevel.Error) {
        console.error(`[${tag}]`, ...messages);
    }
}
