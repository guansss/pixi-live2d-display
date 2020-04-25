import assert from 'assert';
import { TEST_MODEL } from '../env';
import { createApp, loadScript } from '../utils';

describe('Browser script tag', () => {
    it('should work with Pixi in browser', async function() {
        // provide globals for browser test, don't directly assign them to window
        // because that will confuse coding assistance in IDE
        const env = { assert, TEST_MODEL, createApp };

        for (const key in env) {
            window[key] = env[key];
        }

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.3/pixi.min.js');

        // a production build is required!!
        await loadScript('../lib/browser.js');

        // load original, non-bundled source
        await loadScript('./browser/BrowserTest.js');

        // initialize, also test
        await BrowserTest.loadModel();
    });
});
