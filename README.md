# pixi-live2d-display

![GitHub package.json version](https://img.shields.io/github/package-json/v/guansss/pixi-live2d-display?style=flat-square)
![Cubism version](https://img.shields.io/badge/Cubism-all-ff69b4?style=flat-square)
[![Codacy Badge](https://img.shields.io/codacy/grade/815a5e1399b74441a2203b7c7b4861c0?style=flat-square&logo=codacy)](https://www.codacy.com/manual/guansss/pixi-live2d-display?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=guansss/pixi-live2d-display&amp;utm_campaign=Badge_Grade)

Live2D integration for [PixiJS](https://github.com/pixijs/pixi.js) v5.

**Resources**

- [Basic demo](https://codepen.io/guansss/pen/oNzoNoz/left?editors=1010)
- [Advanced demo](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010)


- [Wiki](https://github.com/guansss/pixi-live2d-display/wiki)
- [API Documentation](https://guansss.github.io/pixi-live2d-display/)

## Cubism

Cubism is the name of Live2D SDK. There are so far three versions of it: Cubism 2.1, Cubism 3 and Cubism 4, where the
Cubism 4 runtime is backward-compatible with Cubism 3 models.

This plugin supports Cubism 2.1 and Cubism 4 runtime, and thus all kinds of Live2D models.

#### Requirement

Before using the plugin, you'll need to include the Cubism runtime library, aka Cubism Core.

For Cubism 4, it's `live2dcubismcore.min.js` that can be extracted from
the [Cubism 4 SDK](https://www.live2d.com/download/cubism-sdk/download-web/).

For Cubism 2.1, it's `live2d.min.js`. This SDK is no longer downloadable from the official
site [since 9/4/2019](https://help.live2d.com/en/other/other_20/), but can be
found [here](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib), and with
a [CDN link](http://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js) that you'll probably need.

#### Individual bundles

The plugin provides individual bundles for each Cubism version to reduce your app's size when you just want to use one
of the versions.

Specifically, there are `cubism2.js` and `cubism4.js` for respective runtime, along with an `index.js` that includes
both of them.

Note that if you want both the Cubism 2 and Cubism 4 support, use `index.js`, but **NOT** the combination
of `cubism2.js` and `cubism4.js`.

To make it clear, here's how you would use these files:

- Use `cubism2.js`+`live2d.min.js` to support Cubism 2.1 models
- Use `cubism4.js`+`live2dcubismcore.min.js` to support Cubism 3 and Cubism 4 models
- Use `index.js`+`live2d.min.js`+`live2dcubismcore.min.js` to support all kinds of models

## Install

##### Via NPM

```sh
npm install pixi-live2d-display@beta
```

```js
import { Live2DModel } from 'pixi-live2d-display';

// For Cubism 2 only
import { Live2DModel } from 'pixi-live2d-display/lib/cubism2';

// For Cubism 4 only
import { Live2DModel } from 'pixi-live2d-display/lib/cubism4';
```

##### Via CDN

```html

<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.3.0-beta/dist/index.min.js"></script>

<!-- For Cubism 2 only -->
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.3.0-beta/dist/cubism2.min.js"></script>

<!-- For Cubism 4 only -->
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.3.0-beta/dist/cubism4.min.js"></script>
```

## Usage

### Basic

```javascript
import * as PIXI from 'pixi.js';

// with a global PIXI variable, this plugin can automatically take
// the needed functionality from it, such as window.PIXI.Ticker
window.PIXI = PIXI;

// accordingly, here we should use require() to import the module,
// instead of the import statement because it'll be hoisted
// over the above assignment 
const { Live2DModel } = require('pixi-live2d-display');

async function main() {
    const app = new PIXI.Application({
        view: document.getElementById('canvas'),
        autoStart: true
    });

    const model = await Live2DModel.from('shizuku.model.json');

    app.stage.addChild(model);

    // transformation
    mode.x = 100
    mode.y = 100
    model.scale.set(2, 2);
    model.anchor.set(0.5, 0.5);

    // interaction
    model.on('hit', hitAreas => {
        if (hitAreas.includes('body')) {
            model.motion('tap_body');
        }
    });
}
```

### Package importing

Pixi provides separate packages, which allows you to import only the necessary packages rather than the entire bundle.
In this case, you'll need to manually register the optional components if you want to make use of their features.

```javascript
import { Application } from '@pixi/app';
import { Renderer } from '@pixi/core';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { Live2DModel } from 'pixi-live2d-display';

// register the Ticker to support automatic updating of Live2D models
Application.registerPlugin(TickerPlugin);
Live2DModel.registerTicker(Ticker);

// register the InteractionManager to support automatic interaction of Live2D models
Renderer.registerPlugin('interaction', InteractionManager);

async function main() {
    const app = new Application();

    const model = await Live2DModel.from('shizuku.model.json');

    app.stage.addChild(model);
}
```

### Using Prebuilt Files

When including prebuilt files via the `<script>` tag, all the exported members are available under `PIXI.live2d`
namespace. For example the `import { Live2DModel } from 'pixi-live2d-display'` will become `PIXI.live2d.Live2DModel`.

```javascript
const app = new PIXI.Application();

const model = await PIXI.live2d.Live2DModel.from('shizuku.model.json');

app.stage.addChild(model);
```

---

The example Live2D models, Shizuku (Cubism 2) and Haru (Cubism 4), are redistributed under
Live2D's [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html).
