# pixi-live2d-display

![GitHub package.json version](https://img.shields.io/github/package-json/v/guansss/pixi-live2d-display?style=flat-square)
[![Codacy Badge](https://img.shields.io/codacy/grade/815a5e1399b74441a2203b7c7b4861c0?style=flat-square&logo=codacy)](https://www.codacy.com/manual/guansss/pixi-live2d-display?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=guansss/pixi-live2d-display&amp;utm_campaign=Badge_Grade)

Yet another powerful Live2D plugin for PixiJS.

## Install

```sh
npm install pixi-live2d-display
```

This library relies on `Promise`, you may need a polyfill, e.g. [es6-promise](https://github.com/stefanpenner/es6-promise).

## Usage

### Basic

```javascript
import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
import { Live2DModel } from 'pixi-live2d-display';

async function main() {
    const model = await Live2DModel.fromModelSettingsFile('my-model.model.json');

    const app = new PIXI.Application({ autoStart: true });
    app.stage.addChild(model);

    // transformation
    model.position.set(100, 100);
    model.scale.set(2, 2);
    model.anchor.set(0.5, 0.5);

    // motion
    model.on('hit', hitAreas => {
        if(hitAreas.includes('body')) {
            model.motion('tapBody');
        }
    });
}

main();
```

### Modules

It's possible to import only the necessary modules rather than a full build of PixiJS.

```javascript
import { Application } from '@pixi/app';
import { Live2DModel } from 'pixi-live2d-display';

async function main() {
    const model = await Live2DModel.fromModelSettingsFile('my-model.model.json');

    const app = new Application();
    app.stage.addChild(model);
}

main();
```

### Prebuilt File

When including prebuilt file by script tag, all exported members are available in `PIXI.live2d` namespace. For example `import { Live2DModel } from 'pixi-live2d-display'` becomes `PIXI.live2d.Live2DModel`.

```html
<script src="pixi.min.js"></script>
<script src="pixi-live2d-display.browser.js"></script>
```

```javascript
async function main() {
    const model = await PIXI.live2d.Live2DModel.fromModelSettingsFile('my-model.model.json');

    const app = new PIXI.Application({ autoStart: true });
    app.stage.addChild(model);
}

main();
```

### Updating

To make a Live2D model "live", it should be updated with delta time, which is the time elapsed from last frame to this frame, in milliseconds.

When a full build of PixiJS is imported, each model will be automatically updated using `window.PIXI.Ticker.shared`.

```javascript
import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
```

Otherwise you need to register the `Ticker` to `Live2DModel`.

```javascript
import { Application } from '@pixi/app';
import { Ticker, TickerPlugin } from '@pixi/ticker';

Application.registerPlugin(TickerPlugin);
Live2DModel.registerTicker(Ticker);
```

Or you may want to do it yourself:

```javascript
import { Ticker } from '@pixi/ticker';

const model = await Live2DModel.fromModelSettingsFile('my-model.model.json', { autoUpdate: false });

Ticker.shared.add(()=> model.update(Ticker.shared.elapsedMS));
```

Or without `Ticker`:

```javascript
const model = await Live2DModel.fromModelSettingsFile('my-model.model.json', { autoUpdate: false });
let then = performance.now();

function tick(now) {
    model.update(now - then);
    then = now;

    requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
```

### Interaction

Interaction will be automatically set up for each model if `Renderer` has an `InteractionManager` plugin, which happens when a full build of PixiJS is imported:

```javascript
import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
```

Or when the plugin is manually registered using modules:

```javascript
import { Renderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';

Renderer.registerPlugin('interaction', InteractionManager);
```

If you don't want the default behaviour, you can disable it by setting `autoInteract` to `false`, then play with corresponding interaction methods.

#### Focusing

```javascript
const model = await Live2DModel.fromModelSettingsFile('my-model.model.json', { autoInteract: false });

canvasElement.addEventListener('mousemove', event => model.focus(event.clientX, event.clientY));
```

#### Tapping

```javascript
const model = await Live2DModel.fromModelSettingsFile('my-model.model.json', { autoInteract: false });

canvasElement.addEventListener('mousedown', event => model.tap(event.clientX, event.clientY));
```

When any hit area (also called [Collision Detection](http://sites.cybernoids.jp/cubism_e/modeler/models/collision/placement)) is hit on tapping, a `hit` event will be emitted with an array of hit hit areas.

```javascript
model.on('hit', hitAreas => {
    if(hitAreas.includes('body')) {
        console.log('hit body')
    }
});
```

### Motion

Motions are managed by `MotionManager` of each model.

```javascript
import { Priority } from 'pixi-live2d-display'

// start a random motion in "tap_body" group
model.internal.motionManager.startRandomMotion('tapBody');

// start an explicit motion
model.internal.motionManager.startMotionByPriority('tapBody', 0, Priority.Normal);

// a shorthand of startRandomMotion()
model.motion('tapBody');
```

### Expression

Expressions are managed by `ExpressionManager` in `MotionManager`.

```javascript
model.internal.motionManager.expressionManager.setRandomExpression();
```

### Sound

Sounds are managed by `SoundManager` in `MotionManager`.

```javascript
model.internal.motionManager.soundManager.volume = 0.5;
```

When a motion with `sound` defined starts, the sound will be played, and a `sound` event will be emitted.

```javascript
model.on('sound', (file, audio) => {
    audio.addEventListener('ended', () => console.log('finished'));
});
``` 

---

The testing Live2D model, Shizuku, is distributed under Live2D's [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html).
