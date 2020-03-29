import assert from 'assert';
import { TEST_MODEL } from '../env';
import { loadScript } from '../utils';

describe('Browser script tag', () => {
    before(async () => {
        // provide globals
        window.assert = assert;
        window.TEST_MODEL = TEST_MODEL;

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.3/pixi.min.js');

        // production build required!!
        await loadScript('../lib/browser.js');

        // load original, non-bundled source
        await loadScript('./browser/BrowserTest.js');

        // initialize, also test
        await BrowserTest.loadModel();
    });

    it('should work with Pixi', function() {
        BrowserTest.display();
    });
});
