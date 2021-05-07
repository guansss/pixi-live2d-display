## Main Components

See [Graphs](../graphs/#main-components).

## Creating a Model

Models are created by a static method: `Live2DModel.from(source, options)`.

### Source

The source can be one of these three types:

1. A URL of the model settings file, which typically ends with `.model.json` (Cubism 2) or `.model3.json` (Cubism 3 and
   4).

```js
const model = await Live2DModel.from('path/to/shizuku.model.json');
```

2. A JSON object of the model settings. However, you'll still need to specify the URL by assigning it to the `url`
   property of the JSON object, this approach is the same for all Cubism versions.

```js
const url = 'path/to/shizuku.model.json'
const json = await loadJSON(url);

json.url = url;

const model = await Live2DModel.from(json);
```

3. An instance of `ModelSettings`. Specifically, either `Cubism2ModelSettings` or `Cubism4ModelSettings`.

```js
const url = 'path/to/shizuku.model.json'
const json = await loadJSON(url);

json.url = url;

const settings = new Cubism2ModelSettings(json);
const model = await Live2DModel.from(settings);
```

!!! note You've probably noticed that the URL is always required, that's because a URL is essential to resolve the
resource files of a model. For example, in a model with the URL `foo/bar.model.json`, the texture
image `textures/01.png` will be resolved to `foo/textures/01.png`.

### Options

The `options` is a combination of the options for multiple components, check
the [Live2DFactoryOptions](https://guansss.github.io/pixi-live2d-display/interfaces/index.live2dfactoryoptions.html).

### Synchronous Creation

In case you want to participate in the creation, there's a synchronous creation
method: `Live2DModel.fromSync(source, options)`.

This method immediately returns a `Live2DModel` instance, whose resources have **not** been loaded. That means you can't
manipulate or render this model - until the `load` event has been emitted.

```js
// no `await` here as it's not a Promise
const model = Live2DModel.fromSync('shizuku.model.json', { onError: console.warn });

// these will cause errors!
// app.stage.addChild(model);
// model.motion('tap_body');

model.once('load', () => {
    // now it's safe
    app.stage.addChild(model);
    model.motion('tap_body');
});
```

With this method, you're able to do extra works when certain resources have been loaded.

```js
const model = Live2DModel.fromSync('shizuku.model.json');

model.once('settingsJSONLoaded', json => {
    // e.g. customize the layout before they are applied to the model
    Object.assign(json, {
        layout: {
            width: 2,
            height: 2
        }
    });
});

model.once('settingsLoaded', settings => {
    // e.g. set another URL to the model
    settings.url = 'path/to/model';
});
```

When all the essential resources have been loaded, a `ready` event is emitted. If you want the model to show up as soon
as possible, you can render the model safely at this moment.

After that, when all the resources - including the optional resources - have been loaded, the `load` event is emitted.
The behaviors of `ready` and `load` events are pretty much like jQuery's `$(document).ready()` and the `window.onload()`
.

```js
const model = Live2DModel.fromSync('shizuku.model.json');

model.once('ready', () => {
    // it's also safe to do these now, though not recommended because
    // a model will typically look weird when rendered without optional resources 
    app.stage.addChild(model);
    model.motion('tap_body');
});
```

The creation procedure along with all the emitted events can be found in
the [Graphs](../graphs/#model-creation-procedure).

## Updating a Model

To make a Live2D model "live", it needs to be updated with the delta time, which is the time elapsed from last frame to
this frame, in milliseconds.

### Automatically

When a full build of PixiJS is imported and assigned to `window.PIXI`, each model will be automatically updated
using `window.PIXI.Ticker.shared`.

```js
import * as PIXI from 'pixi.js';

window.PIXI = PIXI;
```

Otherwise, you can manually register the `Ticker` to achieve automatic updating.

```js
import { Application } from '@pixi/app';
import { Ticker, TickerPlugin } from '@pixi/ticker';

Application.registerPlugin(TickerPlugin);
Live2DModel.registerTicker(Ticker);
```

### Manually

To manually update the model, you need to first disable the `autoUpdate` option, and then call `model.update()` every
tick.

```javascript
import { Ticker } from '@pixi/ticker';

const model = await Live2DModel.from('shizuku.model.json', { autoUpdate: false });

const ticker = new Ticker();

ticker.add(() => model.update(ticker.elapsedMS));
```

When you're using the `requestAnimationFrame()` instead:

```js
const model = await Live2DModel.from('shizuku.model.json', { autoUpdate: false });

let then = performance.now();

function tick(now) {
    model.update(now - then);

    then = now;

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
```
