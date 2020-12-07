import { CubismFramework, LogLevel } from '@cubism/live2dcubismframework';

CubismFramework.startUp({
    logFunction: console.log,
    loggingLevel: LogLevel.LogLevel_Verbose,
});

CubismFramework.initialize();
