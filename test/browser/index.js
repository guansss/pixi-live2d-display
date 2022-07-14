import assert from 'assert';
import { TEST_MODEL } from '../env';
import { createApp, loadScript } from '../utils';

describe('Browser <script> tag', function () {
    before(async () => {
        // provide globals for browser test
        Object.assign(window, { assert, TEST_MODEL, createApp });

        await loadScript('../node_modules/pixi.js/dist/browser/pixi.min.js');

        try {
            // a production build is required!!
            await loadScript('../dist/index.js');
            await loadScript('../dist/extra.js');
        } catch (e) {
            console.warn('Failed to load production bundle. Have you run `yarn build`?');
        }

        // load original, non-bundled source
        await loadScript('./browser/BrowserTest.js');
    });

    it('should work with Pixi in browser', async function () {
        await BrowserTest.loadModel();
    });

    it('should provide extra tools', function () {
        BrowserTest.useExtra();
    });
});
