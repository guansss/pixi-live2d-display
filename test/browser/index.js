import assert from 'assert';
import { TEST_MODEL } from '../env';
import { createApp, loadScript } from '../utils';

describe('Browser script tag', () => {
    it('should work with Pixi in browser', async function() {
        // provide globals
        window.assert = assert;
        window.TEST_MODEL = TEST_MODEL;
        window.createApp = createApp;

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.3/pixi.min.js');

        // production build required!!
        await loadScript('../lib/browser.js');

        // load original, non-bundled source
        await loadScript('./browser/BrowserTest.js');

        // initialize, also test
        await BrowserTest.loadModel();
    });
});
