// required globals: assert, TEST_MODEL, createApp

(function() {
    let model;

    const app = createApp(PIXI.Application);

    PIXI.live2d.config.logLevel = PIXI.live2d.config.LOG_LEVEL_NONE;

    async function loadModel() {
        model = await PIXI.live2d.Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
        app.stage.addChild(model);

        model.on('hit', hitAreas => hitAreas.includes('body') && model.internal.motionManager.startRandomMotion('tapBody'));
    }

    window.BrowserTest = {
        loadModel,
    };
})();
