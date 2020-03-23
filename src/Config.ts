export namespace Config {
    export enum LogLevel {
        None, Verbose, Warning, Error
    }

    export let logLevel = process.env.NODE_ENV === 'production' ? LogLevel.Warning : LogLevel.Verbose;
}
