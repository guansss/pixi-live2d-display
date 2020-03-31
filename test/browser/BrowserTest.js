// required globals: assert, TEST_MODEL, createApp

(function() {
    let model;

    const app = createApp(PIXI.Application);

    PIXI.Live2D.config.logLevel = PIXI.Live2D.config.LOG_LEVEL_NONE;

    async function loadModel() {
        model = await PIXI.Live2D.Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
        app.stage.addChild(model);

        model.on('hit', hitAreas => hitAreas.includes('body') && model.internal.motionManager.startRandomMotion('tapBody'));
    }

    window.BrowserTest = {
        loadModel,
    };
})();
