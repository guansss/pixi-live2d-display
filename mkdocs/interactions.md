There are two basic interactions on a Live2D model:

- Focusing: the Live2D character will look at the cursor.
- Tapping: handles the `pointertap` event, then emits a `hit` event when any of the defined hit areas is tapped on.

  The `hit` event comes with an array of the names of *hit* hit areas.
  ```js
  model.on('hit', hitAreaNames => {
      if (hitAreaNames.includes('body')) {
          // the body is hit
      }
  });
  ```
  See [Collision Detection](http://sites.cybernoids.jp/cubism_e/modeler/models/collision/placement) for more information
  about the hit-testing.

### Interacting Automatically

When a full build of PixiJS is imported, the above interactions will be automatically set up.

```js
import * as PIXI from 'pixi.js';
```

Otherwise, you need to manually register Pixi's interaction plugin.

```js
import { Renderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';

Renderer.registerPlugin('interaction', InteractionManager);
```

### Interacting Manually

If you don't want the default behaviour, you can disable the `autoInteract` option, then manually call the interaction
methods.

```js
const model = await Live2DModel.from('shizuku.model.json', { autoInteract: false });

canvasElement.addEventListener('pointermove', event => model.focus(event.clientX, event.clientY));

canvasElement.addEventListener('pointerdown', event => model.tap(event.clientX, event.clientY));
```
