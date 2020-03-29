// required globals: assert, TEST_MODEL, createApp

(function() {
    let model;

    const app = createApp(PIXI.Application);

    PIXI.Live2D.interaction.register(app.renderer.plugins.interaction);

    app.ticker.add(() => model && model.update(app.ticker.deltaMS));

    async function loadModel() {
        model = await PIXI.Live2D.Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
        app.stage.addChild(model);
    }

    window.BrowserTest = {
        loadModel,
    };
})();
