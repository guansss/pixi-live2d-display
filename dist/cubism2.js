(function(global2, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("@pixi/core"), require("@pixi/display")) : typeof define === "function" && define.amd ? define(["exports", "@pixi/core", "@pixi/display"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory((global2.PIXI = global2.PIXI || {}, global2.PIXI.live2d = global2.PIXI.live2d || {}), global2.PIXI, global2.PIXI));
})(this, function(exports2, core, display) {
  "use strict";var __defProp = Object.defineProperty;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

  const LOGICAL_WIDTH = 2;
  const LOGICAL_HEIGHT = 2;
  var CubismConfig;
  ((CubismConfig2) => {
    CubismConfig2.supportMoreMaskDivisions = true;
    CubismConfig2.setOpacityFromMotion = false;
  })(CubismConfig || (CubismConfig = {}));
  const LOG_LEVEL_VERBOSE = 0;
  const LOG_LEVEL_WARNING = 1;
  const LOG_LEVEL_ERROR = 2;
  const LOG_LEVEL_NONE = 999;
  const config = {
    LOG_LEVEL_VERBOSE,
    LOG_LEVEL_WARNING,
    LOG_LEVEL_ERROR,
    LOG_LEVEL_NONE,
    /**
     * Global log level.
     * @default config.LOG_LEVEL_WARNING
     */
    logLevel: LOG_LEVEL_WARNING,
    /**
     * Enabling sound for motions.
     */
    sound: true,
    /**
     * Deferring motion and corresponding sound until both are loaded.
     */
    motionSync: true,
    /**
     * Default fading duration for motions without such value specified.
     */
    motionFadingDuration: 500,
    /**
     * Default fading duration for idle motions without such value specified.
     */
    idleMotionFadingDuration: 2e3,
    /**
     * Default fading duration for expressions without such value specified.
     */
    expressionFadingDuration: 500,
    /**
     * If false, expression will be reset to default when playing non-idle motions.
     */
    preserveExpressionOnMotion: true,
    cubism4: CubismConfig
  };
  const VERSION = "v0.5.0-ls-8";
  const logger = {
    log(tag, ...messages) {
      if (config.logLevel <= config.LOG_LEVEL_VERBOSE) {
        console.log(`[${tag}]`, ...messages);
      }
    },
    warn(tag, ...messages) {
      if (config.logLevel <= config.LOG_LEVEL_WARNING) {
        console.warn(`[${tag}]`, ...messages);
      }
    },
    error(tag, ...messages) {
      if (config.logLevel <= config.LOG_LEVEL_ERROR) {
        console.error(`[${tag}]`, ...messages);
      }
    }
  };
  function clamp(num, lower, upper) {
    return num < lower ? lower : num > upper ? upper : num;
  }
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function copyProperty(type, from, to, fromKey, toKey) {
    const value = from[fromKey];
    if (value !== null && typeof value === type) {
      to[toKey] = value;
    }
  }
  function copyArray(type, from, to, fromKey, toKey) {
    const array = from[fromKey];
    if (Array.isArray(array)) {
      to[toKey] = array.filter((item) => item !== null && typeof item === type);
    }
  }
  function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach((baseCtor) => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
        if (name !== "constructor") {
          Object.defineProperty(
            derivedCtor.prototype,
            name,
            Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
          );
        }
      });
    });
  }
  function folderName(url) {
    let lastSlashIndex = url.lastIndexOf("/");
    if (lastSlashIndex != -1) {
      url = url.slice(0, lastSlashIndex);
    }
    lastSlashIndex = url.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      url = url.slice(lastSlashIndex + 1);
    }
    return url;
  }
  function remove(array, item) {
    const index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }
  class ExpressionManager extends core.utils.EventEmitter {
    constructor(settings, options) {
      super();
      /**
       * Tag for logging.
       */
      __publicField(this, "tag");
      /**
       * The ModelSettings reference.
       */
      __publicField(this, "settings");
      /**
       * The Expressions. The structure is the same as {@link definitions}, initially there's only
       * an empty array, which means all expressions will be `undefined`. When an Expression has
       * been loaded, it'll fill the place in which it should be; when it fails to load,
       * the place will be filled with `null`.
       */
      __publicField(this, "expressions", []);
      /**
       * An empty Expression to reset all the expression parameters.
       */
      __publicField(this, "defaultExpression");
      /**
       * Current Expression. This will not be overwritten by {@link ExpressionManager#defaultExpression}.
       */
      __publicField(this, "currentExpression");
      /**
       * The pending Expression.
       */
      __publicField(this, "reserveExpressionIndex", -1);
      /**
       * Flags the instance has been destroyed.
       */
      __publicField(this, "destroyed", false);
      this.settings = settings;
      this.tag = `ExpressionManager(${settings.name})`;
    }
    /**
     * Should be called in the constructor of derived class.
     */
    init() {
      this.defaultExpression = this.createExpression({}, void 0);
      this.currentExpression = this.defaultExpression;
      this.stopAllExpressions();
    }
    /**
     * Loads an Expression. Errors in this method will not be thrown,
     * but be emitted with an "expressionLoadError" event.
     * @param index - Index of the expression in definitions.
     * @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
     * @emits {@link ExpressionManagerEvents.expressionLoaded}
     * @emits {@link ExpressionManagerEvents.expressionLoadError}
     */
    loadExpression(index) {
      return __async(this, null, function* () {
        if (!this.definitions[index]) {
          logger.warn(this.tag, `Undefined expression at [${index}]`);
          return void 0;
        }
        if (this.expressions[index] === null) {
          logger.warn(
            this.tag,
            `Cannot set expression at [${index}] because it's already failed in loading.`
          );
          return void 0;
        }
        if (this.expressions[index]) {
          return this.expressions[index];
        }
        const expression = yield this._loadExpression(index);
        this.expressions[index] = expression;
        return expression;
      });
    }
    /**
     * Loads the Expression. Will be implemented by Live2DFactory in order to avoid circular dependency.
     * @ignore
     */
    _loadExpression(index) {
      throw new Error("Not implemented.");
    }
    /**
     * Sets a random Expression that differs from current one.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    setRandomExpression() {
      return __async(this, null, function* () {
        if (this.definitions.length) {
          const availableIndices = [];
          for (let i = 0; i < this.definitions.length; i++) {
            if (this.expressions[i] !== null && this.expressions[i] !== this.currentExpression && i !== this.reserveExpressionIndex) {
              availableIndices.push(i);
            }
          }
          if (availableIndices.length) {
            const index = Math.floor(Math.random() * availableIndices.length);
            return this.setExpression(index);
          }
        }
        return false;
      });
    }
    /**
     * Resets model's expression using {@link ExpressionManager#defaultExpression}.
     */
    resetExpression() {
      this._setExpression(this.defaultExpression);
    }
    /**
     * Restores model's expression to {@link currentExpression}.
     */
    restoreExpression() {
      this._setExpression(this.currentExpression);
    }
    /**
     * Sets an Expression.
     * @param index - Either the index, or the name of the expression.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    setExpression(index) {
      return __async(this, null, function* () {
        if (typeof index !== "number") {
          index = this.getExpressionIndex(index);
        }
        if (!(index > -1 && index < this.definitions.length)) {
          return false;
        }
        if (index === this.expressions.indexOf(this.currentExpression)) {
          return false;
        }
        this.reserveExpressionIndex = index;
        const expression = yield this.loadExpression(index);
        if (!expression || this.reserveExpressionIndex !== index) {
          return false;
        }
        this.reserveExpressionIndex = -1;
        this.currentExpression = expression;
        this._setExpression(expression);
        return true;
      });
    }
    /**
     * Updates parameters of the core model.
     * @return True if the parameters are actually updated.
     */
    update(model, now) {
      if (!this.isFinished()) {
        return this.updateParameters(model, now);
      }
      return false;
    }
    /**
     * Destroys the instance.
     * @emits {@link ExpressionManagerEvents.destroy}
     */
    destroy() {
      this.destroyed = true;
      this.emit("destroy");
      const self2 = this;
      self2.definitions = void 0;
      self2.expressions = void 0;
    }
  }
  const EPSILON = 0.01;
  const MAX_SPEED = 40 / 7.5;
  const ACCELERATION_TIME = 1 / (0.15 * 1e3);
  class FocusController {
    constructor() {
      /** The focus position. */
      __publicField(this, "targetX", 0);
      /** The focus position. */
      __publicField(this, "targetY", 0);
      /** Current position. */
      __publicField(this, "x", 0);
      /** Current position. */
      __publicField(this, "y", 0);
      /** Current velocity. */
      __publicField(this, "vx", 0);
      /** Current velocity. */
      __publicField(this, "vy", 0);
    }
    /**
     * Sets the focus position.
     * @param x - X position in range `[-1, 1]`.
     * @param y - Y position in range `[-1, 1]`.
     * @param instant - Should the focus position be instantly applied.
     */
    focus(x, y, instant = false) {
      this.targetX = clamp(x, -1, 1);
      this.targetY = clamp(y, -1, 1);
      if (instant) {
        this.x = this.targetX;
        this.y = this.targetY;
      }
    }
    /**
     * Updates the interpolation.
     * @param dt - Delta time in milliseconds.
     */
    update(dt) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON)
        return;
      const d = Math.sqrt(__pow(dx, 2) + __pow(dy, 2));
      const maxSpeed = MAX_SPEED / (1e3 / dt);
      let ax = maxSpeed * (dx / d) - this.vx;
      let ay = maxSpeed * (dy / d) - this.vy;
      const a = Math.sqrt(__pow(ax, 2) + __pow(ay, 2));
      const maxA = maxSpeed * ACCELERATION_TIME * dt;
      if (a > maxA) {
        ax *= maxA / a;
        ay *= maxA / a;
      }
      this.vx += ax;
      this.vy += ay;
      const v = Math.sqrt(__pow(this.vx, 2) + __pow(this.vy, 2));
      const maxV = 0.5 * (Math.sqrt(__pow(maxA, 2) + 8 * maxA * d) - maxA);
      if (v > maxV) {
        this.vx *= maxV / v;
        this.vy *= maxV / v;
      }
      this.x += this.vx;
      this.y += this.vy;
    }
  }
  class ModelSettings {
    /**
     * @param json - The settings JSON object.
     * @param json.url - The `url` field must be defined to specify the settings file's URL.
     */
    constructor(json) {
      __publicField(this, "json");
      /**
       * The model's name, typically used for displaying or logging. By default it's inferred from
       * the URL by taking the folder name (the second to last component). In Cubism 2 it'll be overwritten
       * by the `name` field of settings JSON.
       */
      __publicField(this, "name");
      /**
       * URL of the model settings file, used to resolve paths of the resource files defined in settings.
       * This typically ends with `.model.json` in Cubism 2 and `.model3.json` in Cubism 4.
       */
      __publicField(this, "url");
      /**
       * Relative path of the pose file.
       */
      __publicField(this, "pose");
      /**
       * Relative path of the physics file.
       */
      __publicField(this, "physics");
      this.json = json;
      const url = json.url;
      if (typeof url !== "string") {
        throw new TypeError("The `url` field in settings JSON must be defined as a string.");
      }
      this.url = url;
      this.name = folderName(this.url);
    }
    /**
     * Resolves a relative path using the {@link url}. This is used to resolve the resource files
     * defined in the settings.
     * @param path - Relative path.
     * @return Resolved path.
     */
    resolveURL(path) {
      return core.utils.url.resolve(this.url, path);
    }
    /**
     * Replaces the resource files by running each file through the `replacer`.
     * @param replacer - Invoked with two arguments: `(file, path)`, where `file` is the file definition,
     * and `path` is its property path in the ModelSettings instance. A string must be returned to be the replacement.
     *
     * ```js
     * modelSettings.replaceFiles((file, path) => {
     *     // file = "foo.moc", path = "moc"
     *     // file = "foo.png", path = "textures[0]"
     *     // file = "foo.mtn", path = "motions.idle[0].file"
     *     // file = "foo.motion3.json", path = "motions.idle[0].File"
     *
     *     return "bar/" + file;
     * });
     * ```
     */
    replaceFiles(replacer) {
      this.moc = replacer(this.moc, "moc");
      if (this.pose !== void 0) {
        this.pose = replacer(this.pose, "pose");
      }
      if (this.physics !== void 0) {
        this.physics = replacer(this.physics, "physics");
      }
      for (let i = 0; i < this.textures.length; i++) {
        this.textures[i] = replacer(this.textures[i], `textures[${i}]`);
      }
    }
    /**
     * Retrieves all resource files defined in the settings.
     * @return A flat array of the paths of all resource files.
     *
     * ```js
     * modelSettings.getDefinedFiles();
     * // returns: ["foo.moc", "foo.png", ...]
     * ```
     */
    getDefinedFiles() {
      const files = [];
      this.replaceFiles((file) => {
        files.push(file);
        return file;
      });
      return files;
    }
    /**
     * Validates that the files defined in the settings exist in given files. Each file will be
     * resolved by {@link resolveURL} before comparison.
     * @param files - A flat array of file paths.
     * @return All the files which are defined in the settings and also exist in given files,
     * *including the optional files*.
     * @throws Error if any *essential* file is defined in settings but not included in given files.
     */
    validateFiles(files) {
      const assertFileExists = (expectedFile, shouldThrow) => {
        const actualPath = this.resolveURL(expectedFile);
        if (!files.includes(actualPath)) {
          if (shouldThrow) {
            throw new Error(
              `File "${expectedFile}" is defined in settings, but doesn't exist in given files`
            );
          }
          return false;
        }
        return true;
      };
      const essentialFiles = [this.moc, ...this.textures];
      essentialFiles.forEach((texture) => assertFileExists(texture, true));
      const definedFiles = this.getDefinedFiles();
      return definedFiles.filter((file) => assertFileExists(file, false));
    }
  }
  var MotionPriority = /* @__PURE__ */ ((MotionPriority2) => {
    MotionPriority2[MotionPriority2["NONE"] = 0] = "NONE";
    MotionPriority2[MotionPriority2["IDLE"] = 1] = "IDLE";
    MotionPriority2[MotionPriority2["NORMAL"] = 2] = "NORMAL";
    MotionPriority2[MotionPriority2["FORCE"] = 3] = "FORCE";
    return MotionPriority2;
  })(MotionPriority || {});
  class MotionState {
    constructor() {
      /**
       * Tag for logging.
       */
      __publicField(this, "tag");
      /**
       * When enabled, the states will be dumped to the logger when an exception occurs.
       */
      __publicField(this, "debug", false);
      /**
       * Priority of the current motion. Will be `MotionPriority.NONE` if there's no playing motion.
       */
      __publicField(this, "currentPriority", 0);
      /**
       * Priority of the reserved motion, which is still in loading and will be played once loaded.
       * Will be `MotionPriority.NONE` if there's no reserved motion.
       */
      __publicField(this, "reservePriority", 0);
      /**
       * Group of current motion.
       */
      __publicField(this, "currentGroup");
      /**
       * Index of current motion in its group.
       */
      __publicField(this, "currentIndex");
      /**
       * Group of the reserved motion.
       */
      __publicField(this, "reservedGroup");
      /**
       * Index of the reserved motion in its group.
       */
      __publicField(this, "reservedIndex");
      /**
       * Group of the reserved idle motion.
       */
      __publicField(this, "reservedIdleGroup");
      /**
       * Index of the reserved idle motion in its group.
       */
      __publicField(this, "reservedIdleIndex");
    }
    /**
     * Reserves the playback for a motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @return True if the reserving has succeeded.
     */
    reserve(group, index, priority) {
      if (priority <= 0) {
        logger.log(this.tag, `Cannot start a motion with MotionPriority.NONE.`);
        return false;
      }
      if (group === this.currentGroup && index === this.currentIndex) {
        logger.log(this.tag, `Motion is already playing.`, this.dump(group, index));
        return false;
      }
      if (group === this.reservedGroup && index === this.reservedIndex || group === this.reservedIdleGroup && index === this.reservedIdleIndex) {
        logger.log(this.tag, `Motion is already reserved.`, this.dump(group, index));
        return false;
      }
      if (priority === 1) {
        if (this.currentPriority !== 0) {
          logger.log(
            this.tag,
            `Cannot start idle motion because another motion is playing.`,
            this.dump(group, index)
          );
          return false;
        }
        if (this.reservedIdleGroup !== void 0) {
          logger.log(
            this.tag,
            `Cannot start idle motion because another idle motion has reserved.`,
            this.dump(group, index)
          );
          return false;
        }
        this.setReservedIdle(group, index);
      } else {
        if (priority < 3) {
          if (priority <= this.currentPriority) {
            logger.log(
              this.tag,
              "Cannot start motion because another motion is playing as an equivalent or higher priority.",
              this.dump(group, index)
            );
            return false;
          }
          if (priority <= this.reservePriority) {
            logger.log(
              this.tag,
              "Cannot start motion because another motion has reserved as an equivalent or higher priority.",
              this.dump(group, index)
            );
            return false;
          }
        }
        this.setReserved(group, index, priority);
      }
      return true;
    }
    /**
     * Requests the playback for a motion.
     * @param motion - The Motion, can be undefined.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @return True if the request has been approved, i.e. the motion is allowed to play.
     */
    start(motion, group, index, priority) {
      if (priority === 1) {
        this.setReservedIdle(void 0, void 0);
        if (this.currentPriority !== 0) {
          logger.log(
            this.tag,
            "Cannot start idle motion because another motion is playing.",
            this.dump(group, index)
          );
          return false;
        }
      } else {
        if (group !== this.reservedGroup || index !== this.reservedIndex) {
          logger.log(
            this.tag,
            "Cannot start motion because another motion has taken the place.",
            this.dump(group, index)
          );
          return false;
        }
        this.setReserved(
          void 0,
          void 0,
          0
          /* NONE */
        );
      }
      if (!motion) {
        return false;
      }
      this.setCurrent(group, index, priority);
      return true;
    }
    /**
     * Notifies the motion playback has finished.
     */
    complete() {
      this.setCurrent(
        void 0,
        void 0,
        0
        /* NONE */
      );
    }
    /**
     * Sets the current motion.
     */
    setCurrent(group, index, priority) {
      this.currentPriority = priority;
      this.currentGroup = group;
      this.currentIndex = index;
    }
    /**
     * Sets the reserved motion.
     */
    setReserved(group, index, priority) {
      this.reservePriority = priority;
      this.reservedGroup = group;
      this.reservedIndex = index;
    }
    /**
     * Sets the reserved idle motion.
     */
    setReservedIdle(group, index) {
      this.reservedIdleGroup = group;
      this.reservedIdleIndex = index;
    }
    /**
     * Checks if a Motion is currently playing or has reserved.
     * @return True if active.
     */
    isActive(group, index) {
      return group === this.currentGroup && index === this.currentIndex || group === this.reservedGroup && index === this.reservedIndex || group === this.reservedIdleGroup && index === this.reservedIdleIndex;
    }
    /**
     * Resets the state.
     */
    reset() {
      this.setCurrent(
        void 0,
        void 0,
        0
        /* NONE */
      );
      this.setReserved(
        void 0,
        void 0,
        0
        /* NONE */
      );
      this.setReservedIdle(void 0, void 0);
    }
    /**
     * Checks if an idle motion should be requests to play.
     */
    shouldRequestIdleMotion() {
      return this.currentGroup === void 0 && this.reservedIdleGroup === void 0;
    }
    /**
     * Checks if the model's expression should be overridden by the motion.
     */
    shouldOverrideExpression() {
      return !config.preserveExpressionOnMotion && this.currentPriority > 1;
    }
    /**
     * Dumps the state for debugging.
     */
    dump(requestedGroup, requestedIndex) {
      if (this.debug) {
        const keys = [
          "currentPriority",
          "reservePriority",
          "currentGroup",
          "currentIndex",
          "reservedGroup",
          "reservedIndex",
          "reservedIdleGroup",
          "reservedIdleIndex"
        ];
        return `
<Requested> group = "${requestedGroup}", index = ${requestedIndex}
` + keys.map((key) => "[" + key + "] " + this[key]).join("\n");
      }
      return "";
    }
  }
  const TAG$2 = "SoundManager";
  const VOLUME = 0.5;
  const audioListenersWeakMap = /* @__PURE__ */ new WeakMap();
  const audioCanplaythroughWeakMap = /* @__PURE__ */ new WeakMap();
  const audioContextWeakMap = /* @__PURE__ */ new WeakMap();
  const audioAnalyserWeakMap = /* @__PURE__ */ new WeakMap();
  const audioSourceWeakMap = /* @__PURE__ */ new WeakMap();
  class SoundManager {
    /**
     * Global volume that applies to all the sounds.
     */
    static get volume() {
      return this._volume;
    }
    static set volume(value) {
      this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
      this.audios.forEach((audio) => audio.volume = this._volume);
    }
    // TODO: return an ID?
    /**
     * Creates an audio element and adds it to the {@link audios}.
     * @param file - URL of the sound file.
     * @param onFinish - Callback invoked when the playback has finished.
     * @param onError - Callback invoked when error occurs.
     * @param crossOrigin - Cross origin setting.
     * @return Created audio element.
     */
    static add(file, onFinish, onError, crossOrigin) {
      const audio = new Audio(file);
      audio.volume = this._volume;
      audio.preload = "auto";
      audio.crossOrigin = crossOrigin;
      audioListenersWeakMap.set(audio, {
        ended: () => {
          this.dispose(audio);
          onFinish == null ? void 0 : onFinish();
        },
        error: (e) => {
          this.dispose(audio);
          logger.warn(TAG$2, `Error occurred on "${file}"`, e.error);
          onError == null ? void 0 : onError(e.error);
        }
      });
      audio.addEventListener("ended", audioListenersWeakMap.get(audio).ended);
      audio.addEventListener("error", audioListenersWeakMap.get(audio).error);
      this.audios.push(audio);
      return audio;
    }
    /**
     * Plays the sound.
     * @param audio - An audio element.
     * @return Promise that resolves when the audio is ready to play, rejects when error occurs.
     */
    static play(audio) {
      return new Promise((resolve, reject) => {
        var _a;
        (_a = audio.play()) == null ? void 0 : _a.catch((e) => {
          audio.dispatchEvent(new ErrorEvent("error", { error: e }));
          reject(e);
        });
        if (audio.readyState === audio.HAVE_ENOUGH_DATA) {
          resolve();
        } else {
          audioCanplaythroughWeakMap.set(audio, resolve);
          audio.addEventListener("canplaythrough", resolve);
        }
      });
    }
    static addContext(audio) {
      const context = new AudioContext();
      audioContextWeakMap.set(audio, context);
      this.contexts.push(context);
      return context;
    }
    static addAnalyzer(audio, context) {
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyser.connect(context.destination);
      audioSourceWeakMap.set(audio, source);
      audioAnalyserWeakMap.set(audio, analyser);
      this.analysers.push(analyser);
      return analyser;
    }
    /**
     * Get volume for lip sync
     * @param analyser - An analyzer element.
     * @return Returns value to feed into lip sync
     */
    static analyze(analyser) {
      if (analyser != void 0) {
        const pcmData = new Float32Array(analyser.fftSize);
        let sumSquares = 0;
        analyser.getFloatTimeDomainData(pcmData);
        for (const amplitude of pcmData) {
          sumSquares += amplitude * amplitude;
        }
        return parseFloat(Math.sqrt(sumSquares / pcmData.length * 20).toFixed(1));
      } else {
        return parseFloat(Math.random().toFixed(1));
      }
    }
    /**
     * Disposes an audio element and removes it from {@link audios}.
     * @param audio - An audio element.
     */
    static dispose(audio) {
      var _a, _b;
      audio.pause();
      audio.removeEventListener("ended", (_a = audioListenersWeakMap.get(audio)) == null ? void 0 : _a.ended);
      audio.removeEventListener("error", (_b = audioListenersWeakMap.get(audio)) == null ? void 0 : _b.error);
      audio.removeEventListener("canplaythrough", audioCanplaythroughWeakMap.get(audio));
      audioListenersWeakMap.delete(audio);
      audioCanplaythroughWeakMap.delete(audio);
      const context = audioContextWeakMap.get(audio);
      audioContextWeakMap.delete(audio);
      context == null ? void 0 : context.close();
      const analyser = audioAnalyserWeakMap.get(audio);
      audioAnalyserWeakMap.delete(audio);
      analyser == null ? void 0 : analyser.disconnect();
      const source = audioSourceWeakMap.get(audio);
      audioSourceWeakMap.delete(audio);
      source == null ? void 0 : source.disconnect();
      audio.removeAttribute("src");
      remove(this.analysers, analyser);
      remove(this.contexts, context);
      remove(this.audios, audio);
    }
    /**
     * Destroys all managed audios.
     */
    static destroy() {
      for (let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].close();
      }
      for (let i = this.audios.length - 1; i >= 0; i--) {
        this.dispose(this.audios[i]);
      }
    }
  }
  /**
   * Audio elements playing or pending to play. Finished audios will be removed automatically.
   */
  __publicField(SoundManager, "audios", []);
  __publicField(SoundManager, "analysers", []);
  __publicField(SoundManager, "contexts", []);
  __publicField(SoundManager, "_volume", VOLUME);
  var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root = freeGlobal || freeSelf || Function("return this")();
  var Symbol$1 = root.Symbol;
  var objectProto$6 = Object.prototype;
  var hasOwnProperty$4 = objectProto$6.hasOwnProperty;
  var nativeObjectToString$1 = objectProto$6.toString;
  var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : void 0;
  function getRawTag(value) {
    var isOwn = hasOwnProperty$4.call(value, symToStringTag$1), tag = value[symToStringTag$1];
    try {
      value[symToStringTag$1] = void 0;
      var unmasked = true;
    } catch (e) {
    }
    var result = nativeObjectToString$1.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag$1] = tag;
      } else {
        delete value[symToStringTag$1];
      }
    }
    return result;
  }
  var objectProto$5 = Object.prototype;
  var nativeObjectToString = objectProto$5.toString;
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }
  var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
  var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : void 0;
  function baseGetTag(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
  }
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  var isArray = Array.isArray;
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  var asyncTag = "[object AsyncFunction]", funcTag$1 = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
  function isFunction(value) {
    if (!isObject(value)) {
      return false;
    }
    var tag = baseGetTag(value);
    return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  var coreJsData = root["__core-js_shared__"];
  var maskSrcKey = function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
    return uid ? "Symbol(src)_1." + uid : "";
  }();
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }
  var funcProto$1 = Function.prototype;
  var funcToString$1 = funcProto$1.toString;
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString$1.call(func);
      } catch (e) {
      }
      try {
        return func + "";
      } catch (e) {
      }
    }
    return "";
  }
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  var funcProto = Function.prototype, objectProto$4 = Object.prototype;
  var funcToString = funcProto.toString;
  var hasOwnProperty$3 = objectProto$4.hasOwnProperty;
  var reIsNative = RegExp(
    "^" + funcToString.call(hasOwnProperty$3).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }
  function getValue(object, key) {
    return object == null ? void 0 : object[key];
  }
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : void 0;
  }
  var WeakMap$1 = getNative(root, "WeakMap");
  function noop() {
  }
  var MAX_SAFE_INTEGER = 9007199254740991;
  function isLength(value) {
    return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }
  var objectProto$3 = Object.prototype;
  function isPrototype(value) {
    var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto$3;
    return value === proto;
  }
  var argsTag$1 = "[object Arguments]";
  function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag$1;
  }
  var objectProto$2 = Object.prototype;
  var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
  var propertyIsEnumerable = objectProto$2.propertyIsEnumerable;
  var isArguments = baseIsArguments(/* @__PURE__ */ function() {
    return arguments;
  }()) ? baseIsArguments : function(value) {
    return isObjectLike(value) && hasOwnProperty$2.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
  };
  const isArguments$1 = isArguments;
  function stubFalse() {
    return false;
  }
  var freeExports$1 = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
  var freeModule$1 = freeExports$1 && typeof module == "object" && module && !module.nodeType && module;
  var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;
  var Buffer2 = moduleExports$1 ? root.Buffer : void 0;
  var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
  var isBuffer = nativeIsBuffer || stubFalse;
  const isBuffer$1 = isBuffer;
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag$2 = "[object Map]", numberTag = "[object Number]", objectTag$1 = "[object Object]", regexpTag = "[object RegExp]", setTag$2 = "[object Set]", stringTag = "[object String]", weakMapTag$1 = "[object WeakMap]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag$1 = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag$1] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag$2] = typedArrayTags[numberTag] = typedArrayTags[objectTag$1] = typedArrayTags[regexpTag] = typedArrayTags[setTag$2] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag$1] = false;
  function baseIsTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }
  var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
  var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
  var moduleExports = freeModule && freeModule.exports === freeExports;
  var freeProcess = moduleExports && freeGlobal.process;
  var nodeUtil = function() {
    try {
      var types = freeModule && freeModule.require && freeModule.require("util").types;
      if (types) {
        return types;
      }
      return freeProcess && freeProcess.binding && freeProcess.binding("util");
    } catch (e) {
    }
  }();
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  const isTypedArray$1 = isTypedArray;
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  var nativeKeys = overArg(Object.keys, Object);
  var objectProto$1 = Object.prototype;
  var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty$1.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }
  var Map = getNative(root, "Map");
  var DataView = getNative(root, "DataView");
  var Promise$1 = getNative(root, "Promise");
  var Set$1 = getNative(root, "Set");
  var mapTag$1 = "[object Map]", objectTag = "[object Object]", promiseTag = "[object Promise]", setTag$1 = "[object Set]", weakMapTag = "[object WeakMap]";
  var dataViewTag = "[object DataView]";
  var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map), promiseCtorString = toSource(Promise$1), setCtorString = toSource(Set$1), weakMapCtorString = toSource(WeakMap$1);
  var getTag = baseGetTag;
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag$1 || Promise$1 && getTag(Promise$1.resolve()) != promiseTag || Set$1 && getTag(new Set$1()) != setTag$1 || WeakMap$1 && getTag(new WeakMap$1()) != weakMapTag) {
    getTag = function(value) {
      var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag$1;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag$1;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }
  const getTag$1 = getTag;
  var mapTag = "[object Map]", setTag = "[object Set]";
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function isEmpty(value) {
    if (value == null) {
      return true;
    }
    if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer$1(value) || isTypedArray$1(value) || isArguments$1(value))) {
      return !value.length;
    }
    var tag = getTag$1(value);
    if (tag == mapTag || tag == setTag) {
      return !value.size;
    }
    if (isPrototype(value)) {
      return !baseKeys(value).length;
    }
    for (var key in value) {
      if (hasOwnProperty.call(value, key)) {
        return false;
      }
    }
    return true;
  }
  var MotionPreloadStrategy = /* @__PURE__ */ ((MotionPreloadStrategy2) => {
    MotionPreloadStrategy2["ALL"] = "ALL";
    MotionPreloadStrategy2["IDLE"] = "IDLE";
    MotionPreloadStrategy2["NONE"] = "NONE";
    return MotionPreloadStrategy2;
  })(MotionPreloadStrategy || {});
  class MotionManager extends core.utils.EventEmitter {
    constructor(settings, options) {
      super();
      /**
       * Tag for logging.
       */
      __publicField(this, "tag");
      /**
       * The ModelSettings reference.
       */
      __publicField(this, "settings");
      /**
       * The Motions. The structure is the same as {@link definitions}, initially each group contains
       * an empty array, which means all motions will be `undefined`. When a Motion has been loaded,
       * it'll fill the place in which it should be; when it fails to load, the place will be filled
       * with `null`.
       */
      __publicField(this, "motionGroups", {});
      /**
       * Maintains the state of this MotionManager.
       */
      __publicField(this, "state", new MotionState());
      /**
       * Audio element of the current motion if a sound file is defined with it.
       */
      __publicField(this, "currentAudio");
      /**
       * Analyzer element for the current sound being played.
       */
      __publicField(this, "currentAnalyzer");
      /**
       * Context element for the current sound being played.
       */
      __publicField(this, "currentContext");
      /**
       * Flags there's a motion playing.
       */
      __publicField(this, "playing", false);
      /**
       * Flags the instances has been destroyed.
       */
      __publicField(this, "destroyed", false);
      this.settings = settings;
      this.tag = `MotionManager(${settings.name})`;
      this.state.tag = this.tag;
    }
    /**
     * Should be called in the constructor of derived class.
     */
    init(options) {
      if (options == null ? void 0 : options.idleMotionGroup) {
        this.groups.idle = options.idleMotionGroup;
      }
      this.setupMotions(options);
      this.stopAllMotions();
    }
    /**
     * Sets up motions from the definitions, and preloads them according to the preload strategy.
     */
    setupMotions(options) {
      for (const group of Object.keys(this.definitions)) {
        this.motionGroups[group] = [];
      }
      let groups;
      switch (options == null ? void 0 : options.motionPreload) {
        case "NONE":
          return;
        case "ALL":
          groups = Object.keys(this.definitions);
          break;
        case "IDLE":
        default:
          groups = [this.groups.idle];
          break;
      }
      for (const group of groups) {
        if (this.definitions[group]) {
          for (let i = 0; i < this.definitions[group].length; i++) {
            this.loadMotion(group, i).then();
          }
        }
      }
    }
    /**
     * Loads a Motion in a motion group. Errors in this method will not be thrown,
     * but be emitted with a "motionLoadError" event.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
     * @emits {@link MotionManagerEvents.motionLoaded}
     * @emits {@link MotionManagerEvents.motionLoadError}
     */
    loadMotion(group, index) {
      return __async(this, null, function* () {
        var _a;
        if (!((_a = this.definitions[group]) == null ? void 0 : _a[index])) {
          logger.warn(this.tag, `Undefined motion at "${group}"[${index}]`);
          return void 0;
        }
        if (this.motionGroups[group][index] === null) {
          logger.warn(
            this.tag,
            `Cannot start motion at "${group}"[${index}] because it's already failed in loading.`
          );
          return void 0;
        }
        if (this.motionGroups[group][index]) {
          return this.motionGroups[group][index];
        }
        const motion = yield this._loadMotion(group, index);
        if (this.destroyed) {
          return;
        }
        this.motionGroups[group][index] = motion != null ? motion : null;
        return motion;
      });
    }
    /**
     * Loads the Motion. Will be implemented by Live2DFactory in order to avoid circular dependency.
     * @ignore
     */
    _loadMotion(group, index) {
      throw new Error("Not implemented.");
    }
    /**
     * Only play sound with lip sync
     * @param sound - The audio url to file or base64 content
     * ### OPTIONAL: {name: value, ...}
     * @param volume - Volume of the sound (0-1)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset expression before and after playing sound (default: true)
     * @param crossOrigin - Cross origin setting.
     * @returns Promise that resolves with true if the sound is playing, false if it's not
     */
    speak(_0) {
      return __async(this, arguments, function* (sound, {
        volume = VOLUME,
        expression,
        resetExpression = true,
        crossOrigin,
        onFinish,
        onError
      } = {}) {
        if (!config.sound) {
          return false;
        }
        let audio;
        let analyzer;
        let context;
        if (this.currentAudio) {
          if (!this.currentAudio.ended) {
            return false;
          }
        }
        let soundURL;
        const isBase64Content = sound && sound.startsWith("data:");
        if (sound && !isBase64Content) {
          const A = document.createElement("a");
          A.href = sound;
          sound = A.href;
          soundURL = sound;
        } else {
          soundURL = "data:audio/";
        }
        const file = sound;
        if (file) {
          try {
            audio = SoundManager.add(
              file,
              (that = this) => {
                console.log("Audio finished playing");
                onFinish == null ? void 0 : onFinish();
                resetExpression && expression && that.expressionManager && that.expressionManager.resetExpression();
                that.currentAudio = void 0;
              },
              // reset expression when audio is done
              (e, that = this) => {
                console.log("Error during audio playback:", e);
                onError == null ? void 0 : onError(e);
                resetExpression && expression && that.expressionManager && that.expressionManager.resetExpression();
                that.currentAudio = void 0;
              },
              // on error
              crossOrigin
            );
            this.currentAudio = audio;
            SoundManager.volume = volume;
            context = SoundManager.addContext(this.currentAudio);
            this.currentContext = context;
            analyzer = SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
            this.currentAnalyzer = analyzer;
          } catch (e) {
            logger.warn(this.tag, "Failed to create audio", soundURL, e);
            return false;
          }
        }
        if (audio) {
          let playSuccess = true;
          const readyToPlay = SoundManager.play(audio).catch((e) => {
            logger.warn(this.tag, "Failed to play audio", audio.src, e);
            playSuccess = false;
          });
          if (config.motionSync) {
            yield readyToPlay;
            if (!playSuccess) {
              return false;
            }
          }
        }
        if (this.state.shouldOverrideExpression()) {
          this.expressionManager && this.expressionManager.resetExpression();
        }
        if (expression && this.expressionManager) {
          this.expressionManager.setExpression(expression);
        }
        this.playing = true;
        return true;
      });
    }
    /**
     * Starts a motion as given priority.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied. default: 2 (NORMAL)
     * ### OPTIONAL: {name: value, ...}
     * @param sound - The audio url to file or base64 content
     * @param volume - Volume of the sound (0-1)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset expression before and after playing sound (default: true)
     * @param crossOrigin - Cross origin setting.
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    startMotion(_0, _1) {
      return __async(this, arguments, function* (group, index, priority = MotionPriority.NORMAL, {
        sound = void 0,
        volume = VOLUME,
        expression = void 0,
        resetExpression = true,
        crossOrigin,
        onFinish,
        onError
      } = {}) {
        var _a;
        if (!this.state.reserve(group, index, priority)) {
          return false;
        }
        if (this.currentAudio) {
          if (!this.currentAudio.ended && priority != MotionPriority.FORCE) {
            return false;
          }
        }
        const definition = (_a = this.definitions[group]) == null ? void 0 : _a[index];
        if (!definition) {
          return false;
        }
        if (this.currentAudio) {
          SoundManager.dispose(this.currentAudio);
        }
        let audio;
        let analyzer;
        let context;
        let soundURL;
        const isBase64Content = sound && sound.startsWith("data:");
        if (sound && !isBase64Content) {
          const A = document.createElement("a");
          A.href = sound;
          sound = A.href;
          soundURL = sound;
        } else {
          soundURL = this.getSoundFile(definition);
          if (soundURL) {
            soundURL = this.settings.resolveURL(soundURL);
          }
        }
        const file = soundURL;
        if (file) {
          try {
            audio = SoundManager.add(
              file,
              (that = this) => {
                console.log("Audio finished playing");
                onFinish == null ? void 0 : onFinish();
                resetExpression && expression && that.expressionManager && that.expressionManager.resetExpression();
                that.currentAudio = void 0;
              },
              // reset expression when audio is done
              (e, that = this) => {
                console.log("Error during audio playback:", e);
                onError == null ? void 0 : onError(e);
                resetExpression && expression && that.expressionManager && that.expressionManager.resetExpression();
                that.currentAudio = void 0;
              },
              // on error
              crossOrigin
            );
            this.currentAudio = audio;
            SoundManager.volume = volume;
            context = SoundManager.addContext(this.currentAudio);
            this.currentContext = context;
            analyzer = SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
            this.currentAnalyzer = analyzer;
          } catch (e) {
            logger.warn(this.tag, "Failed to create audio", soundURL, e);
          }
        }
        const motion = yield this.loadMotion(group, index);
        if (audio && !isEmpty(audio.src)) {
          const readyToPlay = SoundManager.play(audio).catch(
            (e) => logger.warn(this.tag, "Failed to play audio", audio.src, e)
          );
          if (config.motionSync) {
            yield readyToPlay;
          }
        }
        if (!this.state.start(motion, group, index, priority)) {
          if (audio && !isEmpty(audio.src)) {
            SoundManager.dispose(audio);
            this.currentAudio = void 0;
          }
          return false;
        }
        if (this.state.shouldOverrideExpression()) {
          this.expressionManager && this.expressionManager.resetExpression();
        }
        logger.log(this.tag, "Start motion:", this.getMotionName(definition));
        this.emit("motionStart", group, index, audio);
        if (expression && this.expressionManager && this.state.shouldOverrideExpression()) {
          this.expressionManager.setExpression(expression);
        }
        this.playing = true;
        this._startMotion(motion);
        return true;
      });
    }
    /**
     * Starts a random Motion as given priority.
     * @param group - The motion group.
     * @param priority - The priority to be applied. (default: 1 `IDLE`)
     * ### OPTIONAL: {name: value, ...}
     * @param sound - The wav url file or base64 content+
     * @param volume - Volume of the sound (0-1) (default: 1)
     * @param expression - In case you want to mix up a expression while playing sound (name/index)
     * @param resetExpression - Reset expression before and after playing sound (default: true)
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    startRandomMotion(_0, _1) {
      return __async(this, arguments, function* (group, priority, {
        sound,
        volume = VOLUME,
        expression,
        resetExpression = true,
        crossOrigin,
        onFinish,
        onError
      } = {}) {
        const groupDefs = this.definitions[group];
        if (groupDefs == null ? void 0 : groupDefs.length) {
          const availableIndices = [];
          for (let i = 0; i < groupDefs.length; i++) {
            if (this.motionGroups[group][i] !== null && !this.state.isActive(group, i)) {
              availableIndices.push(i);
            }
          }
          if (availableIndices.length) {
            const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            return this.startMotion(group, index, priority, {
              sound,
              volume,
              expression,
              resetExpression,
              crossOrigin,
              onFinish,
              onError
            });
          }
        }
        return false;
      });
    }
    /**
     * Stop current audio playback and lipsync
     */
    stopSpeaking() {
      if (this.currentAudio) {
        SoundManager.dispose(this.currentAudio);
        this.currentAudio = void 0;
      }
    }
    /**
     * Stops all playing motions as well as the sound.
     */
    stopAllMotions() {
      this._stopAllMotions();
      this.state.reset();
      this.stopSpeaking();
    }
    /**
     * Updates parameters of the core model.
     * @param model - The core model.
     * @param now - Current time in milliseconds.
     * @return True if the parameters have been actually updated.
     */
    update(model, now) {
      var _a;
      if (this.isFinished()) {
        if (this.playing) {
          this.playing = false;
          this.emit("motionFinish");
        }
        if (this.state.shouldOverrideExpression()) {
          (_a = this.expressionManager) == null ? void 0 : _a.restoreExpression();
        }
        this.state.complete();
        if (this.state.shouldRequestIdleMotion()) {
          this.startRandomMotion(this.groups.idle, MotionPriority.IDLE);
        }
      }
      return this.updateParameters(model, now);
    }
    /**
     * Move the mouth
     *
     */
    mouthSync() {
      if (this.currentAnalyzer) {
        return SoundManager.analyze(this.currentAnalyzer);
      } else {
        return 0;
      }
    }
    /**
     * Destroys the instance.
     * @emits {@link MotionManagerEvents.destroy}
     */
    destroy() {
      var _a;
      this.destroyed = true;
      this.emit("destroy");
      this.stopAllMotions();
      (_a = this.expressionManager) == null ? void 0 : _a.destroy();
      const self2 = this;
      self2.definitions = void 0;
      self2.motionGroups = void 0;
    }
  }
  const tempBounds = { x: 0, y: 0, width: 0, height: 0 };
  class InternalModel extends core.utils.EventEmitter {
    constructor() {
      super(...arguments);
      __publicField(this, "focusController", new FocusController());
      __publicField(this, "pose");
      __publicField(this, "physics");
      /**
       * Original canvas width of the model. Note this doesn't represent the model's real size,
       * as the model can overflow from its canvas.
       */
      __publicField(this, "originalWidth", 0);
      /**
       * Original canvas height of the model. Note this doesn't represent the model's real size,
       * as the model can overflow from its canvas.
       */
      __publicField(this, "originalHeight", 0);
      /**
       * Canvas width of the model, scaled by the `width` of the model's layout.
       */
      __publicField(this, "width", 0);
      /**
       * Canvas height of the model, scaled by the `height` of the model's layout.
       */
      __publicField(this, "height", 0);
      /**
       * Local transformation, calculated from the model's layout.
       */
      __publicField(this, "localTransform", new core.Matrix());
      /**
       * The final matrix to draw the model.
       */
      __publicField(this, "drawingMatrix", new core.Matrix());
      // TODO: change structure
      /**
       * The hit area definitions, keyed by their names.
       */
      __publicField(this, "hitAreas", {});
      /**
       * Flags whether `gl.UNPACK_FLIP_Y_WEBGL` should be enabled when binding the textures.
       */
      __publicField(this, "textureFlipY", false);
      /**
       * WebGL viewport when drawing the model. The format is `[x, y, width, height]`.
       */
      __publicField(this, "viewport", [0, 0, 0, 0]);
      /**
       * Flags this instance has been destroyed.
       */
      __publicField(this, "destroyed", false);
    }
    /**
     * Should be called in the constructor of derived class.
     */
    init() {
      this.setupLayout();
      this.setupHitAreas();
    }
    /**
     * Sets up the model's size and local transform by the model's layout.
     */
    setupLayout() {
      const self2 = this;
      const size = this.getSize();
      self2.originalWidth = size[0];
      self2.originalHeight = size[1];
      const layout = Object.assign(
        {
          width: LOGICAL_WIDTH,
          height: LOGICAL_HEIGHT
        },
        this.getLayout()
      );
      this.localTransform.scale(layout.width / LOGICAL_WIDTH, layout.height / LOGICAL_HEIGHT);
      self2.width = this.originalWidth * this.localTransform.a;
      self2.height = this.originalHeight * this.localTransform.d;
      const offsetX = layout.x !== void 0 && layout.x - layout.width / 2 || layout.centerX !== void 0 && layout.centerX || layout.left !== void 0 && layout.left - layout.width / 2 || layout.right !== void 0 && layout.right + layout.width / 2 || 0;
      const offsetY = layout.y !== void 0 && layout.y - layout.height / 2 || layout.centerY !== void 0 && layout.centerY || layout.top !== void 0 && layout.top - layout.height / 2 || layout.bottom !== void 0 && layout.bottom + layout.height / 2 || 0;
      this.localTransform.translate(this.width * offsetX, -this.height * offsetY);
    }
    /**
     * Sets up the hit areas by their definitions in settings.
     */
    setupHitAreas() {
      const definitions = this.getHitAreaDefs().filter((hitArea) => hitArea.index >= 0);
      for (const def of definitions) {
        this.hitAreas[def.name] = def;
      }
    }
    /**
     * Hit-test on the model.
     * @param x - Position in model canvas.
     * @param y - Position in model canvas.
     * @return The names of the *hit* hit areas. Can be empty if none is hit.
     */
    hitTest(x, y) {
      return Object.keys(this.hitAreas).filter((hitAreaName) => this.isHit(hitAreaName, x, y));
    }
    /**
     * Hit-test for a single hit area.
     * @param hitAreaName - The hit area's name.
     * @param x - Position in model canvas.
     * @param y - Position in model canvas.
     * @return True if hit.
     */
    isHit(hitAreaName, x, y) {
      if (!this.hitAreas[hitAreaName]) {
        return false;
      }
      const drawIndex = this.hitAreas[hitAreaName].index;
      const bounds = this.getDrawableBounds(drawIndex, tempBounds);
      return bounds.x <= x && x <= bounds.x + bounds.width && bounds.y <= y && y <= bounds.y + bounds.height;
    }
    /**
     * Gets a drawable's bounds.
     * @param index - Index of the drawable.
     * @param bounds - Object to store the output values.
     * @return The bounds in model canvas space.
     */
    getDrawableBounds(index, bounds) {
      const vertices = this.getDrawableVertices(index);
      let left = vertices[0];
      let right = vertices[0];
      let top = vertices[1];
      let bottom = vertices[1];
      for (let i = 0; i < vertices.length; i += 2) {
        const vx = vertices[i];
        const vy = vertices[i + 1];
        left = Math.min(vx, left);
        right = Math.max(vx, right);
        top = Math.min(vy, top);
        bottom = Math.max(vy, bottom);
      }
      bounds != null ? bounds : bounds = {};
      bounds.x = left;
      bounds.y = top;
      bounds.width = right - left;
      bounds.height = bottom - top;
      return bounds;
    }
    /**
     * Updates the model's transform.
     * @param transform - The world transform.
     */
    updateTransform(transform) {
      this.drawingMatrix.copyFrom(transform).append(this.localTransform);
    }
    /**
     * Updates the model's parameters.
     * @param dt - Elapsed time in milliseconds from last frame.
     * @param now - Current time in milliseconds.
     */
    update(dt, now) {
      this.focusController.update(dt);
    }
    /**
     * Destroys the model and all related resources.
     * @emits {@link InternalModelEvents.destroy | destroy}
     */
    destroy() {
      this.destroyed = true;
      this.emit("destroy");
      this.motionManager.destroy();
      this.motionManager = void 0;
    }
  }
  const TAG$1 = "XHRLoader";
  class NetworkError extends Error {
    constructor(message, url, status, aborted = false) {
      super(message);
      this.url = url;
      this.status = status;
      this.aborted = aborted;
    }
  }
  const _XHRLoader = class _XHRLoader {
    /**
     * Creates a managed XHR.
     * @param target - If provided, the XHR will be canceled when receiving an "destroy" event from the target.
     * @param url - The URL.
     * @param type - The XHR response type.
     * @param onload - Load listener.
     * @param onerror - Error handler.
     */
    static createXHR(target, url, type, onload, onerror) {
      const xhr = new XMLHttpRequest();
      _XHRLoader.allXhrSet.add(xhr);
      if (target) {
        let xhrSet = _XHRLoader.xhrMap.get(target);
        if (!xhrSet) {
          xhrSet = /* @__PURE__ */ new Set([xhr]);
          _XHRLoader.xhrMap.set(target, xhrSet);
        } else {
          xhrSet.add(xhr);
        }
        if (!target.listeners("destroy").includes(_XHRLoader.cancelXHRs)) {
          target.once("destroy", _XHRLoader.cancelXHRs);
        }
      }
      xhr.open("GET", url);
      xhr.responseType = type;
      xhr.onload = () => {
        if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
          onload(xhr.response);
        } else {
          xhr.onerror();
        }
      };
      xhr.onerror = () => {
        logger.warn(
          TAG$1,
          `Failed to load resource as ${xhr.responseType} (Status ${xhr.status}): ${url}`
        );
        onerror(new NetworkError("Network error.", url, xhr.status));
      };
      xhr.onabort = () => onerror(new NetworkError("Aborted.", url, xhr.status, true));
      xhr.onloadend = () => {
        var _a;
        _XHRLoader.allXhrSet.delete(xhr);
        if (target) {
          (_a = _XHRLoader.xhrMap.get(target)) == null ? void 0 : _a.delete(xhr);
        }
      };
      return xhr;
    }
    /**
     * Cancels all XHRs related to this target.
     */
    static cancelXHRs() {
      var _a;
      (_a = _XHRLoader.xhrMap.get(this)) == null ? void 0 : _a.forEach((xhr) => {
        xhr.abort();
        _XHRLoader.allXhrSet.delete(xhr);
      });
      _XHRLoader.xhrMap.delete(this);
    }
    /**
     * Release all XHRs.
     */
    static release() {
      _XHRLoader.allXhrSet.forEach((xhr) => xhr.abort());
      _XHRLoader.allXhrSet.clear();
      _XHRLoader.xhrMap = /* @__PURE__ */ new WeakMap();
    }
  };
  /**
   * All the created XHRs, keyed by their owners respectively.
   */
  __publicField(_XHRLoader, "xhrMap", /* @__PURE__ */ new WeakMap());
  /**
   * All the created XHRs as a flat array.
   */
  __publicField(_XHRLoader, "allXhrSet", /* @__PURE__ */ new Set());
  /**
   * Middleware for Live2DLoader.
   */
  __publicField(_XHRLoader, "loader", (context, next) => {
    return new Promise((resolve, reject) => {
      const xhr = _XHRLoader.createXHR(
        context.target,
        context.settings ? context.settings.resolveURL(context.url) : context.url,
        context.type,
        (data) => {
          context.result = data;
          resolve();
        },
        reject
      );
      xhr.send();
    });
  });
  let XHRLoader = _XHRLoader;
  function runMiddlewares(middleware, context) {
    let index = -1;
    return dispatch(0);
    function dispatch(i, err) {
      if (err)
        return Promise.reject(err);
      if (i <= index)
        return Promise.reject(new Error("next() called multiple times"));
      index = i;
      const fn = middleware[i];
      if (!fn)
        return Promise.resolve();
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err2) {
        return Promise.reject(err2);
      }
    }
  }
  class Live2DLoader {
    /**
     * Loads a resource.
     * @return Promise that resolves with the loaded data in a format that's consistent with the specified `type`.
     */
    static load(context) {
      return runMiddlewares(this.middlewares, context).then(() => context.result);
    }
  }
  __publicField(Live2DLoader, "middlewares", [XHRLoader.loader]);
  function createTexture(url, options = {}) {
    var _a;
    const textureOptions = { resourceOptions: { crossorigin: options.crossOrigin } };
    if (core.Texture.fromURL) {
      return core.Texture.fromURL(url, textureOptions).catch((e) => {
        if (e instanceof Error) {
          throw e;
        }
        const err = new Error("Texture loading error");
        err.event = e;
        throw err;
      });
    }
    textureOptions.resourceOptions.autoLoad = false;
    const texture = core.Texture.from(url, textureOptions);
    if (texture.baseTexture.valid) {
      return Promise.resolve(texture);
    }
    const resource = texture.baseTexture.resource;
    (_a = resource._live2d_load) != null ? _a : resource._live2d_load = new Promise((resolve, reject) => {
      const errorHandler = (event) => {
        resource.source.removeEventListener("error", errorHandler);
        const err = new Error("Texture loading error");
        err.event = event;
        reject(err);
      };
      resource.source.addEventListener("error", errorHandler);
      resource.load().then(() => resolve(texture)).catch(errorHandler);
    });
    return resource._live2d_load;
  }
  const TAG = "Live2DFactory";
  const urlToJSON = (context, next) => __async(this, null, function* () {
    if (typeof context.source === "string") {
      const data = yield Live2DLoader.load({
        url: context.source,
        type: "json",
        target: context.live2dModel
      });
      data.url = context.source;
      context.source = data;
      context.live2dModel.emit("settingsJSONLoaded", data);
    }
    return next();
  });
  const jsonToSettings = (context, next) => __async(this, null, function* () {
    if (context.source instanceof ModelSettings) {
      context.settings = context.source;
      return next();
    } else if (typeof context.source === "object") {
      const runtime = Live2DFactory.findRuntime(context.source);
      if (runtime) {
        const settings = runtime.createModelSettings(context.source);
        context.settings = settings;
        context.live2dModel.emit("settingsLoaded", settings);
        return next();
      }
    }
    throw new TypeError("Unknown settings format.");
  });
  const waitUntilReady = (context, next) => {
    if (context.settings) {
      const runtime = Live2DFactory.findRuntime(context.settings);
      if (runtime) {
        return runtime.ready().then(next);
      }
    }
    return next();
  };
  const setupOptionals = (context, next) => __async(this, null, function* () {
    yield next();
    const internalModel = context.internalModel;
    if (internalModel) {
      const settings = context.settings;
      const runtime = Live2DFactory.findRuntime(settings);
      if (runtime) {
        const tasks = [];
        if (settings.pose) {
          tasks.push(
            Live2DLoader.load({
              settings,
              url: settings.pose,
              type: "json",
              target: internalModel
            }).then((data) => {
              internalModel.pose = runtime.createPose(internalModel.coreModel, data);
              context.live2dModel.emit("poseLoaded", internalModel.pose);
            }).catch((e) => {
              context.live2dModel.emit("poseLoadError", e);
              logger.warn(TAG, "Failed to load pose.", e);
            })
          );
        }
        if (settings.physics) {
          tasks.push(
            Live2DLoader.load({
              settings,
              url: settings.physics,
              type: "json",
              target: internalModel
            }).then((data) => {
              internalModel.physics = runtime.createPhysics(
                internalModel.coreModel,
                data
              );
              context.live2dModel.emit("physicsLoaded", internalModel.physics);
            }).catch((e) => {
              context.live2dModel.emit("physicsLoadError", e);
              logger.warn(TAG, "Failed to load physics.", e);
            })
          );
        }
        if (tasks.length) {
          yield Promise.all(tasks);
        }
      }
    }
  });
  const setupEssentials = (context, next) => __async(this, null, function* () {
    if (context.settings) {
      const live2DModel = context.live2dModel;
      const loadingTextures = Promise.all(
        context.settings.textures.map((tex) => {
          const url = context.settings.resolveURL(tex);
          return createTexture(url, { crossOrigin: context.options.crossOrigin });
        })
      );
      loadingTextures.catch(noop);
      yield next();
      if (context.internalModel) {
        live2DModel.internalModel = context.internalModel;
        live2DModel.emit("modelLoaded", context.internalModel);
      } else {
        throw new TypeError("Missing internal model.");
      }
      live2DModel.textures = yield loadingTextures;
      live2DModel.emit("textureLoaded", live2DModel.textures);
    } else {
      throw new TypeError("Missing settings.");
    }
  });
  const createInternalModel = (context, next) => __async(this, null, function* () {
    const settings = context.settings;
    if (settings instanceof ModelSettings) {
      const runtime = Live2DFactory.findRuntime(settings);
      if (!runtime) {
        throw new TypeError("Unknown model settings.");
      }
      const modelData = yield Live2DLoader.load({
        settings,
        url: settings.moc,
        type: "arraybuffer",
        target: context.live2dModel
      });
      if (!runtime.isValidMoc(modelData)) {
        throw new Error("Invalid moc data");
      }
      const coreModel = runtime.createCoreModel(modelData);
      context.internalModel = runtime.createInternalModel(coreModel, settings, context.options);
      return next();
    }
    throw new TypeError("Missing settings.");
  });
  const _ZipLoader = class _ZipLoader {
    static unzip(reader, settings) {
      return __async(this, null, function* () {
        const filePaths = yield _ZipLoader.getFilePaths(reader);
        const requiredFilePaths = [];
        for (const definedFile of settings.getDefinedFiles()) {
          const actualPath = decodeURI(core.utils.url.resolve(settings.url, definedFile));
          if (filePaths.includes(actualPath)) {
            requiredFilePaths.push(actualPath);
          }
        }
        const files = yield _ZipLoader.getFiles(reader, requiredFilePaths);
        for (let i = 0; i < files.length; i++) {
          const path = requiredFilePaths[i];
          const file = files[i];
          Object.defineProperty(file, "webkitRelativePath", {
            value: path
          });
        }
        return files;
      });
    }
    static createSettings(reader) {
      return __async(this, null, function* () {
        const filePaths = yield _ZipLoader.getFilePaths(reader);
        const settingsFilePath = filePaths.find(
          (path) => path.endsWith("model.json") || path.endsWith("model3.json")
        );
        if (!settingsFilePath) {
          throw new Error("Settings file not found");
        }
        const settingsText = yield _ZipLoader.readText(reader, settingsFilePath);
        if (!settingsText) {
          throw new Error("Empty settings file: " + settingsFilePath);
        }
        const settingsJSON = JSON.parse(settingsText);
        settingsJSON.url = settingsFilePath;
        const runtime = _ZipLoader.live2dFactory.findRuntime(settingsJSON);
        if (!runtime) {
          throw new Error("Unknown settings JSON");
        }
        return runtime.createModelSettings(settingsJSON);
      });
    }
    static zipReader(data, url) {
      return __async(this, null, function* () {
        throw new Error("Not implemented");
      });
    }
    static getFilePaths(reader) {
      return __async(this, null, function* () {
        throw new Error("Not implemented");
      });
    }
    static getFiles(reader, paths) {
      return __async(this, null, function* () {
        throw new Error("Not implemented");
      });
    }
    static readText(reader, path) {
      return __async(this, null, function* () {
        throw new Error("Not implemented");
      });
    }
    static releaseReader(reader) {
    }
  };
  // will be set by Live2DFactory
  __publicField(_ZipLoader, "live2dFactory");
  __publicField(_ZipLoader, "ZIP_PROTOCOL", "zip://");
  __publicField(_ZipLoader, "uid", 0);
  __publicField(_ZipLoader, "factory", (context, next) => __async(_ZipLoader, null, function* () {
    const source = context.source;
    let sourceURL;
    let zipBlob;
    let settings;
    if (typeof source === "string" && (source.endsWith(".zip") || source.startsWith(_ZipLoader.ZIP_PROTOCOL))) {
      if (source.startsWith(_ZipLoader.ZIP_PROTOCOL)) {
        sourceURL = source.slice(_ZipLoader.ZIP_PROTOCOL.length);
      } else {
        sourceURL = source;
      }
      zipBlob = yield Live2DLoader.load({
        url: sourceURL,
        type: "blob",
        target: context.live2dModel
      });
    } else if (Array.isArray(source) && source.length === 1 && source[0] instanceof File && source[0].name.endsWith(".zip")) {
      zipBlob = source[0];
      sourceURL = URL.createObjectURL(zipBlob);
      settings = source.settings;
    }
    if (zipBlob) {
      if (!zipBlob.size) {
        throw new Error("Empty zip file");
      }
      const reader = yield _ZipLoader.zipReader(zipBlob, sourceURL);
      if (!settings) {
        settings = yield _ZipLoader.createSettings(reader);
      }
      settings._objectURL = _ZipLoader.ZIP_PROTOCOL + _ZipLoader.uid + "/" + settings.url;
      const files = yield _ZipLoader.unzip(reader, settings);
      files.settings = settings;
      context.source = files;
      if (sourceURL.startsWith("blob:")) {
        context.live2dModel.once("modelLoaded", (internalModel) => {
          internalModel.once("destroy", function() {
            URL.revokeObjectURL(sourceURL);
          });
        });
      }
      _ZipLoader.releaseReader(reader);
    }
    return next();
  }));
  let ZipLoader = _ZipLoader;
  const _FileLoader = class _FileLoader {
    /**
     * Resolves the path of a resource file to the object URL.
     * @param settingsURL - Object URL of the settings file.
     * @param filePath - Resource file path.
     * @return Resolved object URL.
     */
    static resolveURL(settingsURL, filePath) {
      var _a;
      const resolved = (_a = _FileLoader.filesMap[settingsURL]) == null ? void 0 : _a[filePath];
      if (resolved === void 0) {
        throw new Error("Cannot find this file from uploaded files: " + filePath);
      }
      return resolved;
    }
    /**
     * Consumes the files by storing their object URLs. Files not defined in the settings will be ignored.
     */
    static upload(files, settings) {
      return __async(this, null, function* () {
        const fileMap = {};
        for (const definedFile of settings.getDefinedFiles()) {
          const actualPath = decodeURI(core.utils.url.resolve(settings.url, definedFile));
          const actualFile = files.find((file) => file.webkitRelativePath === actualPath);
          if (actualFile) {
            fileMap[definedFile] = URL.createObjectURL(actualFile);
          }
        }
        _FileLoader.filesMap[settings._objectURL] = fileMap;
      });
    }
    /**
     * Creates a ModelSettings by given files.
     * @return Promise that resolves with the created ModelSettings.
     */
    static createSettings(files) {
      return __async(this, null, function* () {
        const settingsFile = files.find(
          (file) => file.name.endsWith("model.json") || file.name.endsWith("model3.json")
        );
        if (!settingsFile) {
          throw new TypeError("Settings file not found");
        }
        const settingsText = yield _FileLoader.readText(settingsFile);
        const settingsJSON = JSON.parse(settingsText);
        settingsJSON.url = settingsFile.webkitRelativePath;
        const runtime = Live2DFactory.findRuntime(settingsJSON);
        if (!runtime) {
          throw new Error("Unknown settings JSON");
        }
        const settings = runtime.createModelSettings(settingsJSON);
        settings._objectURL = URL.createObjectURL(settingsFile);
        return settings;
      });
    }
    /**
     * Reads a file as text in UTF-8.
     */
    static readText(file) {
      return __async(this, null, function* () {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsText(file, "utf8");
        });
      });
    }
  };
  // will be set by Live2DFactory
  __publicField(_FileLoader, "live2dFactory");
  /**
   * Stores all the object URLs of uploaded files.
   */
  __publicField(_FileLoader, "filesMap", {});
  /**
   * Middleware for Live2DFactory.
   */
  __publicField(_FileLoader, "factory", (context, next) => __async(_FileLoader, null, function* () {
    if (Array.isArray(context.source) && context.source[0] instanceof File) {
      const files = context.source;
      let settings = files.settings;
      if (!settings) {
        settings = yield _FileLoader.createSettings(files);
      } else if (!settings._objectURL) {
        throw new Error('"_objectURL" must be specified in ModelSettings');
      }
      settings.validateFiles(files.map((file) => encodeURI(file.webkitRelativePath)));
      yield _FileLoader.upload(files, settings);
      settings.resolveURL = function(url) {
        return _FileLoader.resolveURL(this._objectURL, url);
      };
      context.source = settings;
      context.live2dModel.once("modelLoaded", (internalModel) => {
        internalModel.once("destroy", function() {
          const objectURL = this.settings._objectURL;
          URL.revokeObjectURL(objectURL);
          if (_FileLoader.filesMap[objectURL]) {
            for (const resourceObjectURL of Object.values(
              _FileLoader.filesMap[objectURL]
            )) {
              URL.revokeObjectURL(resourceObjectURL);
            }
          }
          delete _FileLoader.filesMap[objectURL];
        });
      });
    }
    return next();
  }));
  let FileLoader = _FileLoader;
  const _Live2DFactory = class _Live2DFactory {
    /**
     * Registers a Live2DRuntime.
     */
    static registerRuntime(runtime) {
      _Live2DFactory.runtimes.push(runtime);
      _Live2DFactory.runtimes.sort((a, b) => b.version - a.version);
    }
    /**
     * Finds a runtime that matches given source.
     * @param source - Either a settings JSON object or a ModelSettings instance.
     * @return The Live2DRuntime, or undefined if not found.
     */
    static findRuntime(source) {
      for (const runtime of _Live2DFactory.runtimes) {
        if (runtime.test(source)) {
          return runtime;
        }
      }
    }
    /**
     * Sets up a Live2DModel, populating it with all defined resources.
     * @param live2dModel - The Live2DModel instance.
     * @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
     * @param options - Options for the process.
     * @return Promise that resolves when all resources have been loaded, rejects when error occurs.
     */
    static setupLive2DModel(live2dModel, source, options) {
      return __async(this, null, function* () {
        const textureLoaded = new Promise((resolve) => live2dModel.once("textureLoaded", resolve));
        const modelLoaded = new Promise((resolve) => live2dModel.once("modelLoaded", resolve));
        const readyEventEmitted = Promise.all([textureLoaded, modelLoaded]).then(
          () => live2dModel.emit("ready")
        );
        yield runMiddlewares(_Live2DFactory.live2DModelMiddlewares, {
          live2dModel,
          source,
          options: options || {}
        });
        yield readyEventEmitted;
        live2dModel.emit("load");
      });
    }
    /**
     * Loads a Motion and registers the task to {@link motionTasksMap}. The task will be automatically
     * canceled when its owner - the MotionManager instance - has been destroyed.
     * @param motionManager - MotionManager that owns this Motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
     */
    static loadMotion(motionManager, group, index) {
      var _a, _b;
      const handleError = (e) => motionManager.emit("motionLoadError", group, index, e);
      try {
        const definition = (_a = motionManager.definitions[group]) == null ? void 0 : _a[index];
        if (!definition) {
          return Promise.resolve(void 0);
        }
        if (!motionManager.listeners("destroy").includes(_Live2DFactory.releaseTasks)) {
          motionManager.once("destroy", _Live2DFactory.releaseTasks);
        }
        let tasks = _Live2DFactory.motionTasksMap.get(motionManager);
        if (!tasks) {
          tasks = {};
          _Live2DFactory.motionTasksMap.set(motionManager, tasks);
        }
        let taskGroup = tasks[group];
        if (!taskGroup) {
          taskGroup = [];
          tasks[group] = taskGroup;
        }
        const path = motionManager.getMotionFile(definition);
        (_b = taskGroup[index]) != null ? _b : taskGroup[index] = Live2DLoader.load({
          url: path,
          settings: motionManager.settings,
          type: motionManager.motionDataType,
          target: motionManager
        }).then((data) => {
          var _a2;
          const taskGroup2 = (_a2 = _Live2DFactory.motionTasksMap.get(motionManager)) == null ? void 0 : _a2[group];
          if (taskGroup2) {
            delete taskGroup2[index];
          }
          const motion = motionManager.createMotion(data, group, definition);
          motionManager.emit("motionLoaded", group, index, motion);
          return motion;
        }).catch((e) => {
          logger.warn(motionManager.tag, `Failed to load motion: ${path}
`, e);
          handleError(e);
        });
        return taskGroup[index];
      } catch (e) {
        logger.warn(motionManager.tag, `Failed to load motion at "${group}"[${index}]
`, e);
        handleError(e);
      }
      return Promise.resolve(void 0);
    }
    /**
     * Loads an Expression and registers the task to {@link expressionTasksMap}. The task will be automatically
     * canceled when its owner - the ExpressionManager instance - has been destroyed.
     * @param expressionManager - ExpressionManager that owns this Expression.
     * @param index - Index of the Expression.
     * @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
     */
    static loadExpression(expressionManager, index) {
      var _a;
      const handleError = (e) => expressionManager.emit("expressionLoadError", index, e);
      try {
        const definition = expressionManager.definitions[index];
        if (!definition) {
          return Promise.resolve(void 0);
        }
        if (!expressionManager.listeners("destroy").includes(_Live2DFactory.releaseTasks)) {
          expressionManager.once("destroy", _Live2DFactory.releaseTasks);
        }
        let tasks = _Live2DFactory.expressionTasksMap.get(expressionManager);
        if (!tasks) {
          tasks = [];
          _Live2DFactory.expressionTasksMap.set(expressionManager, tasks);
        }
        const path = expressionManager.getExpressionFile(definition);
        (_a = tasks[index]) != null ? _a : tasks[index] = Live2DLoader.load({
          url: path,
          settings: expressionManager.settings,
          type: "json",
          target: expressionManager
        }).then((data) => {
          const tasks2 = _Live2DFactory.expressionTasksMap.get(expressionManager);
          if (tasks2) {
            delete tasks2[index];
          }
          const expression = expressionManager.createExpression(data, definition);
          expressionManager.emit("expressionLoaded", index, expression);
          return expression;
        }).catch((e) => {
          logger.warn(expressionManager.tag, `Failed to load expression: ${path}
`, e);
          handleError(e);
        });
        return tasks[index];
      } catch (e) {
        logger.warn(expressionManager.tag, `Failed to load expression at [${index}]
`, e);
        handleError(e);
      }
      return Promise.resolve(void 0);
    }
    static releaseTasks() {
      if (this instanceof MotionManager) {
        _Live2DFactory.motionTasksMap.delete(this);
      } else {
        _Live2DFactory.expressionTasksMap.delete(this);
      }
    }
  };
  /**
   * All registered runtimes, sorted by versions in descending order.
   */
  __publicField(_Live2DFactory, "runtimes", []);
  __publicField(_Live2DFactory, "urlToJSON", urlToJSON);
  __publicField(_Live2DFactory, "jsonToSettings", jsonToSettings);
  __publicField(_Live2DFactory, "waitUntilReady", waitUntilReady);
  __publicField(_Live2DFactory, "setupOptionals", setupOptionals);
  __publicField(_Live2DFactory, "setupEssentials", setupEssentials);
  __publicField(_Live2DFactory, "createInternalModel", createInternalModel);
  /**
   * Middlewares to run through when setting up a Live2DModel.
   */
  __publicField(_Live2DFactory, "live2DModelMiddlewares", [
    ZipLoader.factory,
    FileLoader.factory,
    urlToJSON,
    jsonToSettings,
    waitUntilReady,
    setupOptionals,
    setupEssentials,
    createInternalModel
  ]);
  /**
   * load tasks of each motion. The structure of each value in this map
   * is the same as respective {@link MotionManager.definitions}.
   */
  __publicField(_Live2DFactory, "motionTasksMap", /* @__PURE__ */ new WeakMap());
  /**
   * Load tasks of each expression.
   */
  __publicField(_Live2DFactory, "expressionTasksMap", /* @__PURE__ */ new WeakMap());
  let Live2DFactory = _Live2DFactory;
  MotionManager.prototype["_loadMotion"] = function(group, index) {
    return Live2DFactory.loadMotion(this, group, index);
  };
  ExpressionManager.prototype["_loadExpression"] = function(index) {
    return Live2DFactory.loadExpression(this, index);
  };
  FileLoader["live2dFactory"] = Live2DFactory;
  ZipLoader["live2dFactory"] = Live2DFactory;
  const _Automator = class _Automator {
    constructor(model, {
      autoUpdate = true,
      autoHitTest = true,
      autoFocus = true,
      autoInteract,
      ticker
    } = {}) {
      __publicField(this, "model");
      __publicField(this, "destroyed", false);
      __publicField(this, "_ticker");
      __publicField(this, "_autoUpdate", false);
      __publicField(this, "_autoHitTest", false);
      __publicField(this, "_autoFocus", false);
      if (!ticker) {
        if (_Automator.defaultTicker) {
          ticker = _Automator.defaultTicker;
        } else if (typeof PIXI !== "undefined") {
          ticker = PIXI.Ticker.shared;
        }
      }
      if (autoInteract !== void 0) {
        autoHitTest = autoInteract;
        autoFocus = autoInteract;
        logger.warn(
          model.tag,
          "options.autoInteract is deprecated since v0.5.0, use autoHitTest and autoFocus instead."
        );
      }
      this.model = model;
      this.ticker = ticker;
      this.autoUpdate = autoUpdate;
      this.autoHitTest = autoHitTest;
      this.autoFocus = autoFocus;
      if (autoHitTest || autoFocus) {
        this.model.eventMode = "static";
      }
    }
    get ticker() {
      return this._ticker;
    }
    set ticker(ticker) {
      var _a;
      if (this._ticker) {
        this._ticker.remove(onTickerUpdate, this);
      }
      this._ticker = ticker;
      if (this._autoUpdate) {
        (_a = this._ticker) == null ? void 0 : _a.add(onTickerUpdate, this);
      }
    }
    /**
     * @see {@link AutomatorOptions.autoUpdate}
     */
    get autoUpdate() {
      return this._autoUpdate;
    }
    set autoUpdate(autoUpdate) {
      var _a;
      if (this.destroyed) {
        return;
      }
      if (autoUpdate) {
        if (this._ticker) {
          this._ticker.add(onTickerUpdate, this);
          this._autoUpdate = true;
        } else {
          logger.warn(
            this.model.tag,
            "No Ticker to be used for automatic updates. Either set option.ticker when creating Live2DModel, or expose PIXI to global scope (window.PIXI = PIXI)."
          );
        }
      } else {
        (_a = this._ticker) == null ? void 0 : _a.remove(onTickerUpdate, this);
        this._autoUpdate = false;
      }
    }
    /**
     * @see {@link AutomatorOptions.autoHitTest}
     */
    get autoHitTest() {
      return this._autoHitTest;
    }
    set autoHitTest(autoHitTest) {
      if (autoHitTest !== this.autoHitTest) {
        if (autoHitTest) {
          this.model.on("pointertap", onTap, this);
        } else {
          this.model.off("pointertap", onTap, this);
        }
        this._autoHitTest = autoHitTest;
      }
    }
    /**
     * @see {@link AutomatorOptions.autoFocus}
     */
    get autoFocus() {
      return this._autoFocus;
    }
    set autoFocus(autoFocus) {
      if (autoFocus !== this.autoFocus) {
        if (autoFocus) {
          this.model.on("globalpointermove", onPointerMove, this);
        } else {
          this.model.off("globalpointermove", onPointerMove, this);
        }
        this._autoFocus = autoFocus;
      }
    }
    /**
     * @see {@link AutomatorOptions.autoInteract}
     */
    get autoInteract() {
      return this._autoHitTest && this._autoFocus;
    }
    set autoInteract(autoInteract) {
      this.autoHitTest = autoInteract;
      this.autoFocus = autoInteract;
    }
    onTickerUpdate() {
      const deltaMS = this.ticker.deltaMS;
      this.model.update(deltaMS);
    }
    onTap(event) {
      this.model.tap(event.global.x, event.global.y);
    }
    onPointerMove(event) {
      this.model.focus(event.global.x, event.global.y);
    }
    destroy() {
      this.autoFocus = false;
      this.autoHitTest = false;
      this.autoUpdate = false;
      this.ticker = void 0;
      this.destroyed = true;
    }
  };
  __publicField(_Automator, "defaultTicker");
  let Automator = _Automator;
  function onTickerUpdate() {
    this.onTickerUpdate();
  }
  function onTap(event) {
    this.onTap(event);
  }
  function onPointerMove(event) {
    this.onPointerMove(event);
  }
  class Live2DTransform extends core.Transform {
  }
  const tempPoint = new core.Point();
  const tempMatrix = new core.Matrix();
  class Live2DModel extends display.Container {
    constructor(options) {
      super();
      /**
       * Tag for logging.
       */
      __publicField(this, "tag", "Live2DModel(uninitialized)");
      /**
       * The internal model. Though typed as non-nullable, it'll be undefined until the "ready" event is emitted.
       */
      __publicField(this, "internalModel");
      /**
       * Pixi textures.
       */
      __publicField(this, "textures", []);
      /** @override */
      __publicField(this, "transform", new Live2DTransform());
      /**
       * The anchor behaves like the one in `PIXI.Sprite`, where `(0, 0)` means the top left
       * and `(1, 1)` means the bottom right.
       */
      __publicField(this, "anchor", new core.ObservablePoint(this.onAnchorChange, this, 0, 0));
      // cast the type because it breaks the casting of Live2DModel
      /**
       * An ID of Gl context that syncs with `renderer.CONTEXT_UID`. Used to check if the GL context has changed.
       */
      __publicField(this, "glContextID", -1);
      /**
       * Elapsed time in milliseconds since created.
       */
      __publicField(this, "elapsedTime", 0);
      /**
       * Elapsed time in milliseconds from last frame to this frame.
       */
      __publicField(this, "deltaTime", 0);
      __publicField(this, "automator");
      this.automator = new Automator(this, options);
      this.once("modelLoaded", () => this.init(options));
    }
    /**
     * Creates a Live2DModel from given source.
     * @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
     * @param options - Options for the creation.
     * @return Promise that resolves with the Live2DModel.
     */
    static from(source, options) {
      const model = new this(options);
      return Live2DFactory.setupLive2DModel(model, source, options).then(() => model);
    }
    /**
     * Synchronous version of `Live2DModel.from()`. This method immediately returns a Live2DModel instance,
     * whose resources have not been loaded. Therefore this model can't be manipulated or rendered
     * until the "load" event has been emitted.
     *
     * ```js
     * // no `await` here as it's not a Promise
     * const model = Live2DModel.fromSync('shizuku.model.json');
     *
     * // these will cause errors!
     * // app.stage.addChild(model);
     * // model.motion('tap_body');
     *
     * model.once('load', () => {
     *     // now it's safe
     *     app.stage.addChild(model);
     *     model.motion('tap_body');
     * });
     * ```
     */
    static fromSync(source, options) {
      const model = new this(options);
      Live2DFactory.setupLive2DModel(model, source, options).then(options == null ? void 0 : options.onLoad).catch(options == null ? void 0 : options.onError);
      return model;
    }
    /**
     * Registers the class of `PIXI.Ticker` for auto updating.
     * @deprecated Use {@link Live2DModelOptions.ticker} instead.
     */
    static registerTicker(tickerClass) {
      Automator["defaultTicker"] = tickerClass.shared;
    }
    // TODO: rename
    /**
     * A handler of the "modelLoaded" event, invoked when the internal model has been loaded.
     */
    init(options) {
      this.tag = `Live2DModel(${this.internalModel.settings.name})`;
    }
    /**
     * A callback that observes {@link anchor}, invoked when the anchor's values have been changed.
     */
    onAnchorChange() {
      this.pivot.set(
        this.anchor.x * this.internalModel.width,
        this.anchor.y * this.internalModel.height
      );
    }
    /**
     * Shorthand to start a motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied. (0: No priority, 1: IDLE, 2:NORMAL, 3:FORCE) (default: 2)
     * ### OPTIONAL: `{name: value, ...}`
     * @param sound - The audio url to file or base64 content
     * @param volume - Volume of the sound (0-1) (default: 0.5)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset the expression to default after the motion is finished (default: true)
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    motion(group, index, priority, {
      sound = void 0,
      volume = VOLUME,
      expression = void 0,
      resetExpression = true,
      crossOrigin,
      onFinish,
      onError
    } = {}) {
      return index === void 0 ? this.internalModel.motionManager.startRandomMotion(group, priority, {
        sound,
        volume,
        expression,
        resetExpression,
        crossOrigin,
        onFinish,
        onError
      }) : this.internalModel.motionManager.startMotion(group, index, priority, {
        sound,
        volume,
        expression,
        resetExpression,
        crossOrigin,
        onFinish,
        onError
      });
    }
    /**
     * Stops all playing motions as well as the sound.
     */
    stopMotions() {
      return this.internalModel.motionManager.stopAllMotions();
    }
    /**
     * Shorthand to start speaking a sound with an expression.
     * @param sound - The audio url to file or base64 content
     * ### OPTIONAL: {name: value, ...}
     * @param volume - Volume of the sound (0-1)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset the expression to default after the motion is finished (default: true)
     * @returns Promise that resolves with true if the sound is playing, false if it's not
     */
    speak(sound, {
      volume = VOLUME,
      expression,
      resetExpression = true,
      crossOrigin,
      onFinish,
      onError
    } = {}) {
      return this.internalModel.motionManager.speak(sound, {
        volume,
        expression,
        resetExpression,
        crossOrigin,
        onFinish,
        onError
      });
    }
    /**
     * Stop current audio playback and lipsync
     */
    stopSpeaking() {
      return this.internalModel.motionManager.stopSpeaking();
    }
    /**
     * Shorthand to set an expression.
     * @param id - Either the index, or the name of the expression. If not presented, a random expression will be set.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    expression(id) {
      if (this.internalModel.motionManager.expressionManager) {
        return id === void 0 ? this.internalModel.motionManager.expressionManager.setRandomExpression() : this.internalModel.motionManager.expressionManager.setExpression(id);
      }
      return Promise.resolve(false);
    }
    /**
     * Updates the focus position. This will not cause the model to immediately look at the position,
     * instead the movement will be interpolated.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @param instant - Should the focus position be instantly applied.
     */
    focus(x, y, instant = false) {
      tempPoint.x = x;
      tempPoint.y = y;
      this.toModelPosition(tempPoint, tempPoint, true);
      const tx = tempPoint.x / this.internalModel.originalWidth * 2 - 1;
      const ty = tempPoint.y / this.internalModel.originalHeight * 2 - 1;
      const radian = Math.atan2(ty, tx);
      this.internalModel.focusController.focus(Math.cos(radian), -Math.sin(radian), instant);
    }
    /**
     * Tap on the model. This will perform a hit-testing, and emit a "hit" event
     * if at least one of the hit areas is hit.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @emits {@link Live2DModelEvents.hit}
     */
    tap(x, y) {
      const hitAreaNames = this.hitTest(x, y);
      if (hitAreaNames.length) {
        logger.log(this.tag, `Hit`, hitAreaNames);
        this.emit("hit", hitAreaNames);
      }
    }
    /**
     * Hit-test on the model.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @return The names of the *hit* hit areas. Can be empty if none is hit.
     */
    hitTest(x, y) {
      tempPoint.x = x;
      tempPoint.y = y;
      this.toModelPosition(tempPoint, tempPoint);
      return this.internalModel.hitTest(tempPoint.x, tempPoint.y);
    }
    /**
     * Calculates the position in the canvas of original, unscaled Live2D model.
     * @param position - A Point in world space.
     * @param result - A Point to store the new value. Defaults to a new Point.
     * @param skipUpdate - True to skip the update transform.
     * @return The Point in model canvas space.
     */
    toModelPosition(position, result = position.clone(), skipUpdate) {
      if (!skipUpdate) {
        this._recursivePostUpdateTransform();
        if (!this.parent) {
          this.parent = this._tempDisplayObjectParent;
          this.displayObjectUpdateTransform();
          this.parent = null;
        } else {
          this.displayObjectUpdateTransform();
        }
      }
      this.transform.worldTransform.applyInverse(position, result);
      this.internalModel.localTransform.applyInverse(result, result);
      return result;
    }
    /**
     * A method required by `PIXI.InteractionManager` to perform hit-testing.
     * @param point - A Point in world space.
     * @return True if the point is inside this model.
     */
    containsPoint(point) {
      return this.getBounds(true).contains(point.x, point.y);
    }
    /** @override */
    _calculateBounds() {
      this._bounds.addFrame(
        this.transform,
        0,
        0,
        this.internalModel.width,
        this.internalModel.height
      );
    }
    /**
     * Updates the model. Note this method just updates the timer,
     * and the actual update will be done right before rendering the model.
     * @param dt - The elapsed time in milliseconds since last frame.
     */
    update(dt) {
      this.deltaTime += dt;
      this.elapsedTime += dt;
    }
    _render(renderer) {
      renderer.batch.reset();
      renderer.geometry.reset();
      renderer.shader.reset();
      renderer.state.reset();
      let shouldUpdateTexture = false;
      if (this.glContextID !== renderer.CONTEXT_UID) {
        this.glContextID = renderer.CONTEXT_UID;
        this.internalModel.updateWebGLContext(renderer.gl, this.glContextID);
        shouldUpdateTexture = true;
      }
      for (let i = 0; i < this.textures.length; i++) {
        const texture = this.textures[i];
        if (!texture.valid) {
          continue;
        }
        if (shouldUpdateTexture || !texture.baseTexture._glTextures[this.glContextID]) {
          renderer.gl.pixelStorei(
            WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL,
            this.internalModel.textureFlipY
          );
          renderer.texture.bind(texture.baseTexture, 0);
        }
        this.internalModel.bindTexture(
          i,
          texture.baseTexture._glTextures[this.glContextID].texture
        );
        texture.baseTexture.touched = renderer.textureGC.count;
      }
      const viewport = renderer.framebuffer.viewport;
      this.internalModel.viewport = [viewport.x, viewport.y, viewport.width, viewport.height];
      if (this.deltaTime) {
        this.internalModel.update(this.deltaTime, this.elapsedTime);
        this.deltaTime = 0;
      }
      const internalTransform = tempMatrix.copyFrom(renderer.globalUniforms.uniforms.projectionMatrix).append(this.worldTransform);
      this.internalModel.updateTransform(internalTransform);
      this.internalModel.draw(renderer.gl);
      renderer.state.reset();
      renderer.texture.reset();
    }
    /**
     * Destroys the model and all related resources. This takes the same options and also
     * behaves the same as `PIXI.Container#destroy`.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param [options.children=false] - if set to true, all the children will have their destroy
     *  method called as well. 'options' will be passed on to those calls.
     * @param [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     */
    destroy(options) {
      this.emit("destroy");
      if (options == null ? void 0 : options.texture) {
        this.textures.forEach((texture) => texture.destroy(options.baseTexture));
      }
      this.automator.destroy();
      this.internalModel.destroy();
      super.destroy(options);
    }
  }
  if (!window.Live2D) {
    throw new Error(
      "Could not find Cubism 2 runtime. This plugin requires live2d.min.js to be loaded."
    );
  }
  const originalUpdateParam = Live2DMotion.prototype.updateParam;
  Live2DMotion.prototype.updateParam = function(model, entry) {
    originalUpdateParam.call(this, model, entry);
    if (entry.isFinished() && this.onFinishHandler) {
      this.onFinishHandler(this);
      delete this.onFinishHandler;
    }
  };
  class Live2DExpression extends AMotion {
    constructor(json) {
      super();
      __publicField(this, "params", []);
      this.setFadeIn(json.fade_in > 0 ? json.fade_in : config.expressionFadingDuration);
      this.setFadeOut(json.fade_out > 0 ? json.fade_out : config.expressionFadingDuration);
      if (Array.isArray(json.params)) {
        json.params.forEach((param) => {
          const calc = param.calc || "add";
          if (calc === "add") {
            const defaultValue = param.def || 0;
            param.val -= defaultValue;
          } else if (calc === "mult") {
            const defaultValue = param.def || 1;
            param.val /= defaultValue;
          }
          this.params.push({
            calc,
            val: param.val,
            id: param.id
          });
        });
      }
    }
    /** @override */
    updateParamExe(model, time, weight, motionQueueEnt) {
      this.params.forEach((param) => {
        model.setParamFloat(param.id, param.val * weight);
      });
    }
  }
  class Cubism2ExpressionManager extends ExpressionManager {
    constructor(settings, options) {
      var _a;
      super(settings, options);
      __publicField(this, "queueManager", new MotionQueueManager());
      __publicField(this, "definitions");
      this.definitions = (_a = this.settings.expressions) != null ? _a : [];
      this.init();
    }
    isFinished() {
      return this.queueManager.isFinished();
    }
    getExpressionIndex(name) {
      return this.definitions.findIndex((def) => def.name === name);
    }
    getExpressionFile(definition) {
      return definition.file;
    }
    createExpression(data, definition) {
      return new Live2DExpression(data);
    }
    _setExpression(motion) {
      return this.queueManager.startMotion(motion);
    }
    stopAllExpressions() {
      this.queueManager.stopAllMotions();
    }
    updateParameters(model, dt) {
      return this.queueManager.updateParam(model);
    }
  }
  class Cubism2MotionManager extends MotionManager {
    constructor(settings, options) {
      super(settings, options);
      __publicField(this, "definitions");
      __publicField(this, "groups", { idle: "idle" });
      __publicField(this, "motionDataType", "arraybuffer");
      __publicField(this, "queueManager", new MotionQueueManager());
      __publicField(this, "lipSyncIds");
      __publicField(this, "expressionManager");
      this.definitions = this.settings.motions;
      this.init(options);
      this.lipSyncIds = ["PARAM_MOUTH_OPEN_Y"];
    }
    init(options) {
      super.init(options);
      if (this.settings.expressions) {
        this.expressionManager = new Cubism2ExpressionManager(this.settings, options);
      }
    }
    isFinished() {
      return this.queueManager.isFinished();
    }
    createMotion(data, group, definition) {
      const motion = Live2DMotion.loadMotion(data);
      const defaultFadingDuration = group === this.groups.idle ? config.idleMotionFadingDuration : config.motionFadingDuration;
      motion.setFadeIn(definition.fade_in > 0 ? definition.fade_in : defaultFadingDuration);
      motion.setFadeOut(definition.fade_out > 0 ? definition.fade_out : defaultFadingDuration);
      return motion;
    }
    getMotionFile(definition) {
      return definition.file;
    }
    getMotionName(definition) {
      return definition.file;
    }
    getSoundFile(definition) {
      return definition.sound;
    }
    _startMotion(motion, onFinish) {
      motion.onFinishHandler = onFinish;
      this.queueManager.stopAllMotions();
      return this.queueManager.startMotion(motion);
    }
    _stopAllMotions() {
      this.queueManager.stopAllMotions();
    }
    updateParameters(model, now) {
      return this.queueManager.updateParam(model);
    }
    destroy() {
      super.destroy();
      this.queueManager = void 0;
    }
  }
  class Live2DEyeBlink {
    constructor(coreModel) {
      __publicField(this, "leftParam");
      __publicField(this, "rightParam");
      __publicField(this, "blinkInterval", 4e3);
      __publicField(this, "closingDuration", 100);
      __publicField(this, "closedDuration", 50);
      __publicField(this, "openingDuration", 150);
      __publicField(this, "eyeState", 0);
      __publicField(this, "eyeParamValue", 1);
      __publicField(this, "closedTimer", 0);
      __publicField(this, "nextBlinkTimeLeft", this.blinkInterval);
      this.coreModel = coreModel;
      this.leftParam = coreModel.getParamIndex("PARAM_EYE_L_OPEN");
      this.rightParam = coreModel.getParamIndex("PARAM_EYE_R_OPEN");
    }
    setEyeParams(value) {
      this.eyeParamValue = clamp(value, 0, 1);
      this.coreModel.setParamFloat(this.leftParam, this.eyeParamValue);
      this.coreModel.setParamFloat(this.rightParam, this.eyeParamValue);
    }
    update(dt) {
      switch (this.eyeState) {
        case 0:
          this.nextBlinkTimeLeft -= dt;
          if (this.nextBlinkTimeLeft < 0) {
            this.eyeState = 1;
            this.nextBlinkTimeLeft = this.blinkInterval + this.closingDuration + this.closedDuration + this.openingDuration + rand(0, 2e3);
          }
          break;
        case 1:
          this.setEyeParams(this.eyeParamValue + dt / this.closingDuration);
          if (this.eyeParamValue <= 0) {
            this.eyeState = 2;
            this.closedTimer = 0;
          }
          break;
        case 2:
          this.closedTimer += dt;
          if (this.closedTimer >= this.closedDuration) {
            this.eyeState = 3;
          }
          break;
        case 3:
          this.setEyeParams(this.eyeParamValue + dt / this.openingDuration);
          if (this.eyeParamValue >= 1) {
            this.eyeState = 0;
          }
      }
    }
  }
  const tempMatrixArray = new Float32Array([
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  ]);
  class Cubism2InternalModel extends InternalModel {
    constructor(coreModel, settings, options) {
      super();
      __publicField(this, "settings");
      __publicField(this, "coreModel");
      __publicField(this, "motionManager");
      __publicField(this, "eyeBlink");
      // parameter indices, cached for better performance
      __publicField(this, "eyeballXParamIndex");
      __publicField(this, "eyeballYParamIndex");
      __publicField(this, "angleXParamIndex");
      __publicField(this, "angleYParamIndex");
      __publicField(this, "angleZParamIndex");
      __publicField(this, "bodyAngleXParamIndex");
      __publicField(this, "breathParamIndex");
      // mouthFormIndex: number;
      __publicField(this, "textureFlipY", true);
      __publicField(this, "lipSync", true);
      /**
       * Number of the drawables in this model.
       */
      __publicField(this, "drawDataCount", 0);
      /**
       * If true, the face culling will always be disabled when drawing the model,
       * regardless of the model's internal flags.
       */
      __publicField(this, "disableCulling", false);
      __publicField(this, "hasDrawn", false);
      this.coreModel = coreModel;
      this.settings = settings;
      this.motionManager = new Cubism2MotionManager(settings, options);
      this.eyeBlink = new Live2DEyeBlink(coreModel);
      this.eyeballXParamIndex = coreModel.getParamIndex("PARAM_EYE_BALL_X");
      this.eyeballYParamIndex = coreModel.getParamIndex("PARAM_EYE_BALL_Y");
      this.angleXParamIndex = coreModel.getParamIndex("PARAM_ANGLE_X");
      this.angleYParamIndex = coreModel.getParamIndex("PARAM_ANGLE_Y");
      this.angleZParamIndex = coreModel.getParamIndex("PARAM_ANGLE_Z");
      this.bodyAngleXParamIndex = coreModel.getParamIndex("PARAM_BODY_ANGLE_X");
      this.breathParamIndex = coreModel.getParamIndex("PARAM_BREATH");
      this.init();
    }
    init() {
      super.init();
      if (this.settings.initParams) {
        this.settings.initParams.forEach(
          ({ id, value }) => this.coreModel.setParamFloat(id, value)
        );
      }
      if (this.settings.initOpacities) {
        this.settings.initOpacities.forEach(
          ({ id, value }) => this.coreModel.setPartsOpacity(id, value)
        );
      }
      this.coreModel.saveParam();
      const arr = this.coreModel.getModelContext()._$aS;
      if (arr == null ? void 0 : arr.length) {
        this.drawDataCount = arr.length;
      }
      let culling = this.coreModel.drawParamWebGL.culling;
      Object.defineProperty(this.coreModel.drawParamWebGL, "culling", {
        set: (v) => culling = v,
        // always return false when disabled
        get: () => this.disableCulling ? false : culling
      });
      const clipManager = this.coreModel.getModelContext().clipManager;
      const originalSetupClip = clipManager.setupClip;
      clipManager.setupClip = (modelContext, drawParam) => {
        originalSetupClip.call(clipManager, modelContext, drawParam);
        drawParam.gl.viewport(...this.viewport);
      };
    }
    getSize() {
      return [this.coreModel.getCanvasWidth(), this.coreModel.getCanvasHeight()];
    }
    getLayout() {
      const layout = {};
      if (this.settings.layout) {
        for (const [key, value] of Object.entries(this.settings.layout)) {
          let commonKey = key;
          if (key === "center_x") {
            commonKey = "centerX";
          } else if (key === "center_y") {
            commonKey = "centerY";
          }
          layout[commonKey] = value;
        }
      }
      return layout;
    }
    updateWebGLContext(gl, glContextID) {
      const drawParamWebGL = this.coreModel.drawParamWebGL;
      drawParamWebGL.firstDraw = true;
      drawParamWebGL.setGL(gl);
      drawParamWebGL.glno = glContextID;
      for (const [key, value] of Object.entries(drawParamWebGL)) {
        if (value instanceof WebGLBuffer) {
          drawParamWebGL[key] = null;
        }
      }
      const clipManager = this.coreModel.getModelContext().clipManager;
      clipManager.curFrameNo = glContextID;
      const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      clipManager.getMaskRenderTexture();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    }
    bindTexture(index, texture) {
      this.coreModel.setTexture(index, texture);
    }
    getHitAreaDefs() {
      var _a;
      return ((_a = this.settings.hitAreas) == null ? void 0 : _a.map((hitArea) => ({
        id: hitArea.id,
        name: hitArea.name,
        index: this.coreModel.getDrawDataIndex(hitArea.id)
      }))) || [];
    }
    getDrawableIDs() {
      const modelContext = this.coreModel.getModelContext();
      const ids = [];
      for (let i = 0; i < this.drawDataCount; i++) {
        const drawData = modelContext.getDrawData(i);
        if (drawData) {
          ids.push(drawData.getDrawDataID().id);
        }
      }
      return ids;
    }
    getDrawableIndex(id) {
      return this.coreModel.getDrawDataIndex(id);
    }
    getDrawableVertices(drawIndex) {
      if (typeof drawIndex === "string") {
        drawIndex = this.coreModel.getDrawDataIndex(drawIndex);
        if (drawIndex === -1)
          throw new TypeError("Unable to find drawable ID: " + drawIndex);
      }
      return this.coreModel.getTransformedPoints(drawIndex).slice();
    }
    hitTest(x, y) {
      if (!this.hasDrawn) {
        logger.warn(
          "Trying to hit-test a Cubism 2 model that has not been rendered yet. The result will always be empty since the draw data is not ready."
        );
      }
      return super.hitTest(x, y);
    }
    update(dt, now) {
      var _a, _b, _c, _d;
      super.update(dt, now);
      const model = this.coreModel;
      this.emit("beforeMotionUpdate");
      const motionUpdated = this.motionManager.update(this.coreModel, now);
      this.emit("afterMotionUpdate");
      model.saveParam();
      (_a = this.motionManager.expressionManager) == null ? void 0 : _a.update(model, now);
      if (!motionUpdated) {
        (_b = this.eyeBlink) == null ? void 0 : _b.update(dt);
      }
      this.updateFocus();
      this.updateNaturalMovements(dt, now);
      if (this.lipSync && this.motionManager.currentAudio) {
        let value = this.motionManager.mouthSync();
        let min_ = 0;
        const max_ = 1;
        const bias_weight = 1.2;
        const bias_power = 0.7;
        if (value > 0) {
          min_ = 0.4;
        }
        value = Math.pow(value, bias_power);
        value = clamp(value * bias_weight, min_, max_);
        for (let i = 0; i < this.motionManager.lipSyncIds.length; ++i) {
          this.coreModel.setParamFloat(
            this.coreModel.getParamIndex(this.motionManager.lipSyncIds[i]),
            value
          );
        }
      }
      (_c = this.physics) == null ? void 0 : _c.update(now);
      (_d = this.pose) == null ? void 0 : _d.update(dt);
      this.emit("beforeModelUpdate");
      model.update();
      model.loadParam();
    }
    updateFocus() {
      this.coreModel.addToParamFloat(this.eyeballXParamIndex, this.focusController.x);
      this.coreModel.addToParamFloat(this.eyeballYParamIndex, this.focusController.y);
      this.coreModel.addToParamFloat(this.angleXParamIndex, this.focusController.x * 30);
      this.coreModel.addToParamFloat(this.angleYParamIndex, this.focusController.y * 30);
      this.coreModel.addToParamFloat(
        this.angleZParamIndex,
        this.focusController.x * this.focusController.y * -30
      );
      this.coreModel.addToParamFloat(this.bodyAngleXParamIndex, this.focusController.x * 10);
    }
    updateNaturalMovements(dt, now) {
      const t = now / 1e3 * 2 * Math.PI;
      this.coreModel.addToParamFloat(this.angleXParamIndex, 15 * Math.sin(t / 6.5345) * 0.5);
      this.coreModel.addToParamFloat(this.angleYParamIndex, 8 * Math.sin(t / 3.5345) * 0.5);
      this.coreModel.addToParamFloat(this.angleZParamIndex, 10 * Math.sin(t / 5.5345) * 0.5);
      this.coreModel.addToParamFloat(this.bodyAngleXParamIndex, 4 * Math.sin(t / 15.5345) * 0.5);
      this.coreModel.setParamFloat(this.breathParamIndex, 0.5 + 0.5 * Math.sin(t / 3.2345));
    }
    draw(gl) {
      const disableCulling = this.disableCulling;
      if (gl.getParameter(gl.FRAMEBUFFER_BINDING)) {
        this.disableCulling = true;
      }
      const matrix = this.drawingMatrix;
      tempMatrixArray[0] = matrix.a;
      tempMatrixArray[1] = matrix.b;
      tempMatrixArray[4] = matrix.c;
      tempMatrixArray[5] = matrix.d;
      tempMatrixArray[12] = matrix.tx;
      tempMatrixArray[13] = matrix.ty;
      this.coreModel.setMatrix(tempMatrixArray);
      this.coreModel.draw();
      this.hasDrawn = true;
      this.disableCulling = disableCulling;
    }
    destroy() {
      super.destroy();
      this.coreModel = void 0;
    }
  }
  class Cubism2ModelSettings extends ModelSettings {
    constructor(json) {
      super(json);
      // files
      __publicField(this, "moc");
      __publicField(this, "textures");
      // metadata
      __publicField(this, "layout");
      __publicField(this, "hitAreas");
      __publicField(this, "initParams");
      __publicField(this, "initOpacities");
      // motions
      __publicField(this, "expressions");
      __publicField(this, "motions", {});
      if (!Cubism2ModelSettings.isValidJSON(json)) {
        throw new TypeError("Invalid JSON.");
      }
      this.moc = json.model;
      copyArray("string", json, this, "textures", "textures");
      this.copy(json);
    }
    /**
     * Checks if a JSON object is valid model settings.
     * @param json
     */
    static isValidJSON(json) {
      var _a;
      return !!json && typeof json.model === "string" && ((_a = json.textures) == null ? void 0 : _a.length) > 0 && // textures must be an array of strings
      json.textures.every((item) => typeof item === "string");
    }
    /**
     * Validates and copies *optional* properties from raw JSON.
     */
    copy(json) {
      copyProperty("string", json, this, "name", "name");
      copyProperty("string", json, this, "pose", "pose");
      copyProperty("string", json, this, "physics", "physics");
      copyProperty("object", json, this, "layout", "layout");
      copyProperty("object", json, this, "motions", "motions");
      copyArray("object", json, this, "hit_areas", "hitAreas");
      copyArray("object", json, this, "expressions", "expressions");
      copyArray("object", json, this, "init_params", "initParams");
      copyArray("object", json, this, "init_opacities", "initOpacities");
    }
    replaceFiles(replace) {
      super.replaceFiles(replace);
      for (const [group, motions] of Object.entries(this.motions)) {
        for (let i = 0; i < motions.length; i++) {
          motions[i].file = replace(motions[i].file, `motions.${group}[${i}].file`);
          if (motions[i].sound !== void 0) {
            motions[i].sound = replace(motions[i].sound, `motions.${group}[${i}].sound`);
          }
        }
      }
      if (this.expressions) {
        for (let i = 0; i < this.expressions.length; i++) {
          this.expressions[i].file = replace(
            this.expressions[i].file,
            `expressions[${i}].file`
          );
        }
      }
    }
  }
  const SRC_TYPE_MAP = {
    x: PhysicsHair.Src.SRC_TO_X,
    y: PhysicsHair.Src.SRC_TO_Y,
    angle: PhysicsHair.Src.SRC_TO_G_ANGLE
  };
  const TARGET_TYPE_MAP = {
    x: PhysicsHair.Src.SRC_TO_X,
    y: PhysicsHair.Src.SRC_TO_Y,
    angle: PhysicsHair.Src.SRC_TO_G_ANGLE
  };
  class Live2DPhysics {
    constructor(coreModel, json) {
      __publicField(this, "physicsHairs", []);
      this.coreModel = coreModel;
      if (json.physics_hair) {
        this.physicsHairs = json.physics_hair.map((definition) => {
          const physicsHair = new PhysicsHair();
          physicsHair.setup(
            definition.setup.length,
            definition.setup.regist,
            definition.setup.mass
          );
          definition.src.forEach(({ id, ptype, scale, weight }) => {
            const type = SRC_TYPE_MAP[ptype];
            if (type) {
              physicsHair.addSrcParam(type, id, scale, weight);
            }
          });
          definition.targets.forEach(({ id, ptype, scale, weight }) => {
            const type = TARGET_TYPE_MAP[ptype];
            if (type) {
              physicsHair.addTargetParam(type, id, scale, weight);
            }
          });
          return physicsHair;
        });
      }
    }
    update(elapsed) {
      this.physicsHairs.forEach((physicsHair) => physicsHair.update(this.coreModel, elapsed));
    }
  }
  class Live2DPartsParam {
    constructor(id) {
      __publicField(this, "paramIndex", -1);
      __publicField(this, "partsIndex", -1);
      __publicField(this, "link", []);
      this.id = id;
    }
    initIndex(model) {
      this.paramIndex = model.getParamIndex("VISIBLE:" + this.id);
      this.partsIndex = model.getPartsDataIndex(PartsDataID.getID(this.id));
      model.setParamFloat(this.paramIndex, 1);
    }
  }
  class Live2DPose {
    constructor(coreModel, json) {
      __publicField(this, "opacityAnimDuration", 500);
      __publicField(this, "partsGroups", []);
      this.coreModel = coreModel;
      if (json.parts_visible) {
        this.partsGroups = json.parts_visible.map(
          ({ group }) => group.map(({ id, link }) => {
            const parts = new Live2DPartsParam(id);
            if (link) {
              parts.link = link.map((l) => new Live2DPartsParam(l));
            }
            return parts;
          })
        );
        this.init();
      }
    }
    init() {
      this.partsGroups.forEach((group) => {
        group.forEach((parts) => {
          parts.initIndex(this.coreModel);
          if (parts.paramIndex >= 0) {
            const visible = this.coreModel.getParamFloat(parts.paramIndex) !== 0;
            this.coreModel.setPartsOpacity(parts.partsIndex, visible ? 1 : 0);
            this.coreModel.setParamFloat(parts.paramIndex, visible ? 1 : 0);
            if (parts.link.length > 0) {
              parts.link.forEach((p) => p.initIndex(this.coreModel));
            }
          }
        });
      });
    }
    normalizePartsOpacityGroup(partsGroup, dt) {
      const model = this.coreModel;
      const phi = 0.5;
      const maxBackOpacity = 0.15;
      let visibleOpacity = 1;
      let visibleIndex = partsGroup.findIndex(
        ({ paramIndex, partsIndex }) => partsIndex >= 0 && model.getParamFloat(paramIndex) !== 0
      );
      if (visibleIndex >= 0) {
        const originalOpacity = model.getPartsOpacity(partsGroup[visibleIndex].partsIndex);
        visibleOpacity = clamp(originalOpacity + dt / this.opacityAnimDuration, 0, 1);
      } else {
        visibleIndex = 0;
        visibleOpacity = 1;
      }
      partsGroup.forEach(({ partsIndex }, index) => {
        if (partsIndex >= 0) {
          if (visibleIndex == index) {
            model.setPartsOpacity(partsIndex, visibleOpacity);
          } else {
            let opacity = model.getPartsOpacity(partsIndex);
            let a1;
            if (visibleOpacity < phi) {
              a1 = visibleOpacity * (phi - 1) / phi + 1;
            } else {
              a1 = (1 - visibleOpacity) * phi / (1 - phi);
            }
            const backOp = (1 - a1) * (1 - visibleOpacity);
            if (backOp > maxBackOpacity) {
              a1 = 1 - maxBackOpacity / (1 - visibleOpacity);
            }
            if (opacity > a1) {
              opacity = a1;
            }
            model.setPartsOpacity(partsIndex, opacity);
          }
        }
      });
    }
    copyOpacity(partsGroup) {
      const model = this.coreModel;
      partsGroup.forEach(({ partsIndex, link }) => {
        if (partsIndex >= 0 && link) {
          const opacity = model.getPartsOpacity(partsIndex);
          link.forEach(({ partsIndex: partsIndex2 }) => {
            if (partsIndex2 >= 0) {
              model.setPartsOpacity(partsIndex2, opacity);
            }
          });
        }
      });
    }
    update(dt) {
      this.partsGroups.forEach((partGroup) => {
        this.normalizePartsOpacityGroup(partGroup, dt);
        this.copyOpacity(partGroup);
      });
    }
  }
  Live2DFactory.registerRuntime({
    version: 2,
    test(source) {
      return source instanceof Cubism2ModelSettings || Cubism2ModelSettings.isValidJSON(source);
    },
    ready() {
      return Promise.resolve();
    },
    isValidMoc(modelData) {
      if (modelData.byteLength < 3) {
        return false;
      }
      const view = new Int8Array(modelData, 0, 3);
      return String.fromCharCode(...view) === "moc";
    },
    createModelSettings(json) {
      return new Cubism2ModelSettings(json);
    },
    createCoreModel(data) {
      const model = Live2DModelWebGL.loadModel(data);
      const error = Live2D.getError();
      if (error)
        throw error;
      return model;
    },
    createInternalModel(coreModel, settings, options) {
      return new Cubism2InternalModel(coreModel, settings, options);
    },
    createPose(coreModel, data) {
      return new Live2DPose(coreModel, data);
    },
    createPhysics(coreModel, data) {
      return new Live2DPhysics(coreModel, data);
    }
  });
  exports2.Cubism2ExpressionManager = Cubism2ExpressionManager;
  exports2.Cubism2InternalModel = Cubism2InternalModel;
  exports2.Cubism2ModelSettings = Cubism2ModelSettings;
  exports2.Cubism2MotionManager = Cubism2MotionManager;
  exports2.ExpressionManager = ExpressionManager;
  exports2.FileLoader = FileLoader;
  exports2.FocusController = FocusController;
  exports2.InternalModel = InternalModel;
  exports2.LOGICAL_HEIGHT = LOGICAL_HEIGHT;
  exports2.LOGICAL_WIDTH = LOGICAL_WIDTH;
  exports2.Live2DExpression = Live2DExpression;
  exports2.Live2DEyeBlink = Live2DEyeBlink;
  exports2.Live2DFactory = Live2DFactory;
  exports2.Live2DLoader = Live2DLoader;
  exports2.Live2DModel = Live2DModel;
  exports2.Live2DPhysics = Live2DPhysics;
  exports2.Live2DPose = Live2DPose;
  exports2.Live2DTransform = Live2DTransform;
  exports2.ModelSettings = ModelSettings;
  exports2.MotionManager = MotionManager;
  exports2.MotionPreloadStrategy = MotionPreloadStrategy;
  exports2.MotionPriority = MotionPriority;
  exports2.MotionState = MotionState;
  exports2.SoundManager = SoundManager;
  exports2.VERSION = VERSION;
  exports2.VOLUME = VOLUME;
  exports2.XHRLoader = XHRLoader;
  exports2.ZipLoader = ZipLoader;
  exports2.applyMixins = applyMixins;
  exports2.clamp = clamp;
  exports2.config = config;
  exports2.copyArray = copyArray;
  exports2.copyProperty = copyProperty;
  exports2.folderName = folderName;
  exports2.logger = logger;
  exports2.rand = rand;
  exports2.remove = remove;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
