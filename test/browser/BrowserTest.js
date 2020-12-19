// required globals: assert, TEST_MODEL, createApp

(function() {
    let model;

    const app = createApp(PIXI.Application);

    app.ticker.start();

    PIXI.live2d.config.logLevel = PIXI.live2d.config.LOG_LEVEL_VERBOSE;

    async function loadModel() {
        model = await PIXI.live2d.Live2DModel.from(TEST_MODEL.file);
        app.stage.addChild(model);

        model.on('hit', hitAreas => hitAreas.includes('body') && model.motion('tap_body'));
    }

    window.BrowserTest = {
        loadModel,
    };
})();
