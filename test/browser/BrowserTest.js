// required globals: assert, TEST_MODEL, createApp

(function () {
    let model;

    const app = createApp(PIXI.Application);

    app.ticker.start();

    PIXI.live2d.config.logLevel = PIXI.live2d.config.LOG_LEVEL_VERBOSE;

    async function loadModel() {
        model = await PIXI.live2d.Live2DModel.from(TEST_MODEL.file);

        model.y = -100;

        model.on('hit', (hitAreas) => hitAreas.includes('body') && model.motion('tap_body'));

        app.stage.addChild(model);
    }

    function useExtra() {
        const hitAreaFrames = new PIXI.live2d.HitAreaFrames();

        model.addChild(hitAreaFrames);
    }

    window.BrowserTest = {
        loadModel,
        useExtra,
    };
})();
