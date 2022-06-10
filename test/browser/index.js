import assert from 'assert';
import { TEST_MODEL } from '../env';
import { createApp, loadScript } from '../utils';

describe('Browser <script> tag', function() {
    it('should work with Pixi in browser', async function() {
        // provide globals for browser test, don't directly assign them to window
        // because that will confuse coding assistance in IDE
        const env = { assert, TEST_MODEL, createApp };

        for (const key in env) {
            window[key] = env[key];
        }

        await loadScript('../node_modules/pixi.js/dist/browser/pixi.min.js');

        // prevent Pixi from flagging WebGL as unsupported in headless test
        // https://github.com/pixijs/pixi.js/issues/6109
        PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;

        try {
            // a production build is required!!
            await loadScript('../dist/index.js');
        } catch (e) {
            console.warn('Failed to load "dist/index.js". Have you run `yarn build`?');
        }

        // load original, non-bundled source
        await loadScript('./browser/BrowserTest.js');

        // initialize, also test
        await BrowserTest.loadModel();
    });
});
