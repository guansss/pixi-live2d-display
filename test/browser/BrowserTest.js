// required globals: assert, TEST_MODEL

(function() {
    const app = new PIXI.Application({
        width: 1000,
        height: 1000,
    });
    document.body.appendChild(app.view);

    let model;

    async function loadModel() {
        model = await PIXI.Live2D.Live2DModel.fromModelSettingsFile(TEST_MODEL.file);
    }

    async function display() {
        app.stage.addChild(model);
        app.render();
        app.render();
        model.update(performance.now() + 1000);
        app.render();
    }

    window.BrowserTest = {
        loadModel,
        display,
    };
})();
