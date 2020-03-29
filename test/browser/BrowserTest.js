// required globals: assert, TEST_MODEL

(function() {
    let model;

    const app = new PIXI.Application({
        width: 1000,
        height: 1000,
        autoStart: true,
    });
    document.body.appendChild(app.view);

    app.ticker.add(() => model && model.update(app.ticker.deltaMS));

    async function loadModel() {
        model = await PIXI.Live2D.Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
        app.stage.addChild(model);
    }

    window.BrowserTest = {
        loadModel,
    };
})();
