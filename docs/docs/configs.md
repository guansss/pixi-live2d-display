Configs are applied to all models.

```js
import { config } from 'pixi-live2d-display';

// log level
config.logLevel = config.LOG_LEVEL_WARNING; // LOG_LEVEL_VERBOSE, LOG_LEVEL_ERROR, LOG_LEVEL_NONE

// play sound for motions
config.sound = true;

// defer the playback of a motion and its sound until both are loaded
config.motionSync = true;

// default fade-in/fade-out durations in milliseconds, will be applied to
// motions/expressions that don't have these values specified
config.motionFadingDuration = 500;
config.idleMotionFadingDuration = 500;
config.expressionFadingDuration = 500;

// unofficial and experimental support for 4x4 mask division in Cubism 4
config.cubism4.supportMoreMaskDivisions = true;
```
