You can apply global configs for all models.

```js
import { config } from 'pixi-live2d-display';

// log level
config.logLevel = config.LOG_LEVEL_WARNING; // LOG_LEVEL_VERBOSE, LOG_LEVEL_ERROR, LOG_LEVEL_NONE

// play sound for motions
config.sound = true;

// defer the playbacks of a motion and its sound until both are loaded
config.motionSync = true;

// the default fade-in and fade-out durations, applied when a motion/expression doesn't have these values specified
config.motionFadingDuration = 500;
config.idleMotionFadingDuration = 500;
config.expressionFadingDuration = 500;

// support for 4x4 mask division in Cubism 4, which is unofficial and experimental
config.cubism4.supportMoreMaskDivisions = true;
```
