var __pow = Math.pow;
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
import { EventEmitter, url } from "@pixi/utils";
import { Matrix, Transform, Point, ObservablePoint } from "@pixi/math";
import { Texture } from "@pixi/core";
import { Container } from "@pixi/display";
const LOGICAL_WIDTH = 2;
const LOGICAL_HEIGHT = 2;
var CubismConfig;
((CubismConfig2) => {
  CubismConfig2.supportMoreMaskDivisions = true;
  CubismConfig2.setOpacityFromMotion = false;
})(CubismConfig || (CubismConfig = {}));
var config;
((config2) => {
  config2.LOG_LEVEL_VERBOSE = 0;
  config2.LOG_LEVEL_WARNING = 1;
  config2.LOG_LEVEL_ERROR = 2;
  config2.LOG_LEVEL_NONE = 999;
  config2.logLevel = config2.LOG_LEVEL_WARNING;
  config2.sound = true;
  config2.motionSync = true;
  config2.motionFadingDuration = 500;
  config2.idleMotionFadingDuration = 2e3;
  config2.expressionFadingDuration = 500;
  config2.preserveExpressionOnMotion = true;
  config2.cubism4 = CubismConfig;
})(config || (config = {}));
const VERSION = "0.4.0";
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
        Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
      }
    });
  });
}
function folderName(url2) {
  let lastSlashIndex = url2.lastIndexOf("/");
  if (lastSlashIndex != -1) {
    url2 = url2.slice(0, lastSlashIndex);
  }
  lastSlashIndex = url2.lastIndexOf("/");
  if (lastSlashIndex !== -1) {
    url2 = url2.slice(lastSlashIndex + 1);
  }
  return url2;
}
function remove(array, item) {
  const index = array.indexOf(item);
  if (index !== -1) {
    array.splice(index, 1);
  }
}
class ExpressionManager extends EventEmitter {
  constructor(settings, options) {
    super();
    this.expressions = [];
    this.reserveExpressionIndex = -1;
    this.destroyed = false;
    this.settings = settings;
    this.tag = `ExpressionManager(${settings.name})`;
  }
  init() {
    this.defaultExpression = this.createExpression({}, void 0);
    this.currentExpression = this.defaultExpression;
    this.stopAllExpressions();
  }
  loadExpression(index) {
    return __async(this, null, function* () {
      if (!this.definitions[index]) {
        logger.warn(this.tag, `Undefined expression at [${index}]`);
        return void 0;
      }
      if (this.expressions[index] === null) {
        logger.warn(this.tag, `Cannot set expression at [${index}] because it's already failed in loading.`);
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
  _loadExpression(index) {
    throw new Error("Not implemented.");
  }
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
  resetExpression() {
    this._setExpression(this.defaultExpression);
  }
  restoreExpression() {
    this._setExpression(this.currentExpression);
  }
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
  update(model, now) {
    if (!this.isFinished()) {
      return this.updateParameters(model, now);
    }
    return false;
  }
  destroy() {
    this.destroyed = true;
    this.emit("destroy");
    const self = this;
    self.definitions = void 0;
    self.expressions = void 0;
  }
}
const EPSILON = 0.01;
const MAX_SPEED = 40 / 7.5;
const ACCELERATION_TIME = 1 / (0.15 * 1e3);
class FocusController {
  constructor() {
    this.targetX = 0;
    this.targetY = 0;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
  }
  focus(x, y, instant = false) {
    this.targetX = clamp(x, -1, 1);
    this.targetY = clamp(y, -1, 1);
    if (instant) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }
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
  constructor(json) {
    this.json = json;
    let url2 = json.url;
    if (typeof url2 !== "string") {
      throw new TypeError("The `url` field in settings JSON must be defined as a string.");
    }
    this.url = url2;
    this.name = folderName(this.url);
  }
  resolveURL(path) {
    return url.resolve(this.url, path);
  }
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
  getDefinedFiles() {
    const files = [];
    this.replaceFiles((file) => {
      files.push(file);
      return file;
    });
    return files;
  }
  validateFiles(files) {
    const assertFileExists = (expectedFile, shouldThrow) => {
      const actualPath = this.resolveURL(expectedFile);
      if (!files.includes(actualPath)) {
        if (shouldThrow) {
          throw new Error(`File "${expectedFile}" is defined in settings, but doesn't exist in given files`);
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
    this.debug = false;
    this.currentPriority = 0;
    this.reservePriority = 0;
  }
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
        logger.log(this.tag, `Cannot start idle motion because another motion is playing.`, this.dump(group, index));
        return false;
      }
      if (this.reservedIdleGroup !== void 0) {
        logger.log(this.tag, `Cannot start idle motion because another idle motion has reserved.`, this.dump(group, index));
        return false;
      }
      this.setReservedIdle(group, index);
    } else {
      if (priority < 3) {
        if (priority <= this.currentPriority) {
          logger.log(this.tag, "Cannot start motion because another motion is playing as an equivalent or higher priority.", this.dump(group, index));
          return false;
        }
        if (priority <= this.reservePriority) {
          logger.log(this.tag, "Cannot start motion because another motion has reserved as an equivalent or higher priority.", this.dump(group, index));
          return false;
        }
      }
      this.setReserved(group, index, priority);
    }
    return true;
  }
  start(motion, group, index, priority) {
    if (priority === 1) {
      this.setReservedIdle(void 0, void 0);
      if (this.currentPriority !== 0) {
        logger.log(this.tag, "Cannot start idle motion because another motion is playing.", this.dump(group, index));
        return false;
      }
    } else {
      if (group !== this.reservedGroup || index !== this.reservedIndex) {
        logger.log(this.tag, "Cannot start motion because another motion has taken the place.", this.dump(group, index));
        return false;
      }
      this.setReserved(void 0, void 0, 0);
    }
    if (!motion) {
      return false;
    }
    this.setCurrent(group, index, priority);
    return true;
  }
  complete() {
    this.setCurrent(void 0, void 0, 0);
  }
  setCurrent(group, index, priority) {
    this.currentPriority = priority;
    this.currentGroup = group;
    this.currentIndex = index;
  }
  setReserved(group, index, priority) {
    this.reservePriority = priority;
    this.reservedGroup = group;
    this.reservedIndex = index;
  }
  setReservedIdle(group, index) {
    this.reservedIdleGroup = group;
    this.reservedIdleIndex = index;
  }
  isActive(group, index) {
    return group === this.currentGroup && index === this.currentIndex || group === this.reservedGroup && index === this.reservedIndex || group === this.reservedIdleGroup && index === this.reservedIdleIndex;
  }
  reset() {
    this.setCurrent(void 0, void 0, 0);
    this.setReserved(void 0, void 0, 0);
    this.setReservedIdle(void 0, void 0);
  }
  shouldRequestIdleMotion() {
    return this.currentGroup === void 0 && this.reservedIdleGroup === void 0;
  }
  shouldOverrideExpression() {
    return !config.preserveExpressionOnMotion && this.currentPriority > 1;
  }
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
const VOLUME = 0.9;
class SoundManager {
  static get volume() {
    return this._volume;
  }
  static set volume(value) {
    this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
    this.audios.forEach((audio) => audio.volume = this._volume);
  }
  static add(file, onFinish, onError) {
    const audio = new Audio(file);
    audio.volume = this._volume;
    audio.preload = "auto";
    audio.autoplay = true;
    audio.addEventListener("ended", () => {
      this.dispose(audio);
      onFinish == null ? void 0 : onFinish();
    });
    audio.addEventListener("error", (e) => {
      this.dispose(audio);
      logger.warn(TAG$2, `Error occurred on "${file}"`, e.error);
      onError == null ? void 0 : onError(e.error);
    });
    this.audios.push(audio);
    return audio;
  }
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
        audio.addEventListener("canplaythrough", resolve);
      }
    });
  }
  static addContext(audio) {
    const context = new AudioContext();
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
    this.analysers.push(analyser);
    return analyser;
  }
  static analyze(analyser) {
    if (analyser != void 0) {
      let pcmData = new Float32Array(analyser.fftSize);
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
  static dispose(audio) {
    audio.pause();
    audio.removeAttribute("src");
    remove(this.audios, audio);
  }
  static destroy() {
    for (let i = this.contexts.length - 1; i >= 0; i--) {
      this.contexts[i].close();
    }
    for (let i = this.audios.length - 1; i >= 0; i--) {
      this.dispose(this.audios[i]);
    }
  }
}
SoundManager.audios = [];
SoundManager.analysers = [];
SoundManager.contexts = [];
SoundManager._volume = VOLUME;
var MotionPreloadStrategy = /* @__PURE__ */ ((MotionPreloadStrategy2) => {
  MotionPreloadStrategy2["ALL"] = "ALL";
  MotionPreloadStrategy2["IDLE"] = "IDLE";
  MotionPreloadStrategy2["NONE"] = "NONE";
  return MotionPreloadStrategy2;
})(MotionPreloadStrategy || {});
class MotionManager extends EventEmitter {
  constructor(settings, options) {
    super();
    this.motionGroups = {};
    this.state = new MotionState();
    this.playing = false;
    this.destroyed = false;
    this.settings = settings;
    this.tag = `MotionManager(${settings.name})`;
    this.state.tag = this.tag;
  }
  init(options) {
    if (options == null ? void 0 : options.idleMotionGroup) {
      this.groups.idle = options.idleMotionGroup;
    }
    this.setupMotions(options);
    this.stopAllMotions();
  }
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
  loadMotion(group, index) {
    return __async(this, null, function* () {
      var _a;
      if (!((_a = this.definitions[group]) == null ? void 0 : _a[index])) {
        logger.warn(this.tag, `Undefined motion at "${group}"[${index}]`);
        return void 0;
      }
      if (this.motionGroups[group][index] === null) {
        logger.warn(this.tag, `Cannot start motion at "${group}"[${index}] because it's already failed in loading.`);
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
  _loadMotion(group, index) {
    throw new Error("Not implemented.");
  }
  startMotion(_0, _1) {
    return __async(this, arguments, function* (group, index, priority = MotionPriority.NORMAL, sound) {
      var _a;
      if (this.currentAudio) {
        if (!this.currentAudio.ended) {
          return false;
        }
      }
      if (!this.state.reserve(group, index, priority)) {
        return false;
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
      if (config.sound) {
        const isUrlPath = sound && sound.startsWith("http");
        const isBase64Content = sound && sound.startsWith("data:audio/wav;base64");
        const soundURL = this.getSoundFile(definition);
        let file = soundURL;
        if (soundURL) {
          file = this.settings.resolveURL(soundURL) + "?cache-buster=" + new Date().getTime();
        }
        if (isUrlPath || isBase64Content) {
          file = sound;
        }
        if (file) {
          try {
            audio = SoundManager.add(file);
            this.currentAudio = audio;
            context = SoundManager.addContext(this.currentAudio);
            this.currentContext = context;
            analyzer = SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
            this.currentAnalyzer = analyzer;
          } catch (e) {
            logger.warn(this.tag, "Failed to create audio", soundURL, e);
          }
        }
      }
      const motion = yield this.loadMotion(group, index);
      if (audio) {
        const readyToPlay = SoundManager.play(audio).catch((e) => logger.warn(this.tag, "Failed to play audio", audio.src, e));
        if (config.motionSync) {
          yield readyToPlay;
        }
      }
      if (!this.state.start(motion, group, index, priority)) {
        if (audio) {
          SoundManager.dispose(audio);
          this.currentAudio = void 0;
        }
        return false;
      }
      logger.log(this.tag, "Start motion:", this.getMotionName(definition));
      this.emit("motionStart", group, index, audio);
      if (this.state.shouldOverrideExpression()) {
        this.expressionManager && this.expressionManager.resetExpression();
      }
      this.playing = true;
      this._startMotion(motion);
      return true;
    });
  }
  startRandomMotion(group, priority, sound) {
    return __async(this, null, function* () {
      const groupDefs = this.definitions[group];
      if (groupDefs == null ? void 0 : groupDefs.length) {
        const availableIndices = [];
        for (let i = 0; i < groupDefs.length; i++) {
          if (this.motionGroups[group][i] !== null && !this.state.isActive(group, i)) {
            availableIndices.push(i);
          }
        }
        if (availableIndices.length) {
          const index = Math.floor(Math.random() * availableIndices.length);
          return this.startMotion(group, availableIndices[index], priority, sound);
        }
      }
      return false;
    });
  }
  stopAllMotions() {
    this._stopAllMotions();
    this.state.reset();
    if (this.currentAudio) {
      SoundManager.dispose(this.currentAudio);
      this.currentAudio = void 0;
    }
  }
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
  mouthSync() {
    if (this.currentAnalyzer) {
      return SoundManager.analyze(this.currentAnalyzer);
    } else {
      return 0;
    }
  }
  destroy() {
    var _a;
    this.destroyed = true;
    this.emit("destroy");
    this.stopAllMotions();
    (_a = this.expressionManager) == null ? void 0 : _a.destroy();
    const self = this;
    self.definitions = void 0;
    self.motionGroups = void 0;
  }
}
const tempBounds = { x: 0, y: 0, width: 0, height: 0 };
class InternalModel extends EventEmitter {
  constructor() {
    super(...arguments);
    this.focusController = new FocusController();
    this.originalWidth = 0;
    this.originalHeight = 0;
    this.width = 0;
    this.height = 0;
    this.localTransform = new Matrix();
    this.drawingMatrix = new Matrix();
    this.hitAreas = {};
    this.textureFlipY = false;
    this.viewport = [0, 0, 0, 0];
    this.destroyed = false;
  }
  init() {
    this.setupLayout();
    this.setupHitAreas();
  }
  setupLayout() {
    const self = this;
    const size = this.getSize();
    self.originalWidth = size[0];
    self.originalHeight = size[1];
    const layout = Object.assign({
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT
    }, this.getLayout());
    this.localTransform.scale(layout.width / LOGICAL_WIDTH, layout.height / LOGICAL_HEIGHT);
    self.width = this.originalWidth * this.localTransform.a;
    self.height = this.originalHeight * this.localTransform.d;
    const offsetX = layout.x !== void 0 && layout.x - layout.width / 2 || layout.centerX !== void 0 && layout.centerX || layout.left !== void 0 && layout.left - layout.width / 2 || layout.right !== void 0 && layout.right + layout.width / 2 || 0;
    const offsetY = layout.y !== void 0 && layout.y - layout.height / 2 || layout.centerY !== void 0 && layout.centerY || layout.top !== void 0 && layout.top - layout.height / 2 || layout.bottom !== void 0 && layout.bottom + layout.height / 2 || 0;
    this.localTransform.translate(this.width * offsetX, -this.height * offsetY);
  }
  setupHitAreas() {
    const definitions = this.getHitAreaDefs().filter((hitArea) => hitArea.index >= 0);
    for (const def of definitions) {
      this.hitAreas[def.name] = def;
    }
  }
  hitTest(x, y) {
    return Object.keys(this.hitAreas).filter((hitAreaName) => this.isHit(hitAreaName, x, y));
  }
  isHit(hitAreaName, x, y) {
    if (!this.hitAreas[hitAreaName]) {
      return false;
    }
    const drawIndex = this.hitAreas[hitAreaName].index;
    const bounds = this.getDrawableBounds(drawIndex, tempBounds);
    return bounds.x <= x && x <= bounds.x + bounds.width && bounds.y <= y && y <= bounds.y + bounds.height;
  }
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
  updateTransform(transform) {
    this.drawingMatrix.copyFrom(transform).append(this.localTransform);
  }
  update(dt, now) {
    this.focusController.update(dt);
  }
  destroy() {
    this.destroyed = true;
    this.emit("destroy");
    this.motionManager.destroy();
    this.motionManager = void 0;
  }
}
const TAG$1 = "XHRLoader";
class NetworkError extends Error {
  constructor(message, url2, status, aborted = false) {
    super(message);
    this.url = url2;
    this.status = status;
    this.aborted = aborted;
  }
}
const _XHRLoader = class {
  static createXHR(target, url2, type, onload, onerror) {
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
    xhr.open("GET", url2);
    xhr.responseType = type;
    xhr.onload = () => {
      if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
        onload(xhr.response);
      } else {
        xhr.onerror();
      }
    };
    xhr.onerror = () => {
      logger.warn(TAG$1, `Failed to load resource as ${xhr.responseType} (Status ${xhr.status}): ${url2}`);
      onerror(new NetworkError("Network error.", url2, xhr.status));
    };
    xhr.onabort = () => onerror(new NetworkError("Aborted.", url2, xhr.status, true));
    xhr.onloadend = () => {
      var _a;
      _XHRLoader.allXhrSet.delete(xhr);
      if (target) {
        (_a = _XHRLoader.xhrMap.get(target)) == null ? void 0 : _a.delete(xhr);
      }
    };
    return xhr;
  }
  static cancelXHRs() {
    var _a;
    (_a = _XHRLoader.xhrMap.get(this)) == null ? void 0 : _a.forEach((xhr) => {
      xhr.abort();
      _XHRLoader.allXhrSet.delete(xhr);
    });
    _XHRLoader.xhrMap.delete(this);
  }
  static release() {
    _XHRLoader.allXhrSet.forEach((xhr) => xhr.abort());
    _XHRLoader.allXhrSet.clear();
    _XHRLoader.xhrMap = /* @__PURE__ */ new WeakMap();
  }
};
let XHRLoader = _XHRLoader;
XHRLoader.xhrMap = /* @__PURE__ */ new WeakMap();
XHRLoader.allXhrSet = /* @__PURE__ */ new Set();
XHRLoader.loader = (context, next) => {
  return new Promise((resolve, reject) => {
    const xhr = _XHRLoader.createXHR(context.target, context.settings ? context.settings.resolveURL(context.url) : context.url, context.type, (data) => {
      context.result = data;
      resolve();
    }, reject);
    xhr.send();
  });
};
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
  static load(context) {
    return runMiddlewares(this.middlewares, context).then(() => context.result);
  }
}
Live2DLoader.middlewares = [XHRLoader.loader];
function createTexture(url2, options = {}) {
  var _a;
  const textureOptions = { resourceOptions: { crossorigin: options.crossOrigin } };
  if (Texture.fromURL) {
    return Texture.fromURL(url2, textureOptions).catch((e) => {
      if (e instanceof Error) {
        throw e;
      }
      const err = new Error("Texture loading error");
      err.event = e;
      throw err;
    });
  }
  textureOptions.resourceOptions.autoLoad = false;
  const texture = Texture.from(url2, textureOptions);
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
const urlToJSON = (context, next) => __async(void 0, null, function* () {
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
const jsonToSettings = (context, next) => __async(void 0, null, function* () {
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
const setupOptionals = (context, next) => __async(void 0, null, function* () {
  yield next();
  const internalModel = context.internalModel;
  if (internalModel) {
    const settings = context.settings;
    const runtime = Live2DFactory.findRuntime(settings);
    if (runtime) {
      const tasks = [];
      if (settings.pose) {
        tasks.push(Live2DLoader.load({
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
        }));
      }
      if (settings.physics) {
        tasks.push(Live2DLoader.load({
          settings,
          url: settings.physics,
          type: "json",
          target: internalModel
        }).then((data) => {
          internalModel.physics = runtime.createPhysics(internalModel.coreModel, data);
          context.live2dModel.emit("physicsLoaded", internalModel.physics);
        }).catch((e) => {
          context.live2dModel.emit("physicsLoadError", e);
          logger.warn(TAG, "Failed to load physics.", e);
        }));
      }
      if (tasks.length) {
        yield Promise.all(tasks);
      }
    }
  }
});
const setupEssentials = (context, next) => __async(void 0, null, function* () {
  if (context.settings) {
    const live2DModel = context.live2dModel;
    const textureLoadings = context.settings.textures.map((tex) => {
      const url2 = context.settings.resolveURL(tex);
      return createTexture(url2, { crossOrigin: context.options.crossOrigin });
    });
    yield next();
    if (context.internalModel) {
      live2DModel.internalModel = context.internalModel;
      live2DModel.emit("modelLoaded", context.internalModel);
    } else {
      throw new TypeError("Missing internal model.");
    }
    live2DModel.textures = yield Promise.all(textureLoadings);
    live2DModel.emit("textureLoaded", live2DModel.textures);
  } else {
    throw new TypeError("Missing settings.");
  }
});
const createInternalModel = (context, next) => __async(void 0, null, function* () {
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
const _Live2DFactory = class {
  static registerRuntime(runtime) {
    _Live2DFactory.runtimes.push(runtime);
    _Live2DFactory.runtimes.sort((a, b) => b.version - a.version);
  }
  static findRuntime(source) {
    for (const runtime of _Live2DFactory.runtimes) {
      if (runtime.test(source)) {
        return runtime;
      }
    }
  }
  static setupLive2DModel(live2dModel, source, options) {
    return __async(this, null, function* () {
      const textureLoaded = new Promise((resolve) => live2dModel.once("textureLoaded", resolve));
      const modelLoaded = new Promise((resolve) => live2dModel.once("modelLoaded", resolve));
      const readyEventEmitted = Promise.all([textureLoaded, modelLoaded]).then(() => live2dModel.emit("ready"));
      yield runMiddlewares(_Live2DFactory.live2DModelMiddlewares, {
        live2dModel,
        source,
        options: options || {}
      });
      yield readyEventEmitted;
      live2dModel.emit("load");
    });
  }
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
let Live2DFactory = _Live2DFactory;
Live2DFactory.runtimes = [];
Live2DFactory.urlToJSON = urlToJSON;
Live2DFactory.jsonToSettings = jsonToSettings;
Live2DFactory.waitUntilReady = waitUntilReady;
Live2DFactory.setupOptionals = setupOptionals;
Live2DFactory.setupEssentials = setupEssentials;
Live2DFactory.createInternalModel = createInternalModel;
Live2DFactory.live2DModelMiddlewares = [
  urlToJSON,
  jsonToSettings,
  waitUntilReady,
  setupOptionals,
  setupEssentials,
  createInternalModel
];
Live2DFactory.motionTasksMap = /* @__PURE__ */ new WeakMap();
Live2DFactory.expressionTasksMap = /* @__PURE__ */ new WeakMap();
MotionManager.prototype["_loadMotion"] = function(group, index) {
  return Live2DFactory.loadMotion(this, group, index);
};
ExpressionManager.prototype["_loadExpression"] = function(index) {
  return Live2DFactory.loadExpression(this, index);
};
class InteractionMixin {
  constructor() {
    this._autoInteract = false;
  }
  get autoInteract() {
    return this._autoInteract;
  }
  set autoInteract(autoInteract) {
    if (autoInteract !== this._autoInteract) {
      if (autoInteract) {
        this.on("pointertap", onTap, this);
      } else {
        this.off("pointertap", onTap, this);
      }
      this._autoInteract = autoInteract;
    }
  }
  registerInteraction(manager) {
    if (manager !== this.interactionManager) {
      this.unregisterInteraction();
      if (this._autoInteract && manager) {
        this.interactionManager = manager;
        manager.on("pointermove", onPointerMove, this);
      }
    }
  }
  unregisterInteraction() {
    var _a;
    if (this.interactionManager) {
      (_a = this.interactionManager) == null ? void 0 : _a.off("pointermove", onPointerMove, this);
      this.interactionManager = void 0;
    }
  }
}
function onTap(event) {
  this.tap(event.data.global.x, event.data.global.y);
}
function onPointerMove(event) {
  this.focus(event.data.global.x, event.data.global.y);
}
class Live2DTransform extends Transform {
}
const tempPoint = new Point();
const tempMatrix = new Matrix();
let tickerRef;
class Live2DModel extends Container {
  constructor(options) {
    super();
    this.tag = "Live2DModel(uninitialized)";
    this.textures = [];
    this.transform = new Live2DTransform();
    this.anchor = new ObservablePoint(this.onAnchorChange, this, 0, 0);
    this.glContextID = -1;
    this.elapsedTime = performance.now();
    this.deltaTime = 0;
    this.wasUpdated = false;
    this._autoUpdate = false;
    this.once("modelLoaded", () => this.init(options));
  }
  static from(source, options) {
    const model = new this(options);
    return Live2DFactory.setupLive2DModel(model, source, options).then(() => model);
  }
  static fromSync(source, options) {
    const model = new this(options);
    Live2DFactory.setupLive2DModel(model, source, options).then(options == null ? void 0 : options.onLoad).catch(options == null ? void 0 : options.onError);
    return model;
  }
  static registerTicker(tickerClass) {
    tickerRef = tickerClass;
  }
  get autoUpdate() {
    return this._autoUpdate;
  }
  set autoUpdate(autoUpdate) {
    var _a;
    tickerRef || (tickerRef = (_a = window.PIXI) == null ? void 0 : _a.Ticker);
    if (autoUpdate) {
      if (!this._destroyed) {
        if (tickerRef) {
          tickerRef.shared.add(this.onTickerUpdate, this);
          this._autoUpdate = true;
        } else {
          logger.warn(this.tag, "No Ticker registered, please call Live2DModel.registerTicker(Ticker).");
        }
      }
    } else {
      tickerRef == null ? void 0 : tickerRef.shared.remove(this.onTickerUpdate, this);
      this._autoUpdate = false;
    }
  }
  init(options) {
    this.tag = `Live2DModel(${this.internalModel.settings.name})`;
    const _options = Object.assign({
      autoUpdate: true,
      autoInteract: true
    }, options);
    if (_options.autoInteract) {
      this.interactive = true;
    }
    this.autoInteract = _options.autoInteract;
    this.autoUpdate = _options.autoUpdate;
  }
  onAnchorChange() {
    this.pivot.set(this.anchor.x * this.internalModel.width, this.anchor.y * this.internalModel.height);
  }
  motion(group, index, priority, sound) {
    return index === void 0 ? this.internalModel.motionManager.startRandomMotion(group, priority, sound) : this.internalModel.motionManager.startMotion(group, index, priority, sound);
  }
  expression(id) {
    if (this.internalModel.motionManager.expressionManager) {
      return id === void 0 ? this.internalModel.motionManager.expressionManager.setRandomExpression() : this.internalModel.motionManager.expressionManager.setExpression(id);
    }
    return Promise.resolve(false);
  }
  focus(x, y, instant = false) {
    tempPoint.x = x;
    tempPoint.y = y;
    this.toModelPosition(tempPoint, tempPoint, true);
    let tx = tempPoint.x / this.internalModel.originalWidth * 2 - 1;
    let ty = tempPoint.y / this.internalModel.originalHeight * 2 - 1;
    let radian = Math.atan2(ty, tx);
    this.internalModel.focusController.focus(Math.cos(radian), -Math.sin(radian), instant);
  }
  tap(x, y) {
    const hitAreaNames = this.hitTest(x, y);
    if (hitAreaNames.length) {
      logger.log(this.tag, `Hit`, hitAreaNames);
      this.emit("hit", hitAreaNames);
    }
  }
  hitTest(x, y) {
    tempPoint.x = x;
    tempPoint.y = y;
    this.toModelPosition(tempPoint, tempPoint);
    return this.internalModel.hitTest(tempPoint.x, tempPoint.y);
  }
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
  containsPoint(point) {
    return this.getBounds(true).contains(point.x, point.y);
  }
  _calculateBounds() {
    this._bounds.addFrame(this.transform, 0, 0, this.internalModel.width, this.internalModel.height);
  }
  onTickerUpdate() {
    this.update(tickerRef.shared.deltaMS);
  }
  update(dt) {
    this.deltaTime += dt;
    this.elapsedTime += dt;
    this.wasUpdated = true;
  }
  _render(renderer) {
    this.registerInteraction(renderer.plugins.interaction);
    if (!this.wasUpdated) {
      return;
    }
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
        renderer.gl.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, this.internalModel.textureFlipY);
        renderer.texture.bind(texture.baseTexture, 0);
      }
      this.internalModel.bindTexture(i, texture.baseTexture._glTextures[this.glContextID].texture);
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
  destroy(options) {
    this.emit("destroy");
    this.autoUpdate = false;
    this.unregisterInteraction();
    if (options == null ? void 0 : options.texture) {
      this.textures.forEach((texture) => texture.destroy(options.baseTexture));
    }
    this.internalModel.destroy();
    super.destroy(options);
  }
}
applyMixins(Live2DModel, [InteractionMixin]);
const _FileLoader = class {
  static resolveURL(settingsURL, filePath) {
    var _a;
    const resolved = (_a = _FileLoader.filesMap[settingsURL]) == null ? void 0 : _a[filePath];
    if (resolved === void 0) {
      throw new Error("Cannot find this file from uploaded files: " + filePath);
    }
    return resolved;
  }
  static upload(files, settings) {
    return __async(this, null, function* () {
      const fileMap = {};
      for (const definedFile of settings.getDefinedFiles()) {
        const actualPath = decodeURI(url.resolve(settings.url, definedFile));
        const actualFile = files.find((file) => file.webkitRelativePath === actualPath);
        if (actualFile) {
          fileMap[definedFile] = URL.createObjectURL(actualFile);
        }
      }
      _FileLoader.filesMap[settings._objectURL] = fileMap;
    });
  }
  static createSettings(files) {
    return __async(this, null, function* () {
      const settingsFile = files.find((file) => file.name.endsWith("model.json") || file.name.endsWith("model3.json"));
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
let FileLoader = _FileLoader;
FileLoader.filesMap = {};
FileLoader.factory = (context, next) => __async(void 0, null, function* () {
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
    settings.resolveURL = function(url2) {
      return _FileLoader.resolveURL(this._objectURL, url2);
    };
    context.source = settings;
    context.live2dModel.once("modelLoaded", (internalModel) => {
      internalModel.once("destroy", function() {
        const objectURL = this.settings._objectURL;
        URL.revokeObjectURL(objectURL);
        if (_FileLoader.filesMap[objectURL]) {
          for (const resourceObjectURL of Object.values(_FileLoader.filesMap[objectURL])) {
            URL.revokeObjectURL(resourceObjectURL);
          }
        }
        delete _FileLoader.filesMap[objectURL];
      });
    });
  }
  return next();
});
Live2DFactory.live2DModelMiddlewares.unshift(FileLoader.factory);
const _ZipLoader = class {
  static unzip(reader, settings) {
    return __async(this, null, function* () {
      const filePaths = yield _ZipLoader.getFilePaths(reader);
      const requiredFilePaths = [];
      for (const definedFile of settings.getDefinedFiles()) {
        const actualPath = decodeURI(url.resolve(settings.url, definedFile));
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
      const settingsFilePath = filePaths.find((path) => path.endsWith("model.json") || path.endsWith("model3.json"));
      if (!settingsFilePath) {
        throw new Error("Settings file not found");
      }
      const settingsText = yield _ZipLoader.readText(reader, settingsFilePath);
      if (!settingsText) {
        throw new Error("Empty settings file: " + settingsFilePath);
      }
      const settingsJSON = JSON.parse(settingsText);
      settingsJSON.url = settingsFilePath;
      const runtime = Live2DFactory.findRuntime(settingsJSON);
      if (!runtime) {
        throw new Error("Unknown settings JSON");
      }
      return runtime.createModelSettings(settingsJSON);
    });
  }
  static zipReader(data, url2) {
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
let ZipLoader = _ZipLoader;
ZipLoader.ZIP_PROTOCOL = "zip://";
ZipLoader.uid = 0;
ZipLoader.factory = (context, next) => __async(void 0, null, function* () {
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
});
Live2DFactory.live2DModelMiddlewares.unshift(ZipLoader.factory);
if (!window.Live2D) {
  throw new Error("Could not find Cubism 2 runtime. This plugin requires live2d.min.js to be loaded.");
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
    this.params = [];
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
    this.queueManager = new MotionQueueManager();
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
    this.groups = { idle: "idle" };
    this.motionDataType = "arraybuffer";
    this.queueManager = new MotionQueueManager();
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
    this.coreModel = coreModel;
    this.blinkInterval = 4e3;
    this.closingDuration = 100;
    this.closedDuration = 50;
    this.openingDuration = 150;
    this.eyeState = 0;
    this.eyeParamValue = 1;
    this.closedTimer = 0;
    this.nextBlinkTimeLeft = this.blinkInterval;
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
    this.lipSync = true;
    this.textureFlipY = true;
    this.drawDataCount = 0;
    this.disableCulling = false;
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
    this.mouthFormIndex = coreModel.getParamIndex("PARAM_MOUTH_FORM");
    this.init();
  }
  init() {
    super.init();
    if (this.settings.initParams) {
      this.settings.initParams.forEach(({ id, value }) => this.coreModel.setParamFloat(id, value));
    }
    if (this.settings.initOpacities) {
      this.settings.initOpacities.forEach(({ id, value }) => this.coreModel.setPartsOpacity(id, value));
    }
    this.coreModel.saveParam();
    const arr = this.coreModel.getModelContext()._$aS;
    if (arr == null ? void 0 : arr.length) {
      this.drawDataCount = arr.length;
    }
    let culling = this.coreModel.drawParamWebGL.culling;
    Object.defineProperty(this.coreModel.drawParamWebGL, "culling", {
      set: (v) => culling = v,
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
      for (const key of Object.keys(this.settings.layout)) {
        let commonKey = key;
        if (key === "center_x") {
          commonKey = "centerX";
        } else if (key === "center_y") {
          commonKey = "centerY";
        }
        layout[commonKey] = this.settings.layout[key];
      }
    }
    return layout;
  }
  updateWebGLContext(gl, glContextID) {
    const drawParamWebGL = this.coreModel.drawParamWebGL;
    drawParamWebGL.firstDraw = true;
    drawParamWebGL.setGL(gl);
    drawParamWebGL.glno = glContextID;
    for (const prop in drawParamWebGL) {
      if (drawParamWebGL.hasOwnProperty(prop) && drawParamWebGL[prop] instanceof WebGLBuffer) {
        drawParamWebGL[prop] = null;
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
    if (this.lipSync) {
      let value = this.motionManager.mouthSync();
      value = clamp(value, 0, 1);
      for (let i = 0; i < this.motionManager.lipSyncIds.length; ++i) {
        this.coreModel.setParamFloat(this.coreModel.getParamIndex(this.motionManager.lipSyncIds[i]), value * 0.8);
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
    this.coreModel.addToParamFloat(this.angleZParamIndex, this.focusController.x * this.focusController.y * -30);
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
    this.motions = {};
    if (!Cubism2ModelSettings.isValidJSON(json)) {
      throw new TypeError("Invalid JSON.");
    }
    this.moc = json.model;
    copyArray("string", json, this, "textures", "textures");
    this.copy(json);
  }
  static isValidJSON(json) {
    var _a;
    return !!json && typeof json.model === "string" && ((_a = json.textures) == null ? void 0 : _a.length) > 0 && json.textures.every((item) => typeof item === "string");
  }
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
        this.expressions[i].file = replace(this.expressions[i].file, `expressions[${i}].file`);
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
    this.coreModel = coreModel;
    this.physicsHairs = [];
    if (json.physics_hair) {
      this.physicsHairs = json.physics_hair.map((definition) => {
        const physicsHair = new PhysicsHair();
        physicsHair.setup(definition.setup.length, definition.setup.regist, definition.setup.mass);
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
    this.id = id;
    this.paramIndex = -1;
    this.partsIndex = -1;
    this.link = [];
  }
  initIndex(model) {
    this.paramIndex = model.getParamIndex("VISIBLE:" + this.id);
    this.partsIndex = model.getPartsDataIndex(PartsDataID.getID(this.id));
    model.setParamFloat(this.paramIndex, 1);
  }
}
class Live2DPose {
  constructor(coreModel, json) {
    this.coreModel = coreModel;
    this.opacityAnimDuration = 500;
    this.partsGroups = [];
    if (json.parts_visible) {
      this.partsGroups = json.parts_visible.map(({ group }) => group.map(({ id, link }) => {
        const parts = new Live2DPartsParam(id);
        if (link) {
          parts.link = link.map((l) => new Live2DPartsParam(l));
        }
        return parts;
      }));
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
    let visibleIndex = partsGroup.findIndex(({ paramIndex, partsIndex }) => partsIndex >= 0 && model.getParamFloat(paramIndex) !== 0);
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
          let backOp = (1 - a1) * (1 - visibleOpacity);
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
export { Cubism2ExpressionManager, Cubism2InternalModel, Cubism2ModelSettings, Cubism2MotionManager, ExpressionManager, FileLoader, FocusController, InteractionMixin, InternalModel, LOGICAL_HEIGHT, LOGICAL_WIDTH, Live2DExpression, Live2DEyeBlink, Live2DFactory, Live2DLoader, Live2DModel, Live2DPhysics, Live2DPose, Live2DTransform, ModelSettings, MotionManager, MotionPreloadStrategy, MotionPriority, MotionState, SoundManager, VERSION, XHRLoader, ZipLoader, applyMixins, clamp, config, copyArray, copyProperty, folderName, logger, rand, remove };
