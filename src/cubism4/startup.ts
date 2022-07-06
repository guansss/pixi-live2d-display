import { CubismFramework, CubismStartupOption, LogLevel } from '@cubism/live2dcubismframework';

/**
 * Starts up the Cubism 4 runtime.
 */
export function startUpCubism4(options?: CubismStartupOption) {
    options = Object.assign(
        {
            logFunction: console.log,
            loggingLevel: LogLevel.LogLevel_Verbose,
        },
        options
    );

    CubismFramework.startUp(options);
    CubismFramework.initialize();
}
