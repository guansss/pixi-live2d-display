export namespace Config {
    export enum LogLevel {
        None,Verbose, Warning, Error
    }

    export let logLevel = LogLevel.Warning;
}
