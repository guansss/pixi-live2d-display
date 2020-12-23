import { logger } from '@/utils';
import { CubismFramework, CubismStartupOption, LogLevel } from '@cubism/live2dcubismframework';

let startupPromise: Promise<void>;
let startupRetries = 20;

export function cubism4Ready(): Promise<void> {
    if (CubismFramework.isStarted()) {
        return Promise.resolve();
    }

    startupPromise ??= new Promise<void>(((resolve, reject) => {
        function startUpWithRetry() {
            try {
                startUpCubism4();
                resolve();
            } catch (e) {
                startupRetries--;

                if (startupRetries < 0) {
                    const err = new Error('Failed to start up Cubism 4 framework.');

                    (err as any).cause = e;

                    reject(err);
                    return;
                }

                logger.log('Cubism4', 'Startup failed, retrying 10ms later...');

                setTimeout(startUpWithRetry, 10);
            }
        }

        startUpWithRetry();
    }));

    return startupPromise;
}

export function startUpCubism4(options?: CubismStartupOption) {
    options = Object.assign({
        logFunction: console.log,
        loggingLevel: LogLevel.LogLevel_Verbose,
    }, options);

    CubismFramework.startUp(options);
    CubismFramework.initialize();
}
