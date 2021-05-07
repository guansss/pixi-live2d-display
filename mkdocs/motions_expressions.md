Motions are managed by the `MotionManager` of each model.

### Idle Motions

When the model is not playing any motion, it's considered idle, and then its motion manager will randomly start an idle
motion as the idle priority.

Idle motions refer to the ones defined in a particular motion group: `"idle"` on Cubism 2, and `"Idle"` on Cubism 4. But
you can specify another group according to the model's definition.

```js
model.internalModel.motionManager.groups.idle = 'main_idle';
```

You can also specify it just when creating the model so this group can be correctly preloaded.

```js
const model = await Live2DModel.from('shizuku.model.json', { idleMotionGroup: 'main_idle' });
```

### Preloading

Motions can be preloaded to provide a seamless experience for users, but that may result in too many XHR requests that
block the network.

By default, only the idle motions will be preloaded. You can change this by setting the `motionPreload` option.

```js
import { MotionPreloadStrategy } from 'pixi-live2d-display';

// MotionPreloadStrategy.ALL
// MotionPreloadStrategy.IDLE
// MotionPreloadStrategy.NONE

const model = await Live2DModel.from('shizuku.model.json', { motionPreload: MotionPreloadStrategy.NONE });
```

### Starting Motions

```js
// start the first motion in the "tap_body" group
model.motion('tap_body', 0);

// when the index is omitted, it starts a random motion in given group
model.motion('tap_body');

// the above calls are shorthands of these methods
model.internalModel.motionManager.startMotion('tap_body', 0);
model.internalModel.motionManager.startRandomMotion('tap_body');
```

### Priorities

A motion will be started as one of these priorities: `IDLE`, `NORMAL` and `FORCE`.

`IDLE`
: Low priority. A Live2D model will typically have a set of idle motions, they will be automatically played when there's
no other motion playing.

`NORMAL`
: Medium priority. This is the default value if you don't provide one.

`FORCE`
: High priority. This makes sure the motion will always be played regardless of the current priority, except that it
meets a race condition where a subsequent motion with the same priority is loaded before this motion.

There's also a `NONE` priority which cannot be assigned to a motion, it's used to state that this model is currently not
playing any motion.

```js
import { MotionPriority } from 'pixi-live2d-display';

model.motion('tap_body', 0, MotionPriority.NORMAL);

// a random motion as normal priority
model.motion('tap_body', undefined, MotionPriority.NORMAL);
```

When a motion has been requested, and been approved to play, but meanwhile there's already a playing motion, it will not
immediately take the place of the current motion, instead it *reserves* the place and starts to load. The current motion
will keep playing until the reserved motion has finished loading.

That said, the actual rules are more complicated, see the [State-transition Table](#state-transition-table) section for
all the cases.

### Sounds

If a sound file is specified within a motion definition, it'll be played together with this motion.

During the playback, you can take control of all the created `<audio>` elements in `SoundManager`, like setting a global
volume.

```js
import { SoundManager } from 'pixi-live2d-display';

SoundManager.volume = 0.5;
```

To handle the audios separately, you can listen to the `motionStart` event.

```js
model.internalModel.motionManager.on('motionStart', (group, index, audio) => {
  if (audio) {
    // assume you've implemented a feature to show subtitles
    showSubtitle(group, index);

    audio.addEventListener('ended', () => dismissSubtitle());
  }
});
```

### Motion Sync

There are two parallel tasks while attempting to start a motion with sound:

- Load the motion, then play it
- Load the sound, then play it

Typically, the playbacks of motion and its sound are supposed to start at the same time, that's what motion sync does:
it defers the playbacks until the motion and sound have both been loaded.

- Load the motion and sound, then play both

This feature can be toggled via [global config](#global-config), by default it's enabled.

### State-transition Table

This table specifies which motion will *finally* be played when attempting to start a motion in a particular situation,
assuming the loading will never fail and will be finished in a relatively short time.

<table>
<tr><th rowspan="2">When:</th><td colspan="4">Start motion C as:</td></tr>
<tr>
<td><code>NONE</code></td>
<td><code>IDLE</code></td>
<td><code>NORMAL</code></td>
<td><code>FORCE</code></td>
</tr>
<tr>
<th>Playing none 
<br>Reserved none </th>
<td align="center">none</td><td align="center">C</td><td align="center">C</td><td align="center">C</td>
</tr>
<tr>
<th>Playing A  as <code>IDLE</code> 
<br>Reserved none </th>
<td align="center">A</td><td align="center">A</td><td align="center">C</td><td align="center">C</td>
</tr>
<tr>
<th>Playing A  as <code>NORMAL</code> 
<br>Reserved none </th>
<td align="center">A</td><td align="center">A</td><td align="center">A</td><td align="center">C</td>
</tr>
<tr>
<th>Playing A  as <code>FORCE</code> 
<br>Reserved none </th>
<td align="center">A</td><td align="center">A</td><td align="center">A</td><td align="center">C</td>
</tr>
<tr>
<th>Playing A  as <code>IDLE</code> 
<br>Reserved B  as <code>NORMAL</code> </th>
<td align="center">B</td><td align="center">B</td><td align="center">B</td><td align="center">C</td>
</tr>
<tr>
<th>Playing A  as <code>NORMAL</code> 
<br>Reserved B  as <code>FORCE</code> </th>
<td align="center">B</td><td align="center">B</td><td align="center">B</td><td align="center">C</td>
</tr>
<tr>
<th>Playing A  as <code>FORCE</code> 
<br>Reserved B  as <code>FORCE</code> </th>
<td align="center">B</td><td align="center">B</td><td align="center">B</td><td align="center">C</td>
</tr>
<tr>
<th>Playing none 
<br>Reserved B  as <code>IDLE</code> </th>
<td align="center">B</td><td align="center">B</td><td align="center">C</td><td align="center">C</td>
</tr>
<tr>
<th>Playing none 
<br>Reserved B  as <code>FORCE</code> </th>
<td align="center">B</td><td align="center">B</td><td align="center">B</td><td align="center">C</td>
</tr>
<tr>
<th>Playing none 
<br>Reserved B  as <code>FORCE</code> </th>
<td align="center">B</td><td align="center">B</td><td align="center">B</td><td align="center">C</td>
</tr>
</table>

## Expressions

Expressions are managed by `ExpressionManager` in `MotionManager`.

If the model has no expression defined in its settings, the `ExpressionManager` will not be created.

```javascript
// apply the first expression
model.expression(0);

// apply the expression named "smile"
model.expression('smile');

// when the argument is omitted, it applies a random expression
model.expression();

// the above calls are shorthands of these methods
model.internalModel.motionManager.expressionManager.setExpression(0);
model.internalModel.motionManager.expressionManager.setExpression('smile');
model.internalModel.motionManager.expressionManager.setRandomExpression();
```
