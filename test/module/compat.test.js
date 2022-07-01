import { createTexture } from '@/factory/texture';
import { Graphics } from '@pixi/graphics';
import { Sprite } from '@pixi/sprite';
import { AlphaFilter } from '@pixi/filter-alpha';
import { BaseRenderTexture, RenderTexture } from '@pixi/core';
import { chunk } from 'lodash-es';
import { TEST_TEXTURE } from '../env';
import { delay } from '../utils';

describe('Compatibility', function() {
    // for some reason these tests may exceed the default timeout (2000ms) in CI
    this.timeout(5000);

    const ITEM_SIZE = 32;
    let itemOriginY = 0;

    afterEach(function() {
        itemOriginY += ITEM_SIZE;
    });

    it('should be compatible with PIXI.Sprite', async function() {
        const texture = await createTexture(TEST_TEXTURE);
        const sprite = Sprite.from(texture);

        sprite.width = ITEM_SIZE;
        sprite.height = ITEM_SIZE;
        sprite.y = itemOriginY;
        sprite.zIndex = 100;

        app.stage.addChild(sprite);
        app.render();

        const pixels = extractPixels(app, 0, itemOriginY, ITEM_SIZE, ITEM_SIZE);

        expect([
            pixels[0],
            pixels[ITEM_SIZE - 1],
            pixels[ITEM_SIZE * (ITEM_SIZE - 1) - 1],
            pixels[ITEM_SIZE * ITEM_SIZE - 1],
        ]).to.not.include(0xFFFF0000);

        const quarterOfSize = ITEM_SIZE / 4;

        expect([
            pixels[quarterOfSize * ITEM_SIZE + quarterOfSize - 1],
            pixels[quarterOfSize * ITEM_SIZE + quarterOfSize * 3 - 1],
            pixels[quarterOfSize * ITEM_SIZE * 3 + quarterOfSize - 1],
            pixels[quarterOfSize * ITEM_SIZE * 3 + quarterOfSize * 3 - 1],
        ]).to.eql(new Array(4).fill(0xFFFF0000));
    });

    it('should not break rendering of PIXI.Graphics', function() {
        // test for https://github.com/guansss/pixi-live2d-display/issues/5

        const graphics = new Graphics();
        graphics.beginFill(0xff0000);
        graphics.drawRect(0, itemOriginY, ITEM_SIZE, ITEM_SIZE);
        graphics.zIndex = 100;
        app.stage.addChild(graphics);
        app.render();

        const pixels = extractPixels(app, 0, itemOriginY, ITEM_SIZE, ITEM_SIZE);

        expect(pixels.every(pixel => pixel === 0xFFFF0000)).to.be.true;
    });

    describe('should work with PIXI.RenderTexture', function() {
        let offsetY = 0;

        runtimes.each((runtime, name) => {
            it(name, function() {
                const renderTexture = new RenderTexture(
                    new BaseRenderTexture(runtime.model2.width, runtime.model2.height, undefined, 0.5),
                );
                const sprite = new Sprite(renderTexture);

                app.stage.addChild(sprite);
                app.renderer.render(runtime.model2, { renderTexture });

                sprite.scale.set(0.1);
                sprite.y = app.view.height - sprite.height - offsetY;
                offsetY += sprite.height;

                app.render();

                // app.ticker.add(()=>{
                //     app.renderer.render(runtime.model2, renderTexture);
                // })
            });
        });
    });

    describe('should work with PIXI.Filter', function() {
        runtimes.each((runtime, name) => {
            it(name, function() {
                runtime.model2.filters = [new AlphaFilter(0.6)];
                app.render();
            });
        });
    });

    it('should work after losing and restoring WebGL context', async function() {
        await delay(100);

        console.log('===============WebGL lose context================');
        const ext = app.renderer.gl.getExtension('WEBGL_lose_context');
        ext.loseContext();

        await delay(100);

        console.log('==============WebGL restore context==============');
        ext.restoreContext();

        await delay(100);

        expect(() => app.render()).to.not.throw();
    });
});

function extractPixels(app, x, y, w, h, print) {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;
    // document.body.append(offscreenCanvas)

    const context = offscreenCanvas.getContext('2d');
    context.drawImage(app.view, x, y, w, h, 0, 0, w, h);

    const pixelData = context.getImageData(0, 0, w, h).data;

    const pixels = chunk(pixelData, 4).map(([r, g, b, a]) => (a << 24 | r << 16 | g << 8 | b) >>> 0);

    if (print) {
        console.log(chunk(pixels, w).map(line => line.map(v => ('0' + (v >>> 16 & 0xFF).toString(16)).slice(-2).toUpperCase()).join(' ')).join('\n'));
    }

    return pixels;
}
