# pixi-live2d-display

![GitHub package.json version](https://img.shields.io/github/package-json/v/guansss/pixi-live2d-display?style=flat-square)
![Cubism version](https://img.shields.io/badge/Cubism-2/3/4-ff69b4?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/guansss/pixi-live2d-display/test.yml?style=flat-square)

English | [中文](README.zh.md)

Live2D integration for [PixiJS](https://github.com/pixijs/pixi.js) v6.

This project aims to be a universal Live2D framework on the web platform. While the official Live2D framework is just
complex and problematic, this project has rewritten it to unify and simplify the APIs, which allows you to control the
Live2D models on a high level without the need to learn how the internal system works.

#### Feel free to support the Maintainer:
<a href="https://www.buymeacoffee.com/RaSan147" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

#### Features

- Supports all versions of Live2D models
- Supports PIXI.RenderTexture and PIXI.Filter
- Pixi-style transform APIs: position, scale, rotation, skew, anchor
- Automatic interactions: focusing, hit-testing
- Enhanced motion reserving logic compared to the official framework
- Loading from uploaded files / zip files (experimental)
- Fully typed - we all love types!

#### Requirements

- PixiJS: 6.x
- Cubism core: 2.1 or 4
- Browser: WebGL, ES6

#### Demos

- [Basic demo](https://codepen.io/guansss/pen/oNzoNoz/left?editors=1010)
- [Interaction demo](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010)
- [Render texture & filter demo](https://codepen.io/guansss/pen/qBaMNQV/left?editors=1010)
- [Live2D Viewer Online](https://guansss.github.io/live2d-viewer-web/)

#### Documentations

- [Documentation](https://guansss.github.io/pixi-live2d-display)
- [API Documentation](https://guansss.github.io/pixi-live2d-display/api/index.html)
- [Development Notes](DEVELOPMENT.md)

## Cubism

Cubism is the name of Live2D SDK. There are so far three versions of it: Cubism 2.1, Cubism 3 and Cubism 4; where Cubism
4 is backward-compatible with Cubism 3 models.

This plugin supports all variants of Live2D models by using Cubism 2.1 and Cubism 4.

#### Cubism Core

Before using the plugin, you'll need to include the Cubism runtime library, aka Cubism Core.

For Cubism 4, you need `live2dcubismcore.min.js` that can be extracted from
the [Cubism 4 SDK](https://www.live2d.com/download/cubism-sdk/download-web/), or be referred by
a [direct link](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js) (_however the direct link is quite
unreliable, don't use it in production!_).

For Cubism 2.1, you need `live2d.min.js`. It's no longer downloadable from the official
site [since 2019/9/4](https://help.live2d.com/en/other/other_20/), but can be
found [here](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib), and with
a [CDN link](https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js) that you'll probably need.

#### Individual Bundles

The plugin provides individual bundles for each Cubism version to reduce your app's size when you just want to use one
of the versions.

Specifically, there are `cubism2.js` and `cubism4.js` for respective runtime, along with an `index.js` that includes
both of them.

Note that if you want both the Cubism 2.1 and Cubism 4 support, use `index.js`, but _not_ the combination
of `cubism2.js` and `cubism4.js`.

To make it clear, here's how you would use these files:

- Use `cubism2.js`+`live2d.min.js` to support Cubism 2.1 models
- Use `cubism4.js`+`live2dcubismcore.min.js` to support Cubism 3 and Cubism 4 models
- Use `index.js`+`live2d.min.js`+`live2dcubismcore.min.js` to support all versions of models

## Installation

#### Via npm

```sh
npm install pixi-live2d-display
```

```js
import { Live2DModel } from 'pixi-live2d-display';

// if only Cubism 2.1
import { Live2DModel } from 'pixi-live2d-display/cubism2';

// if only Cubism 4
import { Live2DModel } from 'pixi-live2d-display/cubism4';
```

#### Via CDN (lipsync patched)

```html

<!-- Load Cubism and PixiJS -->
<script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pixi.js@6.5.2/dist/browser/pixi.min.js"></script>


<!-- if support for both Cubism 2.1 and 4 -->
<script src="https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@v0.4.0-ls-2/dist/index.min.js"></script>

<!-- if only Cubism 2.1 -->
<script src="https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@v0.4.0-ls-2/dist/cubism2.min.js"></script>

<!-- if only Cubism 4 -->
<script src="https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@v0.4.0-ls-2/dist/cubism4.min.js"></script>
```

In this way, all the exported members are available under `PIXI.live2d` namespace, such as `PIXI.live2d.Live2DModel`.

## Basic usage

```javascript
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

// expose PIXI to window so that this plugin is able to
// reference window.PIXI.Ticker to automatically update Live2D models
window.PIXI = PIXI;

var model_proxy; //make a global scale handler to use later

(async function () {
    const app = new PIXI.Application({
        view: document.getElementById('canvas'),
    });

    const model = await Live2DModel.from('shizuku.model.json');
    model_proxy = model; 

    app.stage.addChild(model);

    // transforms
    model.x = 100;
    model.y = 100;
    model.rotation = Math.PI;
    model.skew.x = Math.PI;
    model.scale.set(2, 2);
    model.anchor.set(0.5, 0.5);

    // interaction
    model.on('hit', (hitAreas) => {
        if (hitAreas.includes('body')) {
            model.motion('tap_body');
        }
    });
})();
```

## Do some motion manually
* First either you need to load your model on Live2d viewer app, or the Website by guansss [here](https://guansss.github.io/live2d-viewer-web/)
* Check for motion category names (like "idle", "" (blank) etc)
  * Screenshot will be added soon
* Under those motion categories, each motions are used by their index
* Motion Priority table, 
  * 0: no priority
  * 1: maybe [for idle animation]
  * 2: normal [default when normal action]
  * 3: Just do it! Do id now! [Forced] [default when using audio]
* Time to code
```js
var category_name = "Idle" // name of the morion category
var animation_index = 0 // index of animation under that motion category
var priority_number = 3 // if you want to keep the current animation going or move to new animation by force [0: no priority, 1: idle, 2: normal, 3: forced]
var audio_link = "https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@v1.0.3/playground/test.mp3" //[Optional arg, can be null or empty] [relative or full url path] [mp3 or wav file]
var volume = 1; //[Optional arg, can be null or empty] [0.0 - 1.0]
var expression = 4; //[Optional arg, can be null or empty] [index|name of expression]
var resetExpression = true; //[Optional arg, can be null or empty] [true|false] [default: true] [if true, expression will be reset to default after animation is over]

model_proxy.motion(category_name, animation_index, priority_number, {voice: audio_link, volume: volume, expression:expression, resetExpression:resetExpression})
// Note: during this animation with sound, other animation will be ignored, even its forced. Once over, it'll be back to normal

// if you dont want voice, just ignore the option
model_proxy.motion(category_name, animation_index, priority_number)
model_proxy.motion(category_name, animation_index, priority_number, {expression:expression, resetExpression:resetExpression})
model_proxy.motion(category_name, animation_index, priority_number, {expression:expression, resetExpression:false})

```

## Lipsync Only
* You can do sound lipsync even without triggering any motion
* This supports expressions arg too (if you have/need any)
* Demo code
```js
var audio_link = "https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@v1.0.3/playground/test.mp3" // [relative or full url path] [mp3 or wav file]
var volume = 1; // [Optional arg, can be null or empty] [0.0 - 1.0]
var expression = 4; // [Optional arg, can be null or empty] [index|name of expression]
var resetExpression = true; // [Optional arg, can be null or empty] [true|false] [default: true] [if true, expression will be reset to default after animation is over]

model_proxy.speak(audio_link, {volume: volume, expression:expression, resetExpression:resetExpression})

// Or if you want to keep some things default
model_proxy.speak(audio_link)
model_proxy.speak(audio_link, {volume: volume})
model_proxy.speak(audio_link, {expression:expression, resetExpression:resetExpression})

```

## Suddenly stop audio and lipsync
* Demo code
```js
model_proxy.stopSpeaking()
```

## Reset motions as well as audio and lipsync
* Demo code
```js
model_proxy.stopMotions()
```

## Totally destroy the model
* This will also stop the motion and audio from running and hide the model
* Demo code
```js
model_proxy.destroy()
```

## Result
https://user-images.githubusercontent.com/34002411/230723497-612146b1-5593-4dfa-911d-accb331c5b9b.mp4

# See here for more Documentation: [Documentation](https://guansss.github.io/pixi-live2d-display/)



## Package importing

When importing Pixi packages on-demand, you may need to manually register some plugins to enable optional features.

```javascript
import { Application } from '@pixi/app';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { Live2DModel } from 'pixi-live2d-display';

// register Ticker for Live2DModel
Live2DModel.registerTicker(Ticker);

// register Ticker for Application
Application.registerPlugin(TickerPlugin);

// register InteractionManager to make Live2D models interactive
Renderer.registerPlugin('interaction', InteractionManager);

(async function () {
  const app = new Application({
    view: document.getElementById('canvas'),
  });

  const model = await Live2DModel.from('shizuku.model.json');

  app.stage.addChild(model);
})();
```

---

The example Live2D models, Shizuku (Cubism 2.1) and Haru (Cubism 4), are redistributed under
Live2D's [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html).
