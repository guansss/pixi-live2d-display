import { CubismFramework, LogLevel } from '@cubism/live2dcubismframework';

const onload = window.onload;

window.onload = (e: Event) => {
    onload?.call(window, e);

    CubismFramework.startUp({
        logFunction: console.log,
        loggingLevel: LogLevel.LogLevel_Verbose,
    });

    CubismFramework.initialize();
};
