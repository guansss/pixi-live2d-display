There are two basic interactions on Live2D models:

-   Focusing: character will look at the mouse pointer.
-   Tapping: handles `pointertap` event, then emits a `hit` event when any of the hit areas is tapped on.

    The `hit` event comes with an array of hit area names.

    ```js
    model.on('hit', (hitAreaNames) => {
        if (hitAreaNames.includes('body')) {
            // body is hit
        }
    });
    ```

!!! tip
    See Live2D's [Collision Detection](http://sites.cybernoids.jp/cubism_e/modeler/models/collision/placement) for more information about hit test.

### Interacting Automatically

This is the default behavior. Model will use Pixi's `InteractionManager` to automatically interact.

The easiest way is to import a full build of Pixi, so that `InteractionManager` is registered out of the box.

```js
import * as PIXI from 'pixi.js';
```

Otherwise, you need to manually register it as plugin:

```js
import { Renderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';

Renderer.registerPlugin('interaction', InteractionManager);
```

### Interacting Manually

If you don't want the default behavior, you can turn off the `autoInteract` option when creating a model, then manually call the interaction methods.

```js
const model = await Live2DModel.from('shizuku.model.json', { autoInteract: false });

canvasElement.addEventListener('pointermove', (event) => model.focus(event.clientX, event.clientY));

canvasElement.addEventListener('pointerdown', (event) => model.tap(event.clientX, event.clientY));
```
