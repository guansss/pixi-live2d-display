import { CubismFramework, LogLevel, Option } from '@cubism/live2dcubismframework';

export function startUpCubism4(options?: Option) {
    options = Object.assign({
        logFunction: console.log,
        loggingLevel: LogLevel.LogLevel_Verbose,
    }, options);

    CubismFramework.startUp(options);
    CubismFramework.initialize();
}
