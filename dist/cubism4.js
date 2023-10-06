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
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("@pixi/utils"), require("@pixi/math"), require("@pixi/core"), require("@pixi/display")) : typeof define === "function" && define.amd ? define(["exports", "@pixi/utils", "@pixi/math", "@pixi/core", "@pixi/display"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.PIXI = global.PIXI || {}, global.PIXI.live2d = global.PIXI.live2d || {}), global.PIXI.utils, global.PIXI, global.PIXI, global.PIXI));
})(this, function(exports2, utils, math, core, display) {
  "use strict";
  class CubismBreath {
    constructor() {
      this._breathParameters = [];
      this._currentTime = 0;
    }
    static create() {
      return new CubismBreath();
    }
    setParameters(breathParameters) {
      this._breathParameters = breathParameters;
    }
    getParameters() {
      return this._breathParameters;
    }
    updateParameters(model, deltaTimeSeconds) {
      this._currentTime += deltaTimeSeconds;
      const t = this._currentTime * 2 * 3.14159;
      for (let i = 0; i < this._breathParameters.length; ++i) {
        const data = this._breathParameters[i];
        model.addParameterValueById(data.parameterId, data.offset + data.peak * Math.sin(t / data.cycle), data.weight);
      }
    }
  }
  class BreathParameterData {
    constructor(parameterId, offset, peak, cycle, weight) {
      this.parameterId = parameterId == void 0 ? void 0 : parameterId;
      this.offset = offset == void 0 ? 0 : offset;
      this.peak = peak == void 0 ? 0 : peak;
      this.cycle = cycle == void 0 ? 0 : cycle;
      this.weight = weight == void 0 ? 0 : weight;
    }
  }
  const _CubismEyeBlink = class {
    static create(modelSetting) {
      return new _CubismEyeBlink(modelSetting);
    }
    setBlinkingInterval(blinkingInterval) {
      this._blinkingIntervalSeconds = blinkingInterval;
    }
    setBlinkingSetting(closing, closed, opening) {
      this._closingSeconds = closing;
      this._closedSeconds = closed;
      this._openingSeconds = opening;
    }
    setParameterIds(parameterIds) {
      this._parameterIds = parameterIds;
    }
    getParameterIds() {
      return this._parameterIds;
    }
    updateParameters(model, deltaTimeSeconds) {
      this._userTimeSeconds += deltaTimeSeconds;
      let parameterValue;
      let t = 0;
      switch (this._blinkingState) {
        case EyeState.EyeState_Closing:
          t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._closingSeconds;
          if (t >= 1) {
            t = 1;
            this._blinkingState = EyeState.EyeState_Closed;
            this._stateStartTimeSeconds = this._userTimeSeconds;
          }
          parameterValue = 1 - t;
          break;
        case EyeState.EyeState_Closed:
          t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._closedSeconds;
          if (t >= 1) {
            this._blinkingState = EyeState.EyeState_Opening;
            this._stateStartTimeSeconds = this._userTimeSeconds;
          }
          parameterValue = 0;
          break;
        case EyeState.EyeState_Opening:
          t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._openingSeconds;
          if (t >= 1) {
            t = 1;
            this._blinkingState = EyeState.EyeState_Interval;
            this._nextBlinkingTime = this.determinNextBlinkingTiming();
          }
          parameterValue = t;
          break;
        case EyeState.EyeState_Interval:
          if (this._nextBlinkingTime < this._userTimeSeconds) {
            this._blinkingState = EyeState.EyeState_Closing;
            this._stateStartTimeSeconds = this._userTimeSeconds;
          }
          parameterValue = 1;
          break;
        case EyeState.EyeState_First:
        default:
          this._blinkingState = EyeState.EyeState_Interval;
          this._nextBlinkingTime = this.determinNextBlinkingTiming();
          parameterValue = 1;
          break;
      }
      if (!_CubismEyeBlink.CloseIfZero) {
        parameterValue = -parameterValue;
      }
      for (let i = 0; i < this._parameterIds.length; ++i) {
        model.setParameterValueById(this._parameterIds[i], parameterValue);
      }
    }
    constructor(modelSetting) {
      var _a, _b;
      this._blinkingState = EyeState.EyeState_First;
      this._nextBlinkingTime = 0;
      this._stateStartTimeSeconds = 0;
      this._blinkingIntervalSeconds = 4;
      this._closingSeconds = 0.1;
      this._closedSeconds = 0.05;
      this._openingSeconds = 0.15;
      this._userTimeSeconds = 0;
      this._parameterIds = [];
      if (modelSetting == null) {
        return;
      }
      this._parameterIds = (_b = (_a = modelSetting.getEyeBlinkParameters()) == null ? void 0 : _a.slice()) != null ? _b : this._parameterIds;
    }
    determinNextBlinkingTiming() {
      const r = Math.random();
      return this._userTimeSeconds + r * (2 * this._blinkingIntervalSeconds - 1);
    }
  };
  let CubismEyeBlink = _CubismEyeBlink;
  CubismEyeBlink.CloseIfZero = true;
  var EyeState = /* @__PURE__ */ ((EyeState2) => {
    EyeState2[EyeState2["EyeState_First"] = 0] = "EyeState_First";
    EyeState2[EyeState2["EyeState_Interval"] = 1] = "EyeState_Interval";
    EyeState2[EyeState2["EyeState_Closing"] = 2] = "EyeState_Closing";
    EyeState2[EyeState2["EyeState_Closed"] = 3] = "EyeState_Closed";
    EyeState2[EyeState2["EyeState_Opening"] = 4] = "EyeState_Opening";
    return EyeState2;
  })(EyeState || {});
  const Epsilon = 1e-3;
  const DefaultFadeInSeconds = 0.5;
  class CubismPose {
    static create(pose3json) {
      const ret = new CubismPose();
      if (typeof pose3json.FadeInTime === "number") {
        ret._fadeTimeSeconds = pose3json.FadeInTime;
        if (ret._fadeTimeSeconds <= 0) {
          ret._fadeTimeSeconds = DefaultFadeInSeconds;
        }
      }
      const poseListInfo = pose3json.Groups;
      const poseCount = poseListInfo.length;
      for (let poseIndex = 0; poseIndex < poseCount; ++poseIndex) {
        const idListInfo = poseListInfo[poseIndex];
        const idCount = idListInfo.length;
        let groupCount = 0;
        for (let groupIndex = 0; groupIndex < idCount; ++groupIndex) {
          const partInfo = idListInfo[groupIndex];
          const partData = new PartData();
          partData.partId = partInfo.Id;
          const linkListInfo = partInfo.Link;
          if (linkListInfo) {
            const linkCount = linkListInfo.length;
            for (let linkIndex = 0; linkIndex < linkCount; ++linkIndex) {
              const linkPart = new PartData();
              linkPart.partId = linkListInfo[linkIndex];
              partData.link.push(linkPart);
            }
          }
          ret._partGroups.push(partData);
          ++groupCount;
        }
        ret._partGroupCounts.push(groupCount);
      }
      return ret;
    }
    updateParameters(model, deltaTimeSeconds) {
      if (model != this._lastModel) {
        this.reset(model);
      }
      this._lastModel = model;
      if (deltaTimeSeconds < 0) {
        deltaTimeSeconds = 0;
      }
      let beginIndex = 0;
      for (let i = 0; i < this._partGroupCounts.length; i++) {
        const partGroupCount = this._partGroupCounts[i];
        this.doFade(model, deltaTimeSeconds, beginIndex, partGroupCount);
        beginIndex += partGroupCount;
      }
      this.copyPartOpacities(model);
    }
    reset(model) {
      let beginIndex = 0;
      for (let i = 0; i < this._partGroupCounts.length; ++i) {
        const groupCount = this._partGroupCounts[i];
        for (let j = beginIndex; j < beginIndex + groupCount; ++j) {
          this._partGroups[j].initialize(model);
          const partsIndex = this._partGroups[j].partIndex;
          const paramIndex = this._partGroups[j].parameterIndex;
          if (partsIndex < 0) {
            continue;
          }
          model.setPartOpacityByIndex(partsIndex, j == beginIndex ? 1 : 0);
          model.setParameterValueByIndex(paramIndex, j == beginIndex ? 1 : 0);
          for (let k = 0; k < this._partGroups[j].link.length; ++k) {
            this._partGroups[j].link[k].initialize(model);
          }
        }
        beginIndex += groupCount;
      }
    }
    copyPartOpacities(model) {
      for (let groupIndex = 0; groupIndex < this._partGroups.length; ++groupIndex) {
        const partData = this._partGroups[groupIndex];
        if (partData.link.length == 0) {
          continue;
        }
        const partIndex = this._partGroups[groupIndex].partIndex;
        const opacity = model.getPartOpacityByIndex(partIndex);
        for (let linkIndex = 0; linkIndex < partData.link.length; ++linkIndex) {
          const linkPart = partData.link[linkIndex];
          const linkPartIndex = linkPart.partIndex;
          if (linkPartIndex < 0) {
            continue;
          }
          model.setPartOpacityByIndex(linkPartIndex, opacity);
        }
      }
    }
    doFade(model, deltaTimeSeconds, beginIndex, partGroupCount) {
      let visiblePartIndex = -1;
      let newOpacity = 1;
      const phi = 0.5;
      const backOpacityThreshold = 0.15;
      for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
        const partIndex = this._partGroups[i].partIndex;
        const paramIndex = this._partGroups[i].parameterIndex;
        if (model.getParameterValueByIndex(paramIndex) > Epsilon) {
          if (visiblePartIndex >= 0) {
            break;
          }
          visiblePartIndex = i;
          newOpacity = model.getPartOpacityByIndex(partIndex);
          newOpacity += deltaTimeSeconds / this._fadeTimeSeconds;
          if (newOpacity > 1) {
            newOpacity = 1;
          }
        }
      }
      if (visiblePartIndex < 0) {
        visiblePartIndex = 0;
        newOpacity = 1;
      }
      for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
        const partsIndex = this._partGroups[i].partIndex;
        if (visiblePartIndex == i) {
          model.setPartOpacityByIndex(partsIndex, newOpacity);
        } else {
          let opacity = model.getPartOpacityByIndex(partsIndex);
          let a1;
          if (newOpacity < phi) {
            a1 = newOpacity * (phi - 1) / phi + 1;
          } else {
            a1 = (1 - newOpacity) * phi / (1 - phi);
          }
          const backOpacity = (1 - a1) * (1 - newOpacity);
          if (backOpacity > backOpacityThreshold) {
            a1 = 1 - backOpacityThreshold / (1 - newOpacity);
          }
          if (opacity > a1) {
            opacity = a1;
          }
          model.setPartOpacityByIndex(partsIndex, opacity);
        }
      }
    }
    constructor() {
      this._fadeTimeSeconds = DefaultFadeInSeconds;
      this._lastModel = void 0;
      this._partGroups = [];
      this._partGroupCounts = [];
    }
  }
  class PartData {
    constructor(v) {
      this.parameterIndex = 0;
      this.partIndex = 0;
      this.partId = "";
      this.link = [];
      if (v != void 0) {
        this.assignment(v);
      }
    }
    assignment(v) {
      this.partId = v.partId;
      this.link = v.link.map((link) => link.clone());
      return this;
    }
    initialize(model) {
      this.parameterIndex = model.getParameterIndex(this.partId);
      this.partIndex = model.getPartIndex(this.partId);
      model.setParameterValueByIndex(this.parameterIndex, 1);
    }
    clone() {
      const clonePartData = new PartData();
      clonePartData.partId = this.partId;
      clonePartData.parameterIndex = this.parameterIndex;
      clonePartData.partIndex = this.partIndex;
      clonePartData.link = this.link.map((link) => link.clone());
      return clonePartData;
    }
  }
  class CubismVector2 {
    constructor(x, y) {
      this.x = x || 0;
      this.y = y || 0;
    }
    add(vector2) {
      const ret = new CubismVector2(0, 0);
      ret.x = this.x + vector2.x;
      ret.y = this.y + vector2.y;
      return ret;
    }
    substract(vector2) {
      const ret = new CubismVector2(0, 0);
      ret.x = this.x - vector2.x;
      ret.y = this.y - vector2.y;
      return ret;
    }
    multiply(vector2) {
      const ret = new CubismVector2(0, 0);
      ret.x = this.x * vector2.x;
      ret.y = this.y * vector2.y;
      return ret;
    }
    multiplyByScaler(scalar) {
      return this.multiply(new CubismVector2(scalar, scalar));
    }
    division(vector2) {
      const ret = new CubismVector2(0, 0);
      ret.x = this.x / vector2.x;
      ret.y = this.y / vector2.y;
      return ret;
    }
    divisionByScalar(scalar) {
      return this.division(new CubismVector2(scalar, scalar));
    }
    getLength() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    getDistanceWith(a) {
      return Math.sqrt((this.x - a.x) * (this.x - a.x) + (this.y - a.y) * (this.y - a.y));
    }
    dot(a) {
      return this.x * a.x + this.y * a.y;
    }
    normalize() {
      const length = Math.pow(this.x * this.x + this.y * this.y, 0.5);
      this.x = this.x / length;
      this.y = this.y / length;
    }
    isEqual(rhs) {
      return this.x == rhs.x && this.y == rhs.y;
    }
    isNotEqual(rhs) {
      return !this.isEqual(rhs);
    }
  }
  const _CubismMath = class {
    static range(value, min, max) {
      if (value < min) {
        value = min;
      } else if (value > max) {
        value = max;
      }
      return value;
    }
    static sin(x) {
      return Math.sin(x);
    }
    static cos(x) {
      return Math.cos(x);
    }
    static abs(x) {
      return Math.abs(x);
    }
    static sqrt(x) {
      return Math.sqrt(x);
    }
    static cbrt(x) {
      if (x === 0) {
        return x;
      }
      let cx = x;
      const isNegativeNumber = cx < 0;
      if (isNegativeNumber) {
        cx = -cx;
      }
      let ret;
      if (cx === Infinity) {
        ret = Infinity;
      } else {
        ret = Math.exp(Math.log(cx) / 3);
        ret = (cx / (ret * ret) + 2 * ret) / 3;
      }
      return isNegativeNumber ? -ret : ret;
    }
    static getEasingSine(value) {
      if (value < 0) {
        return 0;
      } else if (value > 1) {
        return 1;
      }
      return 0.5 - 0.5 * this.cos(value * Math.PI);
    }
    static max(left, right) {
      return left > right ? left : right;
    }
    static min(left, right) {
      return left > right ? right : left;
    }
    static degreesToRadian(degrees) {
      return degrees / 180 * Math.PI;
    }
    static radianToDegrees(radian) {
      return radian * 180 / Math.PI;
    }
    static directionToRadian(from, to) {
      const q1 = Math.atan2(to.y, to.x);
      const q2 = Math.atan2(from.y, from.x);
      let ret = q1 - q2;
      while (ret < -Math.PI) {
        ret += Math.PI * 2;
      }
      while (ret > Math.PI) {
        ret -= Math.PI * 2;
      }
      return ret;
    }
    static directionToDegrees(from, to) {
      const radian = this.directionToRadian(from, to);
      let degree = this.radianToDegrees(radian);
      if (to.x - from.x > 0) {
        degree = -degree;
      }
      return degree;
    }
    static radianToDirection(totalAngle) {
      const ret = new CubismVector2();
      ret.x = this.sin(totalAngle);
      ret.y = this.cos(totalAngle);
      return ret;
    }
    static quadraticEquation(a, b, c) {
      if (this.abs(a) < _CubismMath.Epsilon) {
        if (this.abs(b) < _CubismMath.Epsilon) {
          return -c;
        }
        return -c / b;
      }
      return -(b + this.sqrt(b * b - 4 * a * c)) / (2 * a);
    }
    static cardanoAlgorithmForBezier(a, b, c, d) {
      if (this.sqrt(a) < _CubismMath.Epsilon) {
        return this.range(this.quadraticEquation(b, c, d), 0, 1);
      }
      const ba = b / a;
      const ca = c / a;
      const da = d / a;
      const p = (3 * ca - ba * ba) / 3;
      const p3 = p / 3;
      const q = (2 * ba * ba * ba - 9 * ba * ca + 27 * da) / 27;
      const q2 = q / 2;
      const discriminant = q2 * q2 + p3 * p3 * p3;
      const center = 0.5;
      const threshold = center + 0.01;
      if (discriminant < 0) {
        const mp3 = -p / 3;
        const mp33 = mp3 * mp3 * mp3;
        const r = this.sqrt(mp33);
        const t = -q / (2 * r);
        const cosphi = this.range(t, -1, 1);
        const phi = Math.acos(cosphi);
        const crtr = this.cbrt(r);
        const t1 = 2 * crtr;
        const root12 = t1 * this.cos(phi / 3) - ba / 3;
        if (this.abs(root12 - center) < threshold) {
          return this.range(root12, 0, 1);
        }
        const root2 = t1 * this.cos((phi + 2 * Math.PI) / 3) - ba / 3;
        if (this.abs(root2 - center) < threshold) {
          return this.range(root2, 0, 1);
        }
        const root3 = t1 * this.cos((phi + 4 * Math.PI) / 3) - ba / 3;
        return this.range(root3, 0, 1);
      }
      if (discriminant == 0) {
        let u12;
        if (q2 < 0) {
          u12 = this.cbrt(-q2);
        } else {
          u12 = -this.cbrt(q2);
        }
        const root12 = 2 * u12 - ba / 3;
        if (this.abs(root12 - center) < threshold) {
          return this.range(root12, 0, 1);
        }
        const root2 = -u12 - ba / 3;
        return this.range(root2, 0, 1);
      }
      const sd = this.sqrt(discriminant);
      const u1 = this.cbrt(sd - q2);
      const v1 = this.cbrt(sd + q2);
      const root1 = u1 - v1 - ba / 3;
      return this.range(root1, 0, 1);
    }
    constructor() {
    }
  };
  let CubismMath = _CubismMath;
  CubismMath.Epsilon = 1e-5;
  class CubismMatrix44 {
    constructor() {
      this._tr = new Float32Array(16);
      this.loadIdentity();
    }
    static multiply(a, b, dst) {
      const c = new Float32Array([
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]);
      const n = 4;
      for (let i = 0; i < n; ++i) {
        for (let j = 0; j < n; ++j) {
          for (let k = 0; k < n; ++k) {
            c[j + i * 4] += a[k + i * 4] * b[j + k * 4];
          }
        }
      }
      for (let i = 0; i < 16; ++i) {
        dst[i] = c[i];
      }
    }
    loadIdentity() {
      const c = new Float32Array([
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
      this.setMatrix(c);
    }
    setMatrix(tr) {
      for (let i = 0; i < 16; ++i) {
        this._tr[i] = tr[i];
      }
    }
    getArray() {
      return this._tr;
    }
    getScaleX() {
      return this._tr[0];
    }
    getScaleY() {
      return this._tr[5];
    }
    getTranslateX() {
      return this._tr[12];
    }
    getTranslateY() {
      return this._tr[13];
    }
    transformX(src) {
      return this._tr[0] * src + this._tr[12];
    }
    transformY(src) {
      return this._tr[5] * src + this._tr[13];
    }
    invertTransformX(src) {
      return (src - this._tr[12]) / this._tr[0];
    }
    invertTransformY(src) {
      return (src - this._tr[13]) / this._tr[5];
    }
    translateRelative(x, y) {
      const tr1 = new Float32Array([
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
        x,
        y,
        0,
        1
      ]);
      CubismMatrix44.multiply(tr1, this._tr, this._tr);
    }
    translate(x, y) {
      this._tr[12] = x;
      this._tr[13] = y;
    }
    translateX(x) {
      this._tr[12] = x;
    }
    translateY(y) {
      this._tr[13] = y;
    }
    scaleRelative(x, y) {
      const tr1 = new Float32Array([
        x,
        0,
        0,
        0,
        0,
        y,
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
      CubismMatrix44.multiply(tr1, this._tr, this._tr);
    }
    scale(x, y) {
      this._tr[0] = x;
      this._tr[5] = y;
    }
    multiplyByMatrix(m) {
      CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
    }
    clone() {
      const cloneMatrix = new CubismMatrix44();
      for (let i = 0; i < this._tr.length; i++) {
        cloneMatrix._tr[i] = this._tr[i];
      }
      return cloneMatrix;
    }
  }
  class CubismRenderer {
    initialize(model) {
      this._model = model;
    }
    drawModel() {
      if (this.getModel() == null)
        return;
      this.doDrawModel();
    }
    setMvpMatrix(matrix44) {
      this._mvpMatrix4x4.setMatrix(matrix44.getArray());
    }
    getMvpMatrix() {
      return this._mvpMatrix4x4;
    }
    setModelColor(red, green, blue, alpha) {
      if (red < 0) {
        red = 0;
      } else if (red > 1) {
        red = 1;
      }
      if (green < 0) {
        green = 0;
      } else if (green > 1) {
        green = 1;
      }
      if (blue < 0) {
        blue = 0;
      } else if (blue > 1) {
        blue = 1;
      }
      if (alpha < 0) {
        alpha = 0;
      } else if (alpha > 1) {
        alpha = 1;
      }
      this._modelColor.R = red;
      this._modelColor.G = green;
      this._modelColor.B = blue;
      this._modelColor.A = alpha;
    }
    getModelColor() {
      return Object.assign({}, this._modelColor);
    }
    setIsPremultipliedAlpha(enable) {
      this._isPremultipliedAlpha = enable;
    }
    isPremultipliedAlpha() {
      return this._isPremultipliedAlpha;
    }
    setIsCulling(culling) {
      this._isCulling = culling;
    }
    isCulling() {
      return this._isCulling;
    }
    setAnisotropy(n) {
      this._anisortopy = n;
    }
    getAnisotropy() {
      return this._anisortopy;
    }
    getModel() {
      return this._model;
    }
    constructor() {
      this._isCulling = false;
      this._isPremultipliedAlpha = false;
      this._anisortopy = 0;
      this._modelColor = new CubismTextureColor();
      this._mvpMatrix4x4 = new CubismMatrix44();
      this._mvpMatrix4x4.loadIdentity();
    }
  }
  var CubismBlendMode = /* @__PURE__ */ ((CubismBlendMode2) => {
    CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Normal"] = 0] = "CubismBlendMode_Normal";
    CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Additive"] = 1] = "CubismBlendMode_Additive";
    CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Multiplicative"] = 2] = "CubismBlendMode_Multiplicative";
    return CubismBlendMode2;
  })(CubismBlendMode || {});
  class CubismTextureColor {
    constructor() {
      this.R = 1;
      this.G = 1;
      this.B = 1;
      this.A = 1;
    }
  }
  let s_isStarted = false;
  let s_isInitialized = false;
  let s_option = void 0;
  const Constant = {
    vertexOffset: 0,
    vertexStep: 2
  };
  class CubismFramework {
    static startUp(option) {
      if (s_isStarted) {
        CubismLogInfo("CubismFramework.startUp() is already done.");
        return s_isStarted;
      }
      if (Live2DCubismCore._isStarted) {
        s_isStarted = true;
        return true;
      }
      Live2DCubismCore._isStarted = true;
      s_option = option;
      if (s_option) {
        Live2DCubismCore.Logging.csmSetLogFunction(s_option.logFunction);
      }
      s_isStarted = true;
      if (s_isStarted) {
        const version = Live2DCubismCore.Version.csmGetVersion();
        const major = (version & 4278190080) >> 24;
        const minor = (version & 16711680) >> 16;
        const patch = version & 65535;
        const versionNumber = version;
        CubismLogInfo(`Live2D Cubism Core version: {0}.{1}.{2} ({3})`, ("00" + major).slice(-2), ("00" + minor).slice(-2), ("0000" + patch).slice(-4), versionNumber);
      }
      CubismLogInfo("CubismFramework.startUp() is complete.");
      return s_isStarted;
    }
    static cleanUp() {
      s_isStarted = false;
      s_isInitialized = false;
      s_option = void 0;
    }
    static initialize() {
      if (!s_isStarted) {
        CubismLogWarning("CubismFramework is not started.");
        return;
      }
      if (s_isInitialized) {
        CubismLogWarning("CubismFramework.initialize() skipped, already initialized.");
        return;
      }
      s_isInitialized = true;
      CubismLogInfo("CubismFramework.initialize() is complete.");
    }
    static dispose() {
      if (!s_isStarted) {
        CubismLogWarning("CubismFramework is not started.");
        return;
      }
      if (!s_isInitialized) {
        CubismLogWarning("CubismFramework.dispose() skipped, not initialized.");
        return;
      }
      CubismRenderer.staticRelease();
      s_isInitialized = false;
      CubismLogInfo("CubismFramework.dispose() is complete.");
    }
    static isStarted() {
      return s_isStarted;
    }
    static isInitialized() {
      return s_isInitialized;
    }
    static coreLogFunction(message) {
      if (!Live2DCubismCore.Logging.csmGetLogFunction()) {
        return;
      }
      Live2DCubismCore.Logging.csmGetLogFunction()(message);
    }
    static getLoggingLevel() {
      if (s_option != null) {
        return s_option.loggingLevel;
      }
      return LogLevel.LogLevel_Off;
    }
    constructor() {
    }
  }
  var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
    LogLevel2[LogLevel2["LogLevel_Verbose"] = 0] = "LogLevel_Verbose";
    LogLevel2[LogLevel2["LogLevel_Debug"] = 1] = "LogLevel_Debug";
    LogLevel2[LogLevel2["LogLevel_Info"] = 2] = "LogLevel_Info";
    LogLevel2[LogLevel2["LogLevel_Warning"] = 3] = "LogLevel_Warning";
    LogLevel2[LogLevel2["LogLevel_Error"] = 4] = "LogLevel_Error";
    LogLevel2[LogLevel2["LogLevel_Off"] = 5] = "LogLevel_Off";
    return LogLevel2;
  })(LogLevel || {});
  const CSM_ASSERT = () => {
  };
  function CubismLogVerbose(fmt, ...args) {
    CubismDebug.print(LogLevel.LogLevel_Verbose, "[CSM][V]" + fmt + "\n", args);
  }
  function CubismLogDebug(fmt, ...args) {
    CubismDebug.print(LogLevel.LogLevel_Debug, "[CSM][D]" + fmt + "\n", args);
  }
  function CubismLogInfo(fmt, ...args) {
    CubismDebug.print(LogLevel.LogLevel_Info, "[CSM][I]" + fmt + "\n", args);
  }
  function CubismLogWarning(fmt, ...args) {
    CubismDebug.print(LogLevel.LogLevel_Warning, "[CSM][W]" + fmt + "\n", args);
  }
  function CubismLogError(fmt, ...args) {
    CubismDebug.print(LogLevel.LogLevel_Error, "[CSM][E]" + fmt + "\n", args);
  }
  class CubismDebug {
    static print(logLevel, format, args) {
      if (logLevel < CubismFramework.getLoggingLevel()) {
        return;
      }
      const logPrint = CubismFramework.coreLogFunction;
      if (!logPrint)
        return;
      const buffer = format.replace(/{(\d+)}/g, (m, k) => {
        return args[k];
      });
      logPrint(buffer);
    }
    static dumpBytes(logLevel, data, length) {
      for (let i = 0; i < length; i++) {
        if (i % 16 == 0 && i > 0)
          this.print(logLevel, "\n");
        else if (i % 8 == 0 && i > 0)
          this.print(logLevel, "  ");
        this.print(logLevel, "{0} ", [data[i] & 255]);
      }
      this.print(logLevel, "\n");
    }
    constructor() {
    }
  }
  class CubismModel {
    update() {
      this._model.update();
      this._model.drawables.resetDynamicFlags();
    }
    getCanvasWidth() {
      if (this._model == null) {
        return 0;
      }
      return this._model.canvasinfo.CanvasWidth / this._model.canvasinfo.PixelsPerUnit;
    }
    getCanvasHeight() {
      if (this._model == null) {
        return 0;
      }
      return this._model.canvasinfo.CanvasHeight / this._model.canvasinfo.PixelsPerUnit;
    }
    saveParameters() {
      const parameterCount = this._model.parameters.count;
      const savedParameterCount = this._savedParameters.length;
      for (let i = 0; i < parameterCount; ++i) {
        if (i < savedParameterCount) {
          this._savedParameters[i] = this._parameterValues[i];
        } else {
          this._savedParameters.push(this._parameterValues[i]);
        }
      }
    }
    getModel() {
      return this._model;
    }
    getPartIndex(partId) {
      let partIndex;
      const partCount = this._model.parts.count;
      for (partIndex = 0; partIndex < partCount; ++partIndex) {
        if (partId == this._partIds[partIndex]) {
          return partIndex;
        }
      }
      if (partId in this._notExistPartId) {
        return this._notExistPartId[partId];
      }
      partIndex = partCount + this._notExistPartId.length;
      this._notExistPartId[partId] = partIndex;
      this._notExistPartOpacities[partIndex] = 0;
      return partIndex;
    }
    getPartCount() {
      return this._model.parts.count;
    }
    setPartOpacityByIndex(partIndex, opacity) {
      if (partIndex in this._notExistPartOpacities) {
        this._notExistPartOpacities[partIndex] = opacity;
        return;
      }
      CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
      this._partOpacities[partIndex] = opacity;
    }
    setPartOpacityById(partId, opacity) {
      const index = this.getPartIndex(partId);
      if (index < 0) {
        return;
      }
      this.setPartOpacityByIndex(index, opacity);
    }
    getPartOpacityByIndex(partIndex) {
      if (partIndex in this._notExistPartOpacities) {
        return this._notExistPartOpacities[partIndex];
      }
      CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
      return this._partOpacities[partIndex];
    }
    getPartOpacityById(partId) {
      const index = this.getPartIndex(partId);
      if (index < 0) {
        return 0;
      }
      return this.getPartOpacityByIndex(index);
    }
    getParameterIndex(parameterId) {
      let parameterIndex;
      const idCount = this._model.parameters.count;
      for (parameterIndex = 0; parameterIndex < idCount; ++parameterIndex) {
        if (parameterId != this._parameterIds[parameterIndex]) {
          continue;
        }
        return parameterIndex;
      }
      if (parameterId in this._notExistParameterId) {
        return this._notExistParameterId[parameterId];
      }
      parameterIndex = this._model.parameters.count + Object.keys(this._notExistParameterId).length;
      this._notExistParameterId[parameterId] = parameterIndex;
      this._notExistParameterValues[parameterIndex] = 0;
      return parameterIndex;
    }
    getParameterCount() {
      return this._model.parameters.count;
    }
    getParameterMaximumValue(parameterIndex) {
      return this._model.parameters.maximumValues[parameterIndex];
    }
    getParameterMinimumValue(parameterIndex) {
      return this._model.parameters.minimumValues[parameterIndex];
    }
    getParameterDefaultValue(parameterIndex) {
      return this._model.parameters.defaultValues[parameterIndex];
    }
    getParameterValueByIndex(parameterIndex) {
      if (parameterIndex in this._notExistParameterValues) {
        return this._notExistParameterValues[parameterIndex];
      }
      CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
      return this._parameterValues[parameterIndex];
    }
    getParameterValueById(parameterId) {
      const parameterIndex = this.getParameterIndex(parameterId);
      return this.getParameterValueByIndex(parameterIndex);
    }
    setParameterValueByIndex(parameterIndex, value, weight = 1) {
      if (parameterIndex in this._notExistParameterValues) {
        this._notExistParameterValues[parameterIndex] = weight == 1 ? value : this._notExistParameterValues[parameterIndex] * (1 - weight) + value * weight;
        return;
      }
      CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
      if (this._model.parameters.maximumValues[parameterIndex] < value) {
        value = this._model.parameters.maximumValues[parameterIndex];
      }
      if (this._model.parameters.minimumValues[parameterIndex] > value) {
        value = this._model.parameters.minimumValues[parameterIndex];
      }
      this._parameterValues[parameterIndex] = weight == 1 ? value : this._parameterValues[parameterIndex] = this._parameterValues[parameterIndex] * (1 - weight) + value * weight;
    }
    setParameterValueById(parameterId, value, weight = 1) {
      const index = this.getParameterIndex(parameterId);
      this.setParameterValueByIndex(index, value, weight);
    }
    addParameterValueByIndex(parameterIndex, value, weight = 1) {
      this.setParameterValueByIndex(parameterIndex, this.getParameterValueByIndex(parameterIndex) + value * weight);
    }
    addParameterValueById(parameterId, value, weight = 1) {
      const index = this.getParameterIndex(parameterId);
      this.addParameterValueByIndex(index, value, weight);
    }
    multiplyParameterValueById(parameterId, value, weight = 1) {
      const index = this.getParameterIndex(parameterId);
      this.multiplyParameterValueByIndex(index, value, weight);
    }
    multiplyParameterValueByIndex(parameterIndex, value, weight = 1) {
      this.setParameterValueByIndex(parameterIndex, this.getParameterValueByIndex(parameterIndex) * (1 + (value - 1) * weight));
    }
    getDrawableIds() {
      return this._drawableIds.slice();
    }
    getDrawableIndex(drawableId) {
      const drawableCount = this._model.drawables.count;
      for (let drawableIndex = 0; drawableIndex < drawableCount; ++drawableIndex) {
        if (this._drawableIds[drawableIndex] == drawableId) {
          return drawableIndex;
        }
      }
      return -1;
    }
    getDrawableCount() {
      return this._model.drawables.count;
    }
    getDrawableId(drawableIndex) {
      return this._model.drawables.ids[drawableIndex];
    }
    getDrawableRenderOrders() {
      return this._model.drawables.renderOrders;
    }
    getDrawableTextureIndices(drawableIndex) {
      return this._model.drawables.textureIndices[drawableIndex];
    }
    getDrawableDynamicFlagVertexPositionsDidChange(drawableIndex) {
      const dynamicFlags = this._model.drawables.dynamicFlags;
      return Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(dynamicFlags[drawableIndex]);
    }
    getDrawableVertexIndexCount(drawableIndex) {
      return this._model.drawables.indexCounts[drawableIndex];
    }
    getDrawableVertexCount(drawableIndex) {
      return this._model.drawables.vertexCounts[drawableIndex];
    }
    getDrawableVertices(drawableIndex) {
      return this.getDrawableVertexPositions(drawableIndex);
    }
    getDrawableVertexIndices(drawableIndex) {
      return this._model.drawables.indices[drawableIndex];
    }
    getDrawableVertexPositions(drawableIndex) {
      return this._model.drawables.vertexPositions[drawableIndex];
    }
    getDrawableVertexUvs(drawableIndex) {
      return this._model.drawables.vertexUvs[drawableIndex];
    }
    getDrawableOpacity(drawableIndex) {
      return this._model.drawables.opacities[drawableIndex];
    }
    getDrawableCulling(drawableIndex) {
      const constantFlags = this._model.drawables.constantFlags;
      return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(constantFlags[drawableIndex]);
    }
    getDrawableBlendMode(drawableIndex) {
      const constantFlags = this._model.drawables.constantFlags;
      return Live2DCubismCore.Utils.hasBlendAdditiveBit(constantFlags[drawableIndex]) ? CubismBlendMode.CubismBlendMode_Additive : Live2DCubismCore.Utils.hasBlendMultiplicativeBit(constantFlags[drawableIndex]) ? CubismBlendMode.CubismBlendMode_Multiplicative : CubismBlendMode.CubismBlendMode_Normal;
    }
    getDrawableInvertedMaskBit(drawableIndex) {
      const constantFlags = this._model.drawables.constantFlags;
      return Live2DCubismCore.Utils.hasIsInvertedMaskBit(constantFlags[drawableIndex]);
    }
    getDrawableMasks() {
      return this._model.drawables.masks;
    }
    getDrawableMaskCounts() {
      return this._model.drawables.maskCounts;
    }
    isUsingMasking() {
      for (let d = 0; d < this._model.drawables.count; ++d) {
        if (this._model.drawables.maskCounts[d] <= 0) {
          continue;
        }
        return true;
      }
      return false;
    }
    getDrawableDynamicFlagIsVisible(drawableIndex) {
      const dynamicFlags = this._model.drawables.dynamicFlags;
      return Live2DCubismCore.Utils.hasIsVisibleBit(dynamicFlags[drawableIndex]);
    }
    getDrawableDynamicFlagVisibilityDidChange(drawableIndex) {
      const dynamicFlags = this._model.drawables.dynamicFlags;
      return Live2DCubismCore.Utils.hasVisibilityDidChangeBit(dynamicFlags[drawableIndex]);
    }
    getDrawableDynamicFlagOpacityDidChange(drawableIndex) {
      const dynamicFlags = this._model.drawables.dynamicFlags;
      return Live2DCubismCore.Utils.hasOpacityDidChangeBit(dynamicFlags[drawableIndex]);
    }
    getDrawableDynamicFlagRenderOrderDidChange(drawableIndex) {
      const dynamicFlags = this._model.drawables.dynamicFlags;
      return Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(dynamicFlags[drawableIndex]);
    }
    loadParameters() {
      let parameterCount = this._model.parameters.count;
      const savedParameterCount = this._savedParameters.length;
      if (parameterCount > savedParameterCount) {
        parameterCount = savedParameterCount;
      }
      for (let i = 0; i < parameterCount; ++i) {
        this._parameterValues[i] = this._savedParameters[i];
      }
    }
    initialize() {
      this._parameterValues = this._model.parameters.values;
      this._partOpacities = this._model.parts.opacities;
      this._parameterMaximumValues = this._model.parameters.maximumValues;
      this._parameterMinimumValues = this._model.parameters.minimumValues;
      {
        const parameterIds = this._model.parameters.ids;
        const parameterCount = this._model.parameters.count;
        for (let i = 0; i < parameterCount; ++i) {
          this._parameterIds.push(parameterIds[i]);
        }
      }
      {
        const partIds = this._model.parts.ids;
        const partCount = this._model.parts.count;
        for (let i = 0; i < partCount; ++i) {
          this._partIds.push(partIds[i]);
        }
      }
      {
        const drawableIds = this._model.drawables.ids;
        const drawableCount = this._model.drawables.count;
        for (let i = 0; i < drawableCount; ++i) {
          this._drawableIds.push(drawableIds[i]);
        }
      }
    }
    constructor(model) {
      this._model = model;
      this._savedParameters = [];
      this._parameterIds = [];
      this._drawableIds = [];
      this._partIds = [];
      this._notExistPartId = {};
      this._notExistParameterId = {};
      this._notExistParameterValues = {};
      this._notExistPartOpacities = {};
      this.initialize();
    }
    release() {
      this._model.release();
      this._model = void 0;
    }
  }
  class CubismMoc {
    static create(mocBytes) {
      const moc = Live2DCubismCore.Moc.fromArrayBuffer(mocBytes);
      if (moc) {
        return new CubismMoc(moc);
      }
      throw new Error("Unknown error");
    }
    createModel() {
      let cubismModel;
      const model = Live2DCubismCore.Model.fromMoc(this._moc);
      if (model) {
        cubismModel = new CubismModel(model);
        ++this._modelCount;
        return cubismModel;
      }
      throw new Error("Unknown error");
    }
    deleteModel(model) {
      if (model != null) {
        --this._modelCount;
      }
    }
    constructor(moc) {
      this._moc = moc;
      this._modelCount = 0;
    }
    release() {
      this._moc._release();
      this._moc = void 0;
    }
  }
  class CubismModelUserDataJson {
    constructor(json, size) {
      this._json = json;
    }
    release() {
      this._json = void 0;
    }
    getUserDataCount() {
      return this._json.Meta.UserDataCount;
    }
    getTotalUserDataSize() {
      return this._json.Meta.TotalUserDataSize;
    }
    getUserDataTargetType(i) {
      return this._json.UserData[i].Target;
    }
    getUserDataId(i) {
      return this._json.UserData[i].Id;
    }
    getUserDataValue(i) {
      return this._json.UserData[i].Value;
    }
  }
  const ArtMesh = "ArtMesh";
  class CubismModelUserData {
    static create(json, size) {
      const ret = new CubismModelUserData();
      ret.parseUserData(json, size);
      return ret;
    }
    getArtMeshUserDatas() {
      return this._artMeshUserDataNode;
    }
    parseUserData(data, size) {
      let json = new CubismModelUserDataJson(data, size);
      const typeOfArtMesh = ArtMesh;
      const nodeCount = json.getUserDataCount();
      for (let i = 0; i < nodeCount; i++) {
        const addNode = {
          targetId: json.getUserDataId(i),
          targetType: json.getUserDataTargetType(i),
          value: json.getUserDataValue(i)
        };
        this._userDataNodes.push(addNode);
        if (addNode.targetType == typeOfArtMesh) {
          this._artMeshUserDataNode.push(addNode);
        }
      }
      json.release();
    }
    constructor() {
      this._userDataNodes = [];
      this._artMeshUserDataNode = [];
    }
    release() {
      this._userDataNodes = null;
    }
  }
  class ACubismMotion {
    constructor() {
      this._fadeInSeconds = -1;
      this._fadeOutSeconds = -1;
      this._weight = 1;
      this._offsetSeconds = 0;
      this._firedEventValues = [];
    }
    release() {
      this._weight = 0;
    }
    updateParameters(model, motionQueueEntry, userTimeSeconds) {
      if (!motionQueueEntry.isAvailable() || motionQueueEntry.isFinished()) {
        return;
      }
      if (!motionQueueEntry.isStarted()) {
        motionQueueEntry.setIsStarted(true);
        motionQueueEntry.setStartTime(userTimeSeconds - this._offsetSeconds);
        motionQueueEntry.setFadeInStartTime(userTimeSeconds);
        const duration = this.getDuration();
        if (motionQueueEntry.getEndTime() < 0) {
          motionQueueEntry.setEndTime(duration <= 0 ? -1 : motionQueueEntry.getStartTime() + duration);
        }
      }
      let fadeWeight = this._weight;
      const fadeIn = this._fadeInSeconds == 0 ? 1 : CubismMath.getEasingSine((userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / this._fadeInSeconds);
      const fadeOut = this._fadeOutSeconds == 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine((motionQueueEntry.getEndTime() - userTimeSeconds) / this._fadeOutSeconds);
      fadeWeight = fadeWeight * fadeIn * fadeOut;
      motionQueueEntry.setState(userTimeSeconds, fadeWeight);
      this.doUpdateParameters(model, userTimeSeconds, fadeWeight, motionQueueEntry);
      if (motionQueueEntry.getEndTime() > 0 && motionQueueEntry.getEndTime() < userTimeSeconds) {
        motionQueueEntry.setIsFinished(true);
      }
    }
    setFadeInTime(fadeInSeconds) {
      this._fadeInSeconds = fadeInSeconds;
    }
    setFadeOutTime(fadeOutSeconds) {
      this._fadeOutSeconds = fadeOutSeconds;
    }
    getFadeOutTime() {
      return this._fadeOutSeconds;
    }
    getFadeInTime() {
      return this._fadeInSeconds;
    }
    setWeight(weight) {
      this._weight = weight;
    }
    getWeight() {
      return this._weight;
    }
    getDuration() {
      return -1;
    }
    getLoopDuration() {
      return -1;
    }
    setOffsetTime(offsetSeconds) {
      this._offsetSeconds = offsetSeconds;
    }
    getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
      return this._firedEventValues;
    }
    setFinishedMotionHandler(onFinishedMotionHandler) {
      this._onFinishedMotion = onFinishedMotionHandler;
    }
    getFinishedMotionHandler() {
      return this._onFinishedMotion;
    }
  }
  const DefaultFadeTime = 1;
  class CubismExpressionMotion extends ACubismMotion {
    constructor() {
      super();
      this._parameters = [];
    }
    static create(json) {
      const expression = new CubismExpressionMotion();
      const fadeInTime = json.FadeInTime;
      const fadeOutTime = json.FadeOutTime;
      expression.setFadeInTime(fadeInTime !== void 0 ? fadeInTime : DefaultFadeTime);
      expression.setFadeOutTime(fadeOutTime !== void 0 ? fadeOutTime : DefaultFadeTime);
      const parameters = json.Parameters || [];
      for (let i = 0; i < parameters.length; ++i) {
        const param = parameters[i];
        const parameterId = param.Id;
        const value = param.Value;
        let blendType;
        switch (param.Blend) {
          case "Multiply":
            blendType = ExpressionBlendType.ExpressionBlendType_Multiply;
            break;
          case "Overwrite":
            blendType = ExpressionBlendType.ExpressionBlendType_Overwrite;
            break;
          case "Add":
          default:
            blendType = ExpressionBlendType.ExpressionBlendType_Add;
            break;
        }
        const item = {
          parameterId,
          blendType,
          value
        };
        expression._parameters.push(item);
      }
      return expression;
    }
    doUpdateParameters(model, userTimeSeconds, weight, motionQueueEntry) {
      for (let i = 0; i < this._parameters.length; ++i) {
        const parameter = this._parameters[i];
        switch (parameter.blendType) {
          case ExpressionBlendType.ExpressionBlendType_Add: {
            model.addParameterValueById(parameter.parameterId, parameter.value, weight);
            break;
          }
          case ExpressionBlendType.ExpressionBlendType_Multiply: {
            model.multiplyParameterValueById(parameter.parameterId, parameter.value, weight);
            break;
          }
          case ExpressionBlendType.ExpressionBlendType_Overwrite: {
            model.setParameterValueById(parameter.parameterId, parameter.value, weight);
            break;
          }
        }
      }
    }
  }
  var ExpressionBlendType = /* @__PURE__ */ ((ExpressionBlendType2) => {
    ExpressionBlendType2[ExpressionBlendType2["ExpressionBlendType_Add"] = 0] = "ExpressionBlendType_Add";
    ExpressionBlendType2[ExpressionBlendType2["ExpressionBlendType_Multiply"] = 1] = "ExpressionBlendType_Multiply";
    ExpressionBlendType2[ExpressionBlendType2["ExpressionBlendType_Overwrite"] = 2] = "ExpressionBlendType_Overwrite";
    return ExpressionBlendType2;
  })(ExpressionBlendType || {});
  exports2.CubismConfig = void 0;
  ((CubismConfig2) => {
    CubismConfig2.supportMoreMaskDivisions = true;
    CubismConfig2.setOpacityFromMotion = false;
  })(exports2.CubismConfig || (exports2.CubismConfig = {}));
  var CubismMotionCurveTarget = /* @__PURE__ */ ((CubismMotionCurveTarget2) => {
    CubismMotionCurveTarget2[CubismMotionCurveTarget2["CubismMotionCurveTarget_Model"] = 0] = "CubismMotionCurveTarget_Model";
    CubismMotionCurveTarget2[CubismMotionCurveTarget2["CubismMotionCurveTarget_Parameter"] = 1] = "CubismMotionCurveTarget_Parameter";
    CubismMotionCurveTarget2[CubismMotionCurveTarget2["CubismMotionCurveTarget_PartOpacity"] = 2] = "CubismMotionCurveTarget_PartOpacity";
    return CubismMotionCurveTarget2;
  })(CubismMotionCurveTarget || {});
  var CubismMotionSegmentType = /* @__PURE__ */ ((CubismMotionSegmentType2) => {
    CubismMotionSegmentType2[CubismMotionSegmentType2["CubismMotionSegmentType_Linear"] = 0] = "CubismMotionSegmentType_Linear";
    CubismMotionSegmentType2[CubismMotionSegmentType2["CubismMotionSegmentType_Bezier"] = 1] = "CubismMotionSegmentType_Bezier";
    CubismMotionSegmentType2[CubismMotionSegmentType2["CubismMotionSegmentType_Stepped"] = 2] = "CubismMotionSegmentType_Stepped";
    CubismMotionSegmentType2[CubismMotionSegmentType2["CubismMotionSegmentType_InverseStepped"] = 3] = "CubismMotionSegmentType_InverseStepped";
    return CubismMotionSegmentType2;
  })(CubismMotionSegmentType || {});
  class CubismMotionPoint {
    constructor(time = 0, value = 0) {
      this.time = time;
      this.value = value;
    }
  }
  class CubismMotionSegment {
    constructor() {
      this.basePointIndex = 0;
      this.segmentType = 0;
    }
  }
  class CubismMotionCurve {
    constructor() {
      this.id = "";
      this.type = 0;
      this.segmentCount = 0;
      this.baseSegmentIndex = 0;
      this.fadeInTime = 0;
      this.fadeOutTime = 0;
    }
  }
  class CubismMotionEvent {
    constructor() {
      this.fireTime = 0;
      this.value = "";
    }
  }
  class CubismMotionData {
    constructor() {
      this.duration = 0;
      this.loop = false;
      this.curveCount = 0;
      this.eventCount = 0;
      this.fps = 0;
      this.curves = [];
      this.segments = [];
      this.points = [];
      this.events = [];
    }
  }
  class CubismMotionJson {
    constructor(json) {
      this._json = json;
    }
    release() {
      this._json = void 0;
    }
    getMotionDuration() {
      return this._json.Meta.Duration;
    }
    isMotionLoop() {
      return this._json.Meta.Loop || false;
    }
    getEvaluationOptionFlag(flagType) {
      if (EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted == flagType) {
        return !!this._json.Meta.AreBeziersRestricted;
      }
      return false;
    }
    getMotionCurveCount() {
      return this._json.Meta.CurveCount;
    }
    getMotionFps() {
      return this._json.Meta.Fps;
    }
    getMotionTotalSegmentCount() {
      return this._json.Meta.TotalSegmentCount;
    }
    getMotionTotalPointCount() {
      return this._json.Meta.TotalPointCount;
    }
    getMotionFadeInTime() {
      return this._json.Meta.FadeInTime;
    }
    getMotionFadeOutTime() {
      return this._json.Meta.FadeOutTime;
    }
    getMotionCurveTarget(curveIndex) {
      return this._json.Curves[curveIndex].Target;
    }
    getMotionCurveId(curveIndex) {
      return this._json.Curves[curveIndex].Id;
    }
    getMotionCurveFadeInTime(curveIndex) {
      return this._json.Curves[curveIndex].FadeInTime;
    }
    getMotionCurveFadeOutTime(curveIndex) {
      return this._json.Curves[curveIndex].FadeOutTime;
    }
    getMotionCurveSegmentCount(curveIndex) {
      return this._json.Curves[curveIndex].Segments.length;
    }
    getMotionCurveSegment(curveIndex, segmentIndex) {
      return this._json.Curves[curveIndex].Segments[segmentIndex];
    }
    getEventCount() {
      return this._json.Meta.UserDataCount || 0;
    }
    getTotalEventValueSize() {
      return this._json.Meta.TotalUserDataSize;
    }
    getEventTime(userDataIndex) {
      return this._json.UserData[userDataIndex].Time;
    }
    getEventValue(userDataIndex) {
      return this._json.UserData[userDataIndex].Value;
    }
  }
  var EvaluationOptionFlag = /* @__PURE__ */ ((EvaluationOptionFlag2) => {
    EvaluationOptionFlag2[EvaluationOptionFlag2["EvaluationOptionFlag_AreBeziersRistricted"] = 0] = "EvaluationOptionFlag_AreBeziersRistricted";
    return EvaluationOptionFlag2;
  })(EvaluationOptionFlag || {});
  const EffectNameEyeBlink = "EyeBlink";
  const EffectNameLipSync = "LipSync";
  const TargetNameModel = "Model";
  const TargetNameParameter = "Parameter";
  const TargetNamePartOpacity = "PartOpacity";
  const UseOldBeziersCurveMotion = false;
  function lerpPoints(a, b, t) {
    const result = new CubismMotionPoint();
    result.time = a.time + (b.time - a.time) * t;
    result.value = a.value + (b.value - a.value) * t;
    return result;
  }
  function linearEvaluate(points, time) {
    let t = (time - points[0].time) / (points[1].time - points[0].time);
    if (t < 0) {
      t = 0;
    }
    return points[0].value + (points[1].value - points[0].value) * t;
  }
  function bezierEvaluate(points, time) {
    let t = (time - points[0].time) / (points[3].time - points[0].time);
    if (t < 0) {
      t = 0;
    }
    const p01 = lerpPoints(points[0], points[1], t);
    const p12 = lerpPoints(points[1], points[2], t);
    const p23 = lerpPoints(points[2], points[3], t);
    const p012 = lerpPoints(p01, p12, t);
    const p123 = lerpPoints(p12, p23, t);
    return lerpPoints(p012, p123, t).value;
  }
  function bezierEvaluateCardanoInterpretation(points, time) {
    const x = time;
    const x1 = points[0].time;
    const x2 = points[3].time;
    const cx1 = points[1].time;
    const cx2 = points[2].time;
    const a = x2 - 3 * cx2 + 3 * cx1 - x1;
    const b = 3 * cx2 - 6 * cx1 + 3 * x1;
    const c = 3 * cx1 - 3 * x1;
    const d = x1 - x;
    const t = CubismMath.cardanoAlgorithmForBezier(a, b, c, d);
    const p01 = lerpPoints(points[0], points[1], t);
    const p12 = lerpPoints(points[1], points[2], t);
    const p23 = lerpPoints(points[2], points[3], t);
    const p012 = lerpPoints(p01, p12, t);
    const p123 = lerpPoints(p12, p23, t);
    return lerpPoints(p012, p123, t).value;
  }
  function steppedEvaluate(points, time) {
    return points[0].value;
  }
  function inverseSteppedEvaluate(points, time) {
    return points[1].value;
  }
  function evaluateCurve(motionData, index, time) {
    const curve = motionData.curves[index];
    let target = -1;
    const totalSegmentCount = curve.baseSegmentIndex + curve.segmentCount;
    let pointPosition = 0;
    for (let i = curve.baseSegmentIndex; i < totalSegmentCount; ++i) {
      pointPosition = motionData.segments[i].basePointIndex + (motionData.segments[i].segmentType == CubismMotionSegmentType.CubismMotionSegmentType_Bezier ? 3 : 1);
      if (motionData.points[pointPosition].time > time) {
        target = i;
        break;
      }
    }
    if (target == -1) {
      return motionData.points[pointPosition].value;
    }
    const segment = motionData.segments[target];
    return segment.evaluate(motionData.points.slice(segment.basePointIndex), time);
  }
  class CubismMotion extends ACubismMotion {
    constructor() {
      super();
      this._eyeBlinkParameterIds = [];
      this._lipSyncParameterIds = [];
      this._sourceFrameRate = 30;
      this._loopDurationSeconds = -1;
      this._isLoop = false;
      this._isLoopFadeIn = true;
      this._lastWeight = 0;
    }
    static create(json, onFinishedMotionHandler) {
      const ret = new CubismMotion();
      ret.parse(json);
      ret._sourceFrameRate = ret._motionData.fps;
      ret._loopDurationSeconds = ret._motionData.duration;
      ret._onFinishedMotion = onFinishedMotionHandler;
      return ret;
    }
    doUpdateParameters(model, userTimeSeconds, fadeWeight, motionQueueEntry) {
      if (this._modelCurveIdEyeBlink == null) {
        this._modelCurveIdEyeBlink = EffectNameEyeBlink;
      }
      if (this._modelCurveIdLipSync == null) {
        this._modelCurveIdLipSync = EffectNameLipSync;
      }
      let timeOffsetSeconds = userTimeSeconds - motionQueueEntry.getStartTime();
      if (timeOffsetSeconds < 0) {
        timeOffsetSeconds = 0;
      }
      let lipSyncValue = Number.MAX_VALUE;
      let eyeBlinkValue = Number.MAX_VALUE;
      const MaxTargetSize = 64;
      let lipSyncFlags = 0;
      let eyeBlinkFlags = 0;
      if (this._eyeBlinkParameterIds.length > MaxTargetSize) {
        CubismLogDebug("too many eye blink targets : {0}", this._eyeBlinkParameterIds.length);
      }
      if (this._lipSyncParameterIds.length > MaxTargetSize) {
        CubismLogDebug("too many lip sync targets : {0}", this._lipSyncParameterIds.length);
      }
      const tmpFadeIn = this._fadeInSeconds <= 0 ? 1 : CubismMath.getEasingSine((userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / this._fadeInSeconds);
      const tmpFadeOut = this._fadeOutSeconds <= 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine((motionQueueEntry.getEndTime() - userTimeSeconds) / this._fadeOutSeconds);
      let value;
      let c, parameterIndex;
      let time = timeOffsetSeconds;
      if (this._isLoop) {
        while (time > this._motionData.duration) {
          time -= this._motionData.duration;
        }
      }
      const curves = this._motionData.curves;
      for (c = 0; c < this._motionData.curveCount && curves[c].type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model; ++c) {
        value = evaluateCurve(this._motionData, c, time);
        if (curves[c].id == this._modelCurveIdEyeBlink) {
          eyeBlinkValue = value;
        } else if (curves[c].id == this._modelCurveIdLipSync) {
          lipSyncValue = value;
        }
      }
      for (; c < this._motionData.curveCount && curves[c].type == CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter; ++c) {
        parameterIndex = model.getParameterIndex(curves[c].id);
        if (parameterIndex == -1) {
          continue;
        }
        const sourceValue = model.getParameterValueByIndex(parameterIndex);
        value = evaluateCurve(this._motionData, c, time);
        if (eyeBlinkValue != Number.MAX_VALUE) {
          for (let i = 0; i < this._eyeBlinkParameterIds.length && i < MaxTargetSize; ++i) {
            if (this._eyeBlinkParameterIds[i] == curves[c].id) {
              value *= eyeBlinkValue;
              eyeBlinkFlags |= 1 << i;
              break;
            }
          }
        }
        if (lipSyncValue != Number.MAX_VALUE) {
          for (let i = 0; i < this._lipSyncParameterIds.length && i < MaxTargetSize; ++i) {
            if (this._lipSyncParameterIds[i] == curves[c].id) {
              value += lipSyncValue;
              lipSyncFlags |= 1 << i;
              break;
            }
          }
        }
        let v;
        if (curves[c].fadeInTime < 0 && curves[c].fadeOutTime < 0) {
          v = sourceValue + (value - sourceValue) * fadeWeight;
        } else {
          let fin;
          let fout;
          if (curves[c].fadeInTime < 0) {
            fin = tmpFadeIn;
          } else {
            fin = curves[c].fadeInTime == 0 ? 1 : CubismMath.getEasingSine((userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / curves[c].fadeInTime);
          }
          if (curves[c].fadeOutTime < 0) {
            fout = tmpFadeOut;
          } else {
            fout = curves[c].fadeOutTime == 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine((motionQueueEntry.getEndTime() - userTimeSeconds) / curves[c].fadeOutTime);
          }
          const paramWeight = this._weight * fin * fout;
          v = sourceValue + (value - sourceValue) * paramWeight;
        }
        model.setParameterValueByIndex(parameterIndex, v, 1);
      }
      {
        if (eyeBlinkValue != Number.MAX_VALUE) {
          for (let i = 0; i < this._eyeBlinkParameterIds.length && i < MaxTargetSize; ++i) {
            const sourceValue = model.getParameterValueById(this._eyeBlinkParameterIds[i]);
            if (eyeBlinkFlags >> i & 1) {
              continue;
            }
            const v = sourceValue + (eyeBlinkValue - sourceValue) * fadeWeight;
            model.setParameterValueById(this._eyeBlinkParameterIds[i], v);
          }
        }
        if (lipSyncValue != Number.MAX_VALUE) {
          for (let i = 0; i < this._lipSyncParameterIds.length && i < MaxTargetSize; ++i) {
            const sourceValue = model.getParameterValueById(this._lipSyncParameterIds[i]);
            if (lipSyncFlags >> i & 1) {
              continue;
            }
            const v = sourceValue + (lipSyncValue - sourceValue) * fadeWeight;
            model.setParameterValueById(this._lipSyncParameterIds[i], v);
          }
        }
      }
      for (; c < this._motionData.curveCount && curves[c].type == CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity; ++c) {
        value = evaluateCurve(this._motionData, c, time);
        if (exports2.CubismConfig.setOpacityFromMotion) {
          model.setPartOpacityById(curves[c].id, value);
        } else {
          parameterIndex = model.getParameterIndex(curves[c].id);
          if (parameterIndex == -1) {
            continue;
          }
          model.setParameterValueByIndex(parameterIndex, value);
        }
      }
      if (timeOffsetSeconds >= this._motionData.duration) {
        if (this._isLoop) {
          motionQueueEntry.setStartTime(userTimeSeconds);
          if (this._isLoopFadeIn) {
            motionQueueEntry.setFadeInStartTime(userTimeSeconds);
          }
        } else {
          if (this._onFinishedMotion) {
            this._onFinishedMotion(this);
          }
          motionQueueEntry.setIsFinished(true);
        }
      }
      this._lastWeight = fadeWeight;
    }
    setIsLoop(loop) {
      this._isLoop = loop;
    }
    isLoop() {
      return this._isLoop;
    }
    setIsLoopFadeIn(loopFadeIn) {
      this._isLoopFadeIn = loopFadeIn;
    }
    isLoopFadeIn() {
      return this._isLoopFadeIn;
    }
    getDuration() {
      return this._isLoop ? -1 : this._loopDurationSeconds;
    }
    getLoopDuration() {
      return this._loopDurationSeconds;
    }
    setParameterFadeInTime(parameterId, value) {
      const curves = this._motionData.curves;
      for (let i = 0; i < this._motionData.curveCount; ++i) {
        if (parameterId == curves[i].id) {
          curves[i].fadeInTime = value;
          return;
        }
      }
    }
    setParameterFadeOutTime(parameterId, value) {
      const curves = this._motionData.curves;
      for (let i = 0; i < this._motionData.curveCount; ++i) {
        if (parameterId == curves[i].id) {
          curves[i].fadeOutTime = value;
          return;
        }
      }
    }
    getParameterFadeInTime(parameterId) {
      const curves = this._motionData.curves;
      for (let i = 0; i < this._motionData.curveCount; ++i) {
        if (parameterId == curves[i].id) {
          return curves[i].fadeInTime;
        }
      }
      return -1;
    }
    getParameterFadeOutTime(parameterId) {
      const curves = this._motionData.curves;
      for (let i = 0; i < this._motionData.curveCount; ++i) {
        if (parameterId == curves[i].id) {
          return curves[i].fadeOutTime;
        }
      }
      return -1;
    }
    setEffectIds(eyeBlinkParameterIds, lipSyncParameterIds) {
      this._eyeBlinkParameterIds = eyeBlinkParameterIds;
      this._lipSyncParameterIds = lipSyncParameterIds;
    }
    release() {
      this._motionData = void 0;
    }
    parse(motionJson) {
      this._motionData = new CubismMotionData();
      let json = new CubismMotionJson(motionJson);
      this._motionData.duration = json.getMotionDuration();
      this._motionData.loop = json.isMotionLoop();
      this._motionData.curveCount = json.getMotionCurveCount();
      this._motionData.fps = json.getMotionFps();
      this._motionData.eventCount = json.getEventCount();
      const areBeziersRestructed = json.getEvaluationOptionFlag(EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted);
      const fadeInSeconds = json.getMotionFadeInTime();
      const fadeOutSeconds = json.getMotionFadeOutTime();
      if (fadeInSeconds !== void 0) {
        this._fadeInSeconds = fadeInSeconds < 0 ? 1 : fadeInSeconds;
      } else {
        this._fadeInSeconds = 1;
      }
      if (fadeOutSeconds !== void 0) {
        this._fadeOutSeconds = fadeOutSeconds < 0 ? 1 : fadeOutSeconds;
      } else {
        this._fadeOutSeconds = 1;
      }
      this._motionData.curves = Array.from({ length: this._motionData.curveCount }).map(() => new CubismMotionCurve());
      this._motionData.segments = Array.from({ length: json.getMotionTotalSegmentCount() }).map(() => new CubismMotionSegment());
      this._motionData.events = Array.from({ length: this._motionData.eventCount }).map(() => new CubismMotionEvent());
      this._motionData.points = [];
      let totalPointCount = 0;
      let totalSegmentCount = 0;
      for (let curveCount = 0; curveCount < this._motionData.curveCount; ++curveCount) {
        const curve = this._motionData.curves[curveCount];
        switch (json.getMotionCurveTarget(curveCount)) {
          case TargetNameModel:
            curve.type = CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
            break;
          case TargetNameParameter:
            curve.type = CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter;
            break;
          case TargetNamePartOpacity:
            curve.type = CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity;
            break;
          default:
            CubismLogWarning('Warning : Unable to get segment type from Curve! The number of "CurveCount" may be incorrect!');
        }
        curve.id = json.getMotionCurveId(curveCount);
        curve.baseSegmentIndex = totalSegmentCount;
        const fadeInTime = json.getMotionCurveFadeInTime(curveCount);
        const fadeOutTime = json.getMotionCurveFadeOutTime(curveCount);
        curve.fadeInTime = fadeInTime !== void 0 ? fadeInTime : -1;
        curve.fadeOutTime = fadeOutTime !== void 0 ? fadeOutTime : -1;
        for (let segmentPosition = 0; segmentPosition < json.getMotionCurveSegmentCount(curveCount); ) {
          if (segmentPosition == 0) {
            this._motionData.segments[totalSegmentCount].basePointIndex = totalPointCount;
            this._motionData.points[totalPointCount] = new CubismMotionPoint(json.getMotionCurveSegment(curveCount, segmentPosition), json.getMotionCurveSegment(curveCount, segmentPosition + 1));
            totalPointCount += 1;
            segmentPosition += 2;
          } else {
            this._motionData.segments[totalSegmentCount].basePointIndex = totalPointCount - 1;
          }
          const segment = json.getMotionCurveSegment(curveCount, segmentPosition);
          switch (segment) {
            case CubismMotionSegmentType.CubismMotionSegmentType_Linear: {
              this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Linear;
              this._motionData.segments[totalSegmentCount].evaluate = linearEvaluate;
              this._motionData.points[totalPointCount] = new CubismMotionPoint(json.getMotionCurveSegment(curveCount, segmentPosition + 1), json.getMotionCurveSegment(curveCount, segmentPosition + 2));
              totalPointCount += 1;
              segmentPosition += 3;
              break;
            }
            case CubismMotionSegmentType.CubismMotionSegmentType_Bezier: {
              this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Bezier;
              if (areBeziersRestructed || UseOldBeziersCurveMotion) {
                this._motionData.segments[totalSegmentCount].evaluate = bezierEvaluate;
              } else {
                this._motionData.segments[totalSegmentCount].evaluate = bezierEvaluateCardanoInterpretation;
              }
              this._motionData.points[totalPointCount] = new CubismMotionPoint(json.getMotionCurveSegment(curveCount, segmentPosition + 1), json.getMotionCurveSegment(curveCount, segmentPosition + 2));
              this._motionData.points[totalPointCount + 1] = new CubismMotionPoint(json.getMotionCurveSegment(curveCount, segmentPosition + 3), json.getMotionCurveSegment(curveCount, segmentPosition + 4));
              this._motionData.points[totalPointCount + 2] = new CubismMotionPoint(json.getMotionCurveSegment(curveCount, segmentPosition + 5), json.getMotionCurveSegment(curveCount, segmentPosition + 6));
              totalPointCount += 3;
              segmentPosition += 7;
              break;
            }
            case CubismMotionSegmentType.CubismMotionSegmentType_Stepped: {
              this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Stepped;
              this._motionData.segments[totalSegmentCount].evaluate = steppedEvaluate;
              this._motionData.points[totalPointCount] = new CubismMotionPoint(json.getMotionCurveSegment(curveCount, segmentPosition + 1), json.getMotionCurveSegment(curveCount, segmentPosition + 2));
              totalPointCount += 1;
              segmentPosition += 3;
              break;
            }
            case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped: {
              this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped;
              this._motionData.segments[totalSegmentCount].evaluate = inverseSteppedEvaluate;
              this._motionData.points[totalPointCount] = new CubismMotionPoint(json.getMotionCurveSegment(curveCount, segmentPosition + 1), json.getMotionCurveSegment(curveCount, segmentPosition + 2));
              totalPointCount += 1;
              segmentPosition += 3;
              break;
            }
          }
          ++curve.segmentCount;
          ++totalSegmentCount;
        }
        this._motionData.curves.push(curve);
      }
      for (let userdatacount = 0; userdatacount < json.getEventCount(); ++userdatacount) {
        this._motionData.events[userdatacount].fireTime = json.getEventTime(userdatacount);
        this._motionData.events[userdatacount].value = json.getEventValue(userdatacount);
      }
      json.release();
    }
    getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
      this._firedEventValues.length = 0;
      for (let u = 0; u < this._motionData.eventCount; ++u) {
        if (this._motionData.events[u].fireTime > beforeCheckTimeSeconds && this._motionData.events[u].fireTime <= motionTimeSeconds) {
          this._firedEventValues.push(this._motionData.events[u].value);
        }
      }
      return this._firedEventValues;
    }
  }
  class CubismMotionQueueEntry {
    constructor() {
      this._autoDelete = false;
      this._available = true;
      this._finished = false;
      this._started = false;
      this._startTimeSeconds = -1;
      this._fadeInStartTimeSeconds = 0;
      this._endTimeSeconds = -1;
      this._stateTimeSeconds = 0;
      this._stateWeight = 0;
      this._lastEventCheckSeconds = 0;
      this._motionQueueEntryHandle = this;
      this._fadeOutSeconds = 0;
      this._isTriggeredFadeOut = false;
    }
    release() {
      if (this._autoDelete && this._motion) {
        this._motion.release();
      }
    }
    setFadeOut(fadeOutSeconds) {
      this._fadeOutSeconds = fadeOutSeconds;
      this._isTriggeredFadeOut = true;
    }
    startFadeOut(fadeOutSeconds, userTimeSeconds) {
      const newEndTimeSeconds = userTimeSeconds + fadeOutSeconds;
      this._isTriggeredFadeOut = true;
      if (this._endTimeSeconds < 0 || newEndTimeSeconds < this._endTimeSeconds) {
        this._endTimeSeconds = newEndTimeSeconds;
      }
    }
    isFinished() {
      return this._finished;
    }
    isStarted() {
      return this._started;
    }
    getStartTime() {
      return this._startTimeSeconds;
    }
    getFadeInStartTime() {
      return this._fadeInStartTimeSeconds;
    }
    getEndTime() {
      return this._endTimeSeconds;
    }
    setStartTime(startTime) {
      this._startTimeSeconds = startTime;
    }
    setFadeInStartTime(startTime) {
      this._fadeInStartTimeSeconds = startTime;
    }
    setEndTime(endTime) {
      this._endTimeSeconds = endTime;
    }
    setIsFinished(f) {
      this._finished = f;
    }
    setIsStarted(f) {
      this._started = f;
    }
    isAvailable() {
      return this._available;
    }
    setIsAvailable(v) {
      this._available = v;
    }
    setState(timeSeconds, weight) {
      this._stateTimeSeconds = timeSeconds;
      this._stateWeight = weight;
    }
    getStateTime() {
      return this._stateTimeSeconds;
    }
    getStateWeight() {
      return this._stateWeight;
    }
    getLastCheckEventSeconds() {
      return this._lastEventCheckSeconds;
    }
    setLastCheckEventSeconds(checkSeconds) {
      this._lastEventCheckSeconds = checkSeconds;
    }
    isTriggeredFadeOut() {
      return this._isTriggeredFadeOut;
    }
    getFadeOutSeconds() {
      return this._fadeOutSeconds;
    }
  }
  class CubismMotionQueueManager {
    constructor() {
      this._userTimeSeconds = 0;
      this._eventCustomData = null;
      this._motions = [];
    }
    release() {
      for (let i = 0; i < this._motions.length; ++i) {
        if (this._motions[i]) {
          this._motions[i].release();
        }
      }
      this._motions = void 0;
    }
    startMotion(motion, autoDelete, userTimeSeconds) {
      if (motion == null) {
        return InvalidMotionQueueEntryHandleValue;
      }
      let motionQueueEntry;
      for (let i = 0; i < this._motions.length; ++i) {
        motionQueueEntry = this._motions[i];
        if (motionQueueEntry == null) {
          continue;
        }
        motionQueueEntry.setFadeOut(motionQueueEntry._motion.getFadeOutTime());
      }
      motionQueueEntry = new CubismMotionQueueEntry();
      motionQueueEntry._autoDelete = autoDelete;
      motionQueueEntry._motion = motion;
      this._motions.push(motionQueueEntry);
      return motionQueueEntry._motionQueueEntryHandle;
    }
    isFinished() {
      let i = 0;
      while (i < this._motions.length) {
        const motionQueueEntry = this._motions[i];
        if (motionQueueEntry == null) {
          this._motions.splice(i, 1);
          continue;
        }
        const motion = motionQueueEntry._motion;
        if (motion == null) {
          motionQueueEntry.release();
          this._motions.splice(i, 1);
          continue;
        }
        if (!motionQueueEntry.isFinished()) {
          return false;
        }
        i++;
      }
      return true;
    }
    isFinishedByHandle(motionQueueEntryNumber) {
      for (let i = 0; i < this._motions.length; i++) {
        const motionQueueEntry = this._motions[i];
        if (motionQueueEntry == null) {
          continue;
        }
        if (motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber && !motionQueueEntry.isFinished()) {
          return false;
        }
      }
      return true;
    }
    stopAllMotions() {
      for (let i = 0; i < this._motions.length; i++) {
        const motionQueueEntry = this._motions[i];
        if (motionQueueEntry != null) {
          motionQueueEntry.release();
        }
      }
      this._motions = [];
    }
    getCubismMotionQueueEntry(motionQueueEntryNumber) {
      return this._motions.find((entry) => entry != null && entry._motionQueueEntryHandle == motionQueueEntryNumber);
    }
    setEventCallback(callback, customData = null) {
      this._eventCallBack = callback;
      this._eventCustomData = customData;
    }
    doUpdateMotion(model, userTimeSeconds) {
      let updated = false;
      let i = 0;
      while (i < this._motions.length) {
        const motionQueueEntry = this._motions[i];
        if (motionQueueEntry == null) {
          this._motions.splice(i, 1);
          continue;
        }
        const motion = motionQueueEntry._motion;
        if (motion == null) {
          motionQueueEntry.release();
          this._motions.splice(i, 1);
          continue;
        }
        motion.updateParameters(model, motionQueueEntry, userTimeSeconds);
        updated = true;
        const firedList = motion.getFiredEvent(motionQueueEntry.getLastCheckEventSeconds() - motionQueueEntry.getStartTime(), userTimeSeconds - motionQueueEntry.getStartTime());
        for (let i2 = 0; i2 < firedList.length; ++i2) {
          this._eventCallBack(this, firedList[i2], this._eventCustomData);
        }
        motionQueueEntry.setLastCheckEventSeconds(userTimeSeconds);
        if (motionQueueEntry.isFinished()) {
          motionQueueEntry.release();
          this._motions.splice(i, 1);
        } else {
          if (motionQueueEntry.isTriggeredFadeOut()) {
            motionQueueEntry.startFadeOut(motionQueueEntry.getFadeOutSeconds(), userTimeSeconds);
          }
          i++;
        }
      }
      return updated;
    }
  }
  const InvalidMotionQueueEntryHandleValue = -1;
  class CubismMotionManager extends CubismMotionQueueManager {
    constructor() {
      super();
      this._currentPriority = 0;
      this._reservePriority = 0;
    }
    getCurrentPriority() {
      return this._currentPriority;
    }
    getReservePriority() {
      return this._reservePriority;
    }
    setReservePriority(val) {
      this._reservePriority = val;
    }
    startMotionPriority(motion, autoDelete, priority) {
      if (priority == this._reservePriority) {
        this._reservePriority = 0;
      }
      this._currentPriority = priority;
      return super.startMotion(motion, autoDelete, this._userTimeSeconds);
    }
    updateMotion(model, deltaTimeSeconds) {
      this._userTimeSeconds += deltaTimeSeconds;
      const updated = super.doUpdateMotion(model, this._userTimeSeconds);
      if (this.isFinished()) {
        this._currentPriority = 0;
      }
      return updated;
    }
    reserveMotion(priority) {
      if (priority <= this._reservePriority || priority <= this._currentPriority) {
        return false;
      }
      this._reservePriority = priority;
      return true;
    }
  }
  var CubismPhysicsTargetType = /* @__PURE__ */ ((CubismPhysicsTargetType2) => {
    CubismPhysicsTargetType2[CubismPhysicsTargetType2["CubismPhysicsTargetType_Parameter"] = 0] = "CubismPhysicsTargetType_Parameter";
    return CubismPhysicsTargetType2;
  })(CubismPhysicsTargetType || {});
  var CubismPhysicsSource = /* @__PURE__ */ ((CubismPhysicsSource2) => {
    CubismPhysicsSource2[CubismPhysicsSource2["CubismPhysicsSource_X"] = 0] = "CubismPhysicsSource_X";
    CubismPhysicsSource2[CubismPhysicsSource2["CubismPhysicsSource_Y"] = 1] = "CubismPhysicsSource_Y";
    CubismPhysicsSource2[CubismPhysicsSource2["CubismPhysicsSource_Angle"] = 2] = "CubismPhysicsSource_Angle";
    return CubismPhysicsSource2;
  })(CubismPhysicsSource || {});
  class PhysicsJsonEffectiveForces {
    constructor() {
      this.gravity = new CubismVector2(0, 0);
      this.wind = new CubismVector2(0, 0);
    }
  }
  class CubismPhysicsParticle {
    constructor() {
      this.initialPosition = new CubismVector2(0, 0);
      this.position = new CubismVector2(0, 0);
      this.lastPosition = new CubismVector2(0, 0);
      this.lastGravity = new CubismVector2(0, 0);
      this.force = new CubismVector2(0, 0);
      this.velocity = new CubismVector2(0, 0);
    }
  }
  class CubismPhysicsSubRig {
    constructor() {
      this.normalizationPosition = {};
      this.normalizationAngle = {};
    }
  }
  class CubismPhysicsInput {
    constructor() {
      this.source = {};
    }
  }
  class CubismPhysicsOutput {
    constructor() {
      this.destination = {};
      this.translationScale = new CubismVector2(0, 0);
    }
  }
  class CubismPhysicsRig {
    constructor() {
      this.settings = [];
      this.inputs = [];
      this.outputs = [];
      this.particles = [];
      this.gravity = new CubismVector2(0, 0);
      this.wind = new CubismVector2(0, 0);
    }
  }
  class CubismPhysicsJson {
    constructor(json) {
      this._json = json;
    }
    release() {
      this._json = void 0;
    }
    getGravity() {
      const ret = new CubismVector2(0, 0);
      ret.x = this._json.Meta.EffectiveForces.Gravity.X;
      ret.y = this._json.Meta.EffectiveForces.Gravity.Y;
      return ret;
    }
    getWind() {
      const ret = new CubismVector2(0, 0);
      ret.x = this._json.Meta.EffectiveForces.Wind.X;
      ret.y = this._json.Meta.EffectiveForces.Wind.Y;
      return ret;
    }
    getSubRigCount() {
      return this._json.Meta.PhysicsSettingCount;
    }
    getTotalInputCount() {
      return this._json.Meta.TotalInputCount;
    }
    getTotalOutputCount() {
      return this._json.Meta.TotalOutputCount;
    }
    getVertexCount() {
      return this._json.Meta.VertexCount;
    }
    getNormalizationPositionMinimumValue(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Position.Minimum;
    }
    getNormalizationPositionMaximumValue(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Position.Maximum;
    }
    getNormalizationPositionDefaultValue(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Position.Default;
    }
    getNormalizationAngleMinimumValue(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Angle.Minimum;
    }
    getNormalizationAngleMaximumValue(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Angle.Maximum;
    }
    getNormalizationAngleDefaultValue(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Angle.Default;
    }
    getInputCount(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Input.length;
    }
    getInputWeight(physicsSettingIndex, inputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Weight;
    }
    getInputReflect(physicsSettingIndex, inputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Reflect;
    }
    getInputType(physicsSettingIndex, inputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Type;
    }
    getInputSourceId(physicsSettingIndex, inputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Source.Id;
    }
    getOutputCount(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Output.length;
    }
    getOutputVertexIndex(physicsSettingIndex, outputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].VertexIndex;
    }
    getOutputAngleScale(physicsSettingIndex, outputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Scale;
    }
    getOutputWeight(physicsSettingIndex, outputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Weight;
    }
    getOutputDestinationId(physicsSettingIndex, outputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Destination.Id;
    }
    getOutputType(physicsSettingIndex, outputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Type;
    }
    getOutputReflect(physicsSettingIndex, outputIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Reflect;
    }
    getParticleCount(physicsSettingIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Vertices.length;
    }
    getParticleMobility(physicsSettingIndex, vertexIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Mobility;
    }
    getParticleDelay(physicsSettingIndex, vertexIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Delay;
    }
    getParticleAcceleration(physicsSettingIndex, vertexIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Acceleration;
    }
    getParticleRadius(physicsSettingIndex, vertexIndex) {
      return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Radius;
    }
    getParticlePosition(physicsSettingIndex, vertexIndex) {
      const ret = new CubismVector2(0, 0);
      ret.x = this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Position.X;
      ret.y = this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Position.Y;
      return ret;
    }
  }
  const PhysicsTypeTagX = "X";
  const PhysicsTypeTagY = "Y";
  const PhysicsTypeTagAngle = "Angle";
  const AirResistance = 5;
  const MaximumWeight = 100;
  const MovementThreshold = 1e-3;
  class CubismPhysics {
    static create(json) {
      const ret = new CubismPhysics();
      ret.parse(json);
      ret._physicsRig.gravity.y = 0;
      return ret;
    }
    evaluate(model, deltaTimeSeconds) {
      let totalAngle;
      let weight;
      let radAngle;
      let outputValue;
      const totalTranslation = new CubismVector2();
      let currentSetting;
      let currentInput;
      let currentOutput;
      let currentParticles;
      let parameterValue;
      let parameterMaximumValue;
      let parameterMinimumValue;
      let parameterDefaultValue;
      parameterValue = model.getModel().parameters.values;
      parameterMaximumValue = model.getModel().parameters.maximumValues;
      parameterMinimumValue = model.getModel().parameters.minimumValues;
      parameterDefaultValue = model.getModel().parameters.defaultValues;
      for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
        totalAngle = { angle: 0 };
        totalTranslation.x = 0;
        totalTranslation.y = 0;
        currentSetting = this._physicsRig.settings[settingIndex];
        currentInput = this._physicsRig.inputs.slice(currentSetting.baseInputIndex);
        currentOutput = this._physicsRig.outputs.slice(currentSetting.baseOutputIndex);
        currentParticles = this._physicsRig.particles.slice(currentSetting.baseParticleIndex);
        for (let i = 0; i < currentSetting.inputCount; ++i) {
          weight = currentInput[i].weight / MaximumWeight;
          if (currentInput[i].sourceParameterIndex == -1) {
            currentInput[i].sourceParameterIndex = model.getParameterIndex(currentInput[i].source.id);
          }
          currentInput[i].getNormalizedParameterValue(totalTranslation, totalAngle, parameterValue[currentInput[i].sourceParameterIndex], parameterMinimumValue[currentInput[i].sourceParameterIndex], parameterMaximumValue[currentInput[i].sourceParameterIndex], parameterDefaultValue[currentInput[i].sourceParameterIndex], currentSetting.normalizationPosition, currentSetting.normalizationAngle, currentInput[i].reflect, weight);
        }
        radAngle = CubismMath.degreesToRadian(-totalAngle.angle);
        totalTranslation.x = totalTranslation.x * CubismMath.cos(radAngle) - totalTranslation.y * CubismMath.sin(radAngle);
        totalTranslation.y = totalTranslation.x * CubismMath.sin(radAngle) + totalTranslation.y * CubismMath.cos(radAngle);
        updateParticles(currentParticles, currentSetting.particleCount, totalTranslation, totalAngle.angle, this._options.wind, MovementThreshold * currentSetting.normalizationPosition.maximum, deltaTimeSeconds, AirResistance);
        for (let i = 0; i < currentSetting.outputCount; ++i) {
          const particleIndex = currentOutput[i].vertexIndex;
          if (particleIndex < 1 || particleIndex >= currentSetting.particleCount) {
            break;
          }
          if (currentOutput[i].destinationParameterIndex == -1) {
            currentOutput[i].destinationParameterIndex = model.getParameterIndex(currentOutput[i].destination.id);
          }
          const translation = new CubismVector2();
          translation.x = currentParticles[particleIndex].position.x - currentParticles[particleIndex - 1].position.x;
          translation.y = currentParticles[particleIndex].position.y - currentParticles[particleIndex - 1].position.y;
          outputValue = currentOutput[i].getValue(translation, currentParticles, particleIndex, currentOutput[i].reflect, this._options.gravity);
          const destinationParameterIndex = currentOutput[i].destinationParameterIndex;
          const outParameterValue = !Float32Array.prototype.slice && "subarray" in Float32Array.prototype ? JSON.parse(JSON.stringify(parameterValue.subarray(destinationParameterIndex))) : parameterValue.slice(destinationParameterIndex);
          updateOutputParameterValue(outParameterValue, parameterMinimumValue[destinationParameterIndex], parameterMaximumValue[destinationParameterIndex], outputValue, currentOutput[i]);
          for (let offset = destinationParameterIndex, outParamIndex = 0; offset < parameterValue.length; offset++, outParamIndex++) {
            parameterValue[offset] = outParameterValue[outParamIndex];
          }
        }
      }
    }
    setOptions(options) {
      this._options = options;
    }
    getOption() {
      return this._options;
    }
    constructor() {
      this._options = new Options();
      this._options.gravity.y = -1;
      this._options.gravity.x = 0;
      this._options.wind.x = 0;
      this._options.wind.y = 0;
    }
    release() {
      this._physicsRig = void 0;
    }
    parse(physicsJson) {
      this._physicsRig = new CubismPhysicsRig();
      let json = new CubismPhysicsJson(physicsJson);
      this._physicsRig.gravity = json.getGravity();
      this._physicsRig.wind = json.getWind();
      this._physicsRig.subRigCount = json.getSubRigCount();
      let inputIndex = 0, outputIndex = 0, particleIndex = 0;
      for (let i = 0; i < this._physicsRig.subRigCount; ++i) {
        const setting = new CubismPhysicsSubRig();
        setting.normalizationPosition.minimum = json.getNormalizationPositionMinimumValue(i);
        setting.normalizationPosition.maximum = json.getNormalizationPositionMaximumValue(i);
        setting.normalizationPosition.defalut = json.getNormalizationPositionDefaultValue(i);
        setting.normalizationAngle.minimum = json.getNormalizationAngleMinimumValue(i);
        setting.normalizationAngle.maximum = json.getNormalizationAngleMaximumValue(i);
        setting.normalizationAngle.defalut = json.getNormalizationAngleDefaultValue(i);
        setting.inputCount = json.getInputCount(i);
        setting.baseInputIndex = inputIndex;
        inputIndex += setting.inputCount;
        for (let j = 0; j < setting.inputCount; ++j) {
          const input = new CubismPhysicsInput();
          input.sourceParameterIndex = -1;
          input.weight = json.getInputWeight(i, j);
          input.reflect = json.getInputReflect(i, j);
          switch (json.getInputType(i, j)) {
            case PhysicsTypeTagX:
              input.type = CubismPhysicsSource.CubismPhysicsSource_X;
              input.getNormalizedParameterValue = getInputTranslationXFromNormalizedParameterValue;
              break;
            case PhysicsTypeTagY:
              input.type = CubismPhysicsSource.CubismPhysicsSource_Y;
              input.getNormalizedParameterValue = getInputTranslationYFromNormalizedParamterValue;
              break;
            case PhysicsTypeTagAngle:
              input.type = CubismPhysicsSource.CubismPhysicsSource_Angle;
              input.getNormalizedParameterValue = getInputAngleFromNormalizedParameterValue;
              break;
          }
          input.source.targetType = CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;
          input.source.id = json.getInputSourceId(i, j);
          this._physicsRig.inputs.push(input);
        }
        setting.outputCount = json.getOutputCount(i);
        setting.baseOutputIndex = outputIndex;
        outputIndex += setting.outputCount;
        for (let j = 0; j < setting.outputCount; ++j) {
          const output = new CubismPhysicsOutput();
          output.destinationParameterIndex = -1;
          output.vertexIndex = json.getOutputVertexIndex(i, j);
          output.angleScale = json.getOutputAngleScale(i, j);
          output.weight = json.getOutputWeight(i, j);
          output.destination.targetType = CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;
          output.destination.id = json.getOutputDestinationId(i, j);
          switch (json.getOutputType(i, j)) {
            case PhysicsTypeTagX:
              output.type = CubismPhysicsSource.CubismPhysicsSource_X;
              output.getValue = getOutputTranslationX;
              output.getScale = getOutputScaleTranslationX;
              break;
            case PhysicsTypeTagY:
              output.type = CubismPhysicsSource.CubismPhysicsSource_Y;
              output.getValue = getOutputTranslationY;
              output.getScale = getOutputScaleTranslationY;
              break;
            case PhysicsTypeTagAngle:
              output.type = CubismPhysicsSource.CubismPhysicsSource_Angle;
              output.getValue = getOutputAngle;
              output.getScale = getOutputScaleAngle;
              break;
          }
          output.reflect = json.getOutputReflect(i, j);
          this._physicsRig.outputs.push(output);
        }
        setting.particleCount = json.getParticleCount(i);
        setting.baseParticleIndex = particleIndex;
        particleIndex += setting.particleCount;
        for (let j = 0; j < setting.particleCount; ++j) {
          const particle = new CubismPhysicsParticle();
          particle.mobility = json.getParticleMobility(i, j);
          particle.delay = json.getParticleDelay(i, j);
          particle.acceleration = json.getParticleAcceleration(i, j);
          particle.radius = json.getParticleRadius(i, j);
          particle.position = json.getParticlePosition(i, j);
          this._physicsRig.particles.push(particle);
        }
        this._physicsRig.settings.push(setting);
      }
      this.initialize();
      json.release();
    }
    initialize() {
      let strand;
      let currentSetting;
      let radius;
      for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
        currentSetting = this._physicsRig.settings[settingIndex];
        strand = this._physicsRig.particles.slice(currentSetting.baseParticleIndex);
        strand[0].initialPosition = new CubismVector2(0, 0);
        strand[0].lastPosition = new CubismVector2(strand[0].initialPosition.x, strand[0].initialPosition.y);
        strand[0].lastGravity = new CubismVector2(0, -1);
        strand[0].lastGravity.y *= -1;
        strand[0].velocity = new CubismVector2(0, 0);
        strand[0].force = new CubismVector2(0, 0);
        for (let i = 1; i < currentSetting.particleCount; ++i) {
          radius = new CubismVector2(0, 0);
          radius.y = strand[i].radius;
          strand[i].initialPosition = new CubismVector2(strand[i - 1].initialPosition.x + radius.x, strand[i - 1].initialPosition.y + radius.y);
          strand[i].position = new CubismVector2(strand[i].initialPosition.x, strand[i].initialPosition.y);
          strand[i].lastPosition = new CubismVector2(strand[i].initialPosition.x, strand[i].initialPosition.y);
          strand[i].lastGravity = new CubismVector2(0, -1);
          strand[i].lastGravity.y *= -1;
          strand[i].velocity = new CubismVector2(0, 0);
          strand[i].force = new CubismVector2(0, 0);
        }
      }
    }
  }
  class Options {
    constructor() {
      this.gravity = new CubismVector2(0, 0);
      this.wind = new CubismVector2(0, 0);
    }
  }
  function getInputTranslationXFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
    targetTranslation.x += normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition.minimum, normalizationPosition.maximum, normalizationPosition.defalut, isInverted) * weight;
  }
  function getInputTranslationYFromNormalizedParamterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
    targetTranslation.y += normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition.minimum, normalizationPosition.maximum, normalizationPosition.defalut, isInverted) * weight;
  }
  function getInputAngleFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizaitionPosition, normalizationAngle, isInverted, weight) {
    targetAngle.angle += normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationAngle.minimum, normalizationAngle.maximum, normalizationAngle.defalut, isInverted) * weight;
  }
  function getOutputTranslationX(translation, particles, particleIndex, isInverted, parentGravity) {
    let outputValue = translation.x;
    if (isInverted) {
      outputValue *= -1;
    }
    return outputValue;
  }
  function getOutputTranslationY(translation, particles, particleIndex, isInverted, parentGravity) {
    let outputValue = translation.y;
    if (isInverted) {
      outputValue *= -1;
    }
    return outputValue;
  }
  function getOutputAngle(translation, particles, particleIndex, isInverted, parentGravity) {
    let outputValue;
    if (particleIndex >= 2) {
      parentGravity = particles[particleIndex - 1].position.substract(particles[particleIndex - 2].position);
    } else {
      parentGravity = parentGravity.multiplyByScaler(-1);
    }
    outputValue = CubismMath.directionToRadian(parentGravity, translation);
    if (isInverted) {
      outputValue *= -1;
    }
    return outputValue;
  }
  function getRangeValue(min, max) {
    return Math.abs(Math.max(min, max) - Math.min(min, max));
  }
  function getDefaultValue(min, max) {
    const minValue = Math.min(min, max);
    return minValue + getRangeValue(min, max) / 2;
  }
  function getOutputScaleTranslationX(translationScale, angleScale) {
    return translationScale.x;
  }
  function getOutputScaleTranslationY(translationScale, angleScale) {
    return translationScale.y;
  }
  function getOutputScaleAngle(translationScale, angleScale) {
    return angleScale;
  }
  function updateParticles(strand, strandCount, totalTranslation, totalAngle, windDirection, thresholdValue, deltaTimeSeconds, airResistance) {
    let totalRadian;
    let delay;
    let radian;
    let currentGravity;
    let direction = new CubismVector2(0, 0);
    let velocity = new CubismVector2(0, 0);
    let force = new CubismVector2(0, 0);
    let newDirection = new CubismVector2(0, 0);
    strand[0].position = new CubismVector2(totalTranslation.x, totalTranslation.y);
    totalRadian = CubismMath.degreesToRadian(totalAngle);
    currentGravity = CubismMath.radianToDirection(totalRadian);
    currentGravity.normalize();
    for (let i = 1; i < strandCount; ++i) {
      strand[i].force = currentGravity.multiplyByScaler(strand[i].acceleration).add(windDirection);
      strand[i].lastPosition = new CubismVector2(strand[i].position.x, strand[i].position.y);
      delay = strand[i].delay * deltaTimeSeconds * 30;
      direction = strand[i].position.substract(strand[i - 1].position);
      radian = CubismMath.directionToRadian(strand[i].lastGravity, currentGravity) / airResistance;
      direction.x = CubismMath.cos(radian) * direction.x - direction.y * CubismMath.sin(radian);
      direction.y = CubismMath.sin(radian) * direction.x + direction.y * CubismMath.cos(radian);
      strand[i].position = strand[i - 1].position.add(direction);
      velocity = strand[i].velocity.multiplyByScaler(delay);
      force = strand[i].force.multiplyByScaler(delay).multiplyByScaler(delay);
      strand[i].position = strand[i].position.add(velocity).add(force);
      newDirection = strand[i].position.substract(strand[i - 1].position);
      newDirection.normalize();
      strand[i].position = strand[i - 1].position.add(newDirection.multiplyByScaler(strand[i].radius));
      if (CubismMath.abs(strand[i].position.x) < thresholdValue) {
        strand[i].position.x = 0;
      }
      if (delay != 0) {
        strand[i].velocity = strand[i].position.substract(strand[i].lastPosition);
        strand[i].velocity = strand[i].velocity.divisionByScalar(delay);
        strand[i].velocity = strand[i].velocity.multiplyByScaler(strand[i].mobility);
      }
      strand[i].force = new CubismVector2(0, 0);
      strand[i].lastGravity = new CubismVector2(currentGravity.x, currentGravity.y);
    }
  }
  function updateOutputParameterValue(parameterValue, parameterValueMinimum, parameterValueMaximum, translation, output) {
    let outputScale;
    let value;
    let weight;
    outputScale = output.getScale(output.translationScale, output.angleScale);
    value = translation * outputScale;
    if (value < parameterValueMinimum) {
      if (value < output.valueBelowMinimum) {
        output.valueBelowMinimum = value;
      }
      value = parameterValueMinimum;
    } else if (value > parameterValueMaximum) {
      if (value > output.valueExceededMaximum) {
        output.valueExceededMaximum = value;
      }
      value = parameterValueMaximum;
    }
    weight = output.weight / MaximumWeight;
    if (weight >= 1) {
      parameterValue[0] = value;
    } else {
      value = parameterValue[0] * (1 - weight) + value * weight;
      parameterValue[0] = value;
    }
  }
  function normalizeParameterValue(value, parameterMinimum, parameterMaximum, parameterDefault, normalizedMinimum, normalizedMaximum, normalizedDefault, isInverted) {
    let result = 0;
    const maxValue = CubismMath.max(parameterMaximum, parameterMinimum);
    if (maxValue < value) {
      value = maxValue;
    }
    const minValue = CubismMath.min(parameterMaximum, parameterMinimum);
    if (minValue > value) {
      value = minValue;
    }
    const minNormValue = CubismMath.min(normalizedMinimum, normalizedMaximum);
    const maxNormValue = CubismMath.max(normalizedMinimum, normalizedMaximum);
    const middleNormValue = normalizedDefault;
    const middleValue = getDefaultValue(minValue, maxValue);
    const paramValue = value - middleValue;
    switch (Math.sign(paramValue)) {
      case 1: {
        const nLength = maxNormValue - middleNormValue;
        const pLength = maxValue - middleValue;
        if (pLength != 0) {
          result = paramValue * (nLength / pLength);
          result += middleNormValue;
        }
        break;
      }
      case -1: {
        const nLength = minNormValue - middleNormValue;
        const pLength = minValue - middleValue;
        if (pLength != 0) {
          result = paramValue * (nLength / pLength);
          result += middleNormValue;
        }
        break;
      }
      case 0: {
        result = middleNormValue;
        break;
      }
    }
    return isInverted ? result : result * -1;
  }
  class csmRect {
    constructor(x = 0, y = 0, w = 0, h = 0) {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
    }
    getCenterX() {
      return this.x + 0.5 * this.width;
    }
    getCenterY() {
      return this.y + 0.5 * this.height;
    }
    getRight() {
      return this.x + this.width;
    }
    getBottom() {
      return this.y + this.height;
    }
    setRect(r) {
      this.x = r.x;
      this.y = r.y;
      this.width = r.width;
      this.height = r.height;
    }
    expand(w, h) {
      this.x -= w;
      this.y -= h;
      this.width += w * 2;
      this.height += h * 2;
    }
  }
  const ColorChannelCount = 4;
  const shaderCount = 10;
  let s_instance;
  let s_viewport;
  let s_fbo;
  class CubismClippingManager_WebGL {
    getChannelFlagAsColor(channelNo) {
      return this._channelColors[channelNo];
    }
    getMaskRenderTexture() {
      let ret = 0;
      if (this._maskTexture && this._maskTexture.texture != 0) {
        this._maskTexture.frameNo = this._currentFrameNo;
        ret = this._maskTexture.texture;
      }
      if (ret == 0) {
        const size = this._clippingMaskBufferSize;
        this._colorBuffer = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._colorBuffer);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, size, size, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        ret = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, ret);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this._colorBuffer, 0);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo);
        this._maskTexture = new CubismRenderTextureResource(this._currentFrameNo, ret);
      }
      return ret;
    }
    setGL(gl) {
      this.gl = gl;
    }
    calcClippedDrawTotalBounds(model, clippingContext) {
      let clippedDrawTotalMinX = Number.MAX_VALUE;
      let clippedDrawTotalMinY = Number.MAX_VALUE;
      let clippedDrawTotalMaxX = Number.MIN_VALUE;
      let clippedDrawTotalMaxY = Number.MIN_VALUE;
      const clippedDrawCount = clippingContext._clippedDrawableIndexList.length;
      for (let clippedDrawableIndex = 0; clippedDrawableIndex < clippedDrawCount; clippedDrawableIndex++) {
        const drawableIndex = clippingContext._clippedDrawableIndexList[clippedDrawableIndex];
        const drawableVertexCount = model.getDrawableVertexCount(drawableIndex);
        const drawableVertexes = model.getDrawableVertices(drawableIndex);
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        const loop = drawableVertexCount * Constant.vertexStep;
        for (let pi = Constant.vertexOffset; pi < loop; pi += Constant.vertexStep) {
          const x = drawableVertexes[pi];
          const y = drawableVertexes[pi + 1];
          if (x < minX) {
            minX = x;
          }
          if (x > maxX) {
            maxX = x;
          }
          if (y < minY) {
            minY = y;
          }
          if (y > maxY) {
            maxY = y;
          }
        }
        if (minX == Number.MAX_VALUE) {
          continue;
        }
        if (minX < clippedDrawTotalMinX) {
          clippedDrawTotalMinX = minX;
        }
        if (minY < clippedDrawTotalMinY) {
          clippedDrawTotalMinY = minY;
        }
        if (maxX > clippedDrawTotalMaxX) {
          clippedDrawTotalMaxX = maxX;
        }
        if (maxY > clippedDrawTotalMaxY) {
          clippedDrawTotalMaxY = maxY;
        }
        if (clippedDrawTotalMinX == Number.MAX_VALUE) {
          clippingContext._allClippedDrawRect.x = 0;
          clippingContext._allClippedDrawRect.y = 0;
          clippingContext._allClippedDrawRect.width = 0;
          clippingContext._allClippedDrawRect.height = 0;
          clippingContext._isUsing = false;
        } else {
          clippingContext._isUsing = true;
          const w = clippedDrawTotalMaxX - clippedDrawTotalMinX;
          const h = clippedDrawTotalMaxY - clippedDrawTotalMinY;
          clippingContext._allClippedDrawRect.x = clippedDrawTotalMinX;
          clippingContext._allClippedDrawRect.y = clippedDrawTotalMinY;
          clippingContext._allClippedDrawRect.width = w;
          clippingContext._allClippedDrawRect.height = h;
        }
      }
    }
    constructor() {
      this._maskRenderTexture = null;
      this._colorBuffer = null;
      this._currentFrameNo = 0;
      this._clippingMaskBufferSize = 256;
      this._clippingContextListForMask = [];
      this._clippingContextListForDraw = [];
      this._channelColors = [];
      this._tmpBoundsOnModel = new csmRect();
      this._tmpMatrix = new CubismMatrix44();
      this._tmpMatrixForMask = new CubismMatrix44();
      this._tmpMatrixForDraw = new CubismMatrix44();
      let tmp = new CubismTextureColor();
      tmp.R = 1;
      tmp.G = 0;
      tmp.B = 0;
      tmp.A = 0;
      this._channelColors.push(tmp);
      tmp = new CubismTextureColor();
      tmp.R = 0;
      tmp.G = 1;
      tmp.B = 0;
      tmp.A = 0;
      this._channelColors.push(tmp);
      tmp = new CubismTextureColor();
      tmp.R = 0;
      tmp.G = 0;
      tmp.B = 1;
      tmp.A = 0;
      this._channelColors.push(tmp);
      tmp = new CubismTextureColor();
      tmp.R = 0;
      tmp.G = 0;
      tmp.B = 0;
      tmp.A = 1;
      this._channelColors.push(tmp);
    }
    release() {
      var _a, _b, _c;
      const self2 = this;
      for (let i = 0; i < this._clippingContextListForMask.length; i++) {
        if (this._clippingContextListForMask[i]) {
          (_a = this._clippingContextListForMask[i]) == null ? void 0 : _a.release();
        }
      }
      self2._clippingContextListForMask = void 0;
      self2._clippingContextListForDraw = void 0;
      if (this._maskTexture) {
        (_b = this.gl) == null ? void 0 : _b.deleteFramebuffer(this._maskTexture.texture);
        self2._maskTexture = void 0;
      }
      self2._channelColors = void 0;
      (_c = this.gl) == null ? void 0 : _c.deleteTexture(this._colorBuffer);
      this._colorBuffer = null;
    }
    initialize(model, drawableCount, drawableMasks, drawableMaskCounts) {
      for (let i = 0; i < drawableCount; i++) {
        if (drawableMaskCounts[i] <= 0) {
          this._clippingContextListForDraw.push(null);
          continue;
        }
        let clippingContext = this.findSameClip(drawableMasks[i], drawableMaskCounts[i]);
        if (clippingContext == null) {
          clippingContext = new CubismClippingContext(this, drawableMasks[i], drawableMaskCounts[i]);
          this._clippingContextListForMask.push(clippingContext);
        }
        clippingContext.addClippedDrawable(i);
        this._clippingContextListForDraw.push(clippingContext);
      }
    }
    setupClippingContext(model, renderer) {
      this._currentFrameNo++;
      let usingClipCount = 0;
      for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
        const cc = this._clippingContextListForMask[clipIndex];
        this.calcClippedDrawTotalBounds(model, cc);
        if (cc._isUsing) {
          usingClipCount++;
        }
      }
      if (usingClipCount > 0) {
        this.gl.viewport(0, 0, this._clippingMaskBufferSize, this._clippingMaskBufferSize);
        this._maskRenderTexture = this.getMaskRenderTexture();
        renderer.getMvpMatrix();
        renderer.preDraw();
        this.setupLayoutBounds(usingClipCount);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this._maskRenderTexture);
        this.gl.clearColor(1, 1, 1, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
          const clipContext = this._clippingContextListForMask[clipIndex];
          const allClipedDrawRect = clipContext._allClippedDrawRect;
          const layoutBoundsOnTex01 = clipContext._layoutBounds;
          const MARGIN = 0.05;
          this._tmpBoundsOnModel.setRect(allClipedDrawRect);
          this._tmpBoundsOnModel.expand(allClipedDrawRect.width * MARGIN, allClipedDrawRect.height * MARGIN);
          const scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
          const scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
          {
            this._tmpMatrix.loadIdentity();
            {
              this._tmpMatrix.translateRelative(-1, -1);
              this._tmpMatrix.scaleRelative(2, 2);
            }
            {
              this._tmpMatrix.translateRelative(layoutBoundsOnTex01.x, layoutBoundsOnTex01.y);
              this._tmpMatrix.scaleRelative(scaleX, scaleY);
              this._tmpMatrix.translateRelative(-this._tmpBoundsOnModel.x, -this._tmpBoundsOnModel.y);
            }
            this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());
          }
          {
            this._tmpMatrix.loadIdentity();
            {
              this._tmpMatrix.translateRelative(layoutBoundsOnTex01.x, layoutBoundsOnTex01.y);
              this._tmpMatrix.scaleRelative(scaleX, scaleY);
              this._tmpMatrix.translateRelative(-this._tmpBoundsOnModel.x, -this._tmpBoundsOnModel.y);
            }
            this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
          }
          clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
          clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
          const clipDrawCount = clipContext._clippingIdCount;
          for (let i = 0; i < clipDrawCount; i++) {
            const clipDrawIndex = clipContext._clippingIdList[i];
            if (!model.getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)) {
              continue;
            }
            renderer.setIsCulling(model.getDrawableCulling(clipDrawIndex) != false);
            renderer.setClippingContextBufferForMask(clipContext);
            renderer.drawMesh(model.getDrawableTextureIndices(clipDrawIndex), model.getDrawableVertexIndexCount(clipDrawIndex), model.getDrawableVertexCount(clipDrawIndex), model.getDrawableVertexIndices(clipDrawIndex), model.getDrawableVertices(clipDrawIndex), model.getDrawableVertexUvs(clipDrawIndex), model.getDrawableOpacity(clipDrawIndex), CubismBlendMode.CubismBlendMode_Normal, false);
          }
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo);
        renderer.setClippingContextBufferForMask(null);
        this.gl.viewport(s_viewport[0], s_viewport[1], s_viewport[2], s_viewport[3]);
      }
    }
    findSameClip(drawableMasks, drawableMaskCounts) {
      for (let i = 0; i < this._clippingContextListForMask.length; i++) {
        const clippingContext = this._clippingContextListForMask[i];
        const count = clippingContext._clippingIdCount;
        if (count != drawableMaskCounts) {
          continue;
        }
        let sameCount = 0;
        for (let j = 0; j < count; j++) {
          const clipId = clippingContext._clippingIdList[j];
          for (let k = 0; k < count; k++) {
            if (drawableMasks[k] == clipId) {
              sameCount++;
              break;
            }
          }
        }
        if (sameCount == count) {
          return clippingContext;
        }
      }
      return null;
    }
    setupLayoutBounds(usingClipCount) {
      let div = usingClipCount / ColorChannelCount;
      let mod = usingClipCount % ColorChannelCount;
      div = ~~div;
      mod = ~~mod;
      let curClipIndex = 0;
      for (let channelNo = 0; channelNo < ColorChannelCount; channelNo++) {
        const layoutCount = div + (channelNo < mod ? 1 : 0);
        if (layoutCount == 0)
          ;
        else if (layoutCount == 1) {
          const clipContext = this._clippingContextListForMask[curClipIndex++];
          clipContext._layoutChannelNo = channelNo;
          clipContext._layoutBounds.x = 0;
          clipContext._layoutBounds.y = 0;
          clipContext._layoutBounds.width = 1;
          clipContext._layoutBounds.height = 1;
        } else if (layoutCount == 2) {
          for (let i = 0; i < layoutCount; i++) {
            let xpos = i % 2;
            xpos = ~~xpos;
            const cc = this._clippingContextListForMask[curClipIndex++];
            cc._layoutChannelNo = channelNo;
            cc._layoutBounds.x = xpos * 0.5;
            cc._layoutBounds.y = 0;
            cc._layoutBounds.width = 0.5;
            cc._layoutBounds.height = 1;
          }
        } else if (layoutCount <= 4) {
          for (let i = 0; i < layoutCount; i++) {
            let xpos = i % 2;
            let ypos = i / 2;
            xpos = ~~xpos;
            ypos = ~~ypos;
            const cc = this._clippingContextListForMask[curClipIndex++];
            cc._layoutChannelNo = channelNo;
            cc._layoutBounds.x = xpos * 0.5;
            cc._layoutBounds.y = ypos * 0.5;
            cc._layoutBounds.width = 0.5;
            cc._layoutBounds.height = 0.5;
          }
        } else if (layoutCount <= 9) {
          for (let i = 0; i < layoutCount; i++) {
            let xpos = i % 3;
            let ypos = i / 3;
            xpos = ~~xpos;
            ypos = ~~ypos;
            const cc = this._clippingContextListForMask[curClipIndex++];
            cc._layoutChannelNo = channelNo;
            cc._layoutBounds.x = xpos / 3;
            cc._layoutBounds.y = ypos / 3;
            cc._layoutBounds.width = 1 / 3;
            cc._layoutBounds.height = 1 / 3;
          }
        } else if (exports2.CubismConfig.supportMoreMaskDivisions && layoutCount <= 16) {
          for (let i = 0; i < layoutCount; i++) {
            let xpos = i % 4;
            let ypos = i / 4;
            xpos = ~~xpos;
            ypos = ~~ypos;
            const cc = this._clippingContextListForMask[curClipIndex++];
            cc._layoutChannelNo = channelNo;
            cc._layoutBounds.x = xpos / 4;
            cc._layoutBounds.y = ypos / 4;
            cc._layoutBounds.width = 1 / 4;
            cc._layoutBounds.height = 1 / 4;
          }
        } else {
          CubismLogError("not supported mask count : {0}", layoutCount);
        }
      }
    }
    getColorBuffer() {
      return this._colorBuffer;
    }
    getClippingContextListForDraw() {
      return this._clippingContextListForDraw;
    }
    setClippingMaskBufferSize(size) {
      this._clippingMaskBufferSize = size;
    }
    getClippingMaskBufferSize() {
      return this._clippingMaskBufferSize;
    }
  }
  class CubismRenderTextureResource {
    constructor(frameNo, texture) {
      this.frameNo = frameNo;
      this.texture = texture;
    }
  }
  class CubismClippingContext {
    constructor(manager, clippingDrawableIndices, clipCount) {
      this._isUsing = false;
      this._owner = manager;
      this._clippingIdList = clippingDrawableIndices;
      this._clippingIdCount = clipCount;
      this._allClippedDrawRect = new csmRect();
      this._layoutBounds = new csmRect();
      this._clippedDrawableIndexList = [];
      this._matrixForMask = new CubismMatrix44();
      this._matrixForDraw = new CubismMatrix44();
    }
    release() {
      const self2 = this;
      self2._layoutBounds = void 0;
      self2._allClippedDrawRect = void 0;
      self2._clippedDrawableIndexList = void 0;
    }
    addClippedDrawable(drawableIndex) {
      this._clippedDrawableIndexList.push(drawableIndex);
    }
    getClippingManager() {
      return this._owner;
    }
    setGl(gl) {
      this._owner.setGL(gl);
    }
  }
  class CubismShader_WebGL {
    static getInstance() {
      if (s_instance == null) {
        s_instance = new CubismShader_WebGL();
        return s_instance;
      }
      return s_instance;
    }
    static deleteInstance() {
      if (s_instance) {
        s_instance.release();
        s_instance = void 0;
      }
    }
    constructor() {
      this._shaderSets = [];
    }
    release() {
      this.releaseShaderProgram();
    }
    setupShaderProgram(renderer, textureId, vertexCount, vertexArray, indexArray, uvArray, bufferData, opacity, colorBlendMode, baseColor, isPremultipliedAlpha, matrix4x4, invertedMask) {
      if (!isPremultipliedAlpha) {
        CubismLogError("NoPremultipliedAlpha is not allowed");
      }
      if (this._shaderSets.length == 0) {
        this.generateShaders();
      }
      let SRC_COLOR;
      let DST_COLOR;
      let SRC_ALPHA;
      let DST_ALPHA;
      const clippingContextBufferForMask = renderer.getClippingContextBufferForMask();
      if (clippingContextBufferForMask != null) {
        const shaderSet = this._shaderSets[ShaderNames.ShaderNames_SetupMask];
        this.gl.useProgram(shaderSet.shaderProgram);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
        this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
        if (bufferData.vertex == null) {
          bufferData.vertex = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
        this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, 0, 0);
        if (bufferData.uv == null) {
          bufferData.uv = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.uv);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
        this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        const channelNo = clippingContextBufferForMask._layoutChannelNo;
        const colorChannel = clippingContextBufferForMask.getClippingManager().getChannelFlagAsColor(channelNo);
        this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.R, colorChannel.G, colorChannel.B, colorChannel.A);
        this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, clippingContextBufferForMask._matrixForMask.getArray());
        const rect = clippingContextBufferForMask._layoutBounds;
        this.gl.uniform4f(shaderSet.uniformBaseColorLocation, rect.x * 2 - 1, rect.y * 2 - 1, rect.getRight() * 2 - 1, rect.getBottom() * 2 - 1);
        SRC_COLOR = this.gl.ZERO;
        DST_COLOR = this.gl.ONE_MINUS_SRC_COLOR;
        SRC_ALPHA = this.gl.ZERO;
        DST_ALPHA = this.gl.ONE_MINUS_SRC_ALPHA;
      } else {
        const clippingContextBufferForDraw = renderer.getClippingContextBufferForDraw();
        const masked = clippingContextBufferForDraw != null;
        const offset = masked ? invertedMask ? 2 : 1 : 0;
        let shaderSet;
        switch (colorBlendMode) {
          case CubismBlendMode.CubismBlendMode_Normal:
          default:
            shaderSet = this._shaderSets[ShaderNames.ShaderNames_NormalPremultipliedAlpha + offset];
            SRC_COLOR = this.gl.ONE;
            DST_COLOR = this.gl.ONE_MINUS_SRC_ALPHA;
            SRC_ALPHA = this.gl.ONE;
            DST_ALPHA = this.gl.ONE_MINUS_SRC_ALPHA;
            break;
          case CubismBlendMode.CubismBlendMode_Additive:
            shaderSet = this._shaderSets[ShaderNames.ShaderNames_AddPremultipliedAlpha + offset];
            SRC_COLOR = this.gl.ONE;
            DST_COLOR = this.gl.ONE;
            SRC_ALPHA = this.gl.ZERO;
            DST_ALPHA = this.gl.ONE;
            break;
          case CubismBlendMode.CubismBlendMode_Multiplicative:
            shaderSet = this._shaderSets[ShaderNames.ShaderNames_MultPremultipliedAlpha + offset];
            SRC_COLOR = this.gl.DST_COLOR;
            DST_COLOR = this.gl.ONE_MINUS_SRC_ALPHA;
            SRC_ALPHA = this.gl.ZERO;
            DST_ALPHA = this.gl.ONE;
            break;
        }
        this.gl.useProgram(shaderSet.shaderProgram);
        if (bufferData.vertex == null) {
          bufferData.vertex = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
        this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, 0, 0);
        if (bufferData.uv == null) {
          bufferData.uv = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.uv);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
        this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        if (clippingContextBufferForDraw != null) {
          this.gl.activeTexture(this.gl.TEXTURE1);
          const tex = clippingContextBufferForDraw.getClippingManager().getColorBuffer();
          this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
          this.gl.uniform1i(shaderSet.samplerTexture1Location, 1);
          this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, clippingContextBufferForDraw._matrixForDraw.getArray());
          const channelNo = clippingContextBufferForDraw._layoutChannelNo;
          const colorChannel = clippingContextBufferForDraw.getClippingManager().getChannelFlagAsColor(channelNo);
          this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.R, colorChannel.G, colorChannel.B, colorChannel.A);
        }
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
        this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
        this.gl.uniformMatrix4fv(shaderSet.uniformMatrixLocation, false, matrix4x4.getArray());
        this.gl.uniform4f(shaderSet.uniformBaseColorLocation, baseColor.R, baseColor.G, baseColor.B, baseColor.A);
      }
      if (bufferData.index == null) {
        bufferData.index = this.gl.createBuffer();
      }
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, bufferData.index);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.DYNAMIC_DRAW);
      this.gl.blendFuncSeparate(SRC_COLOR, DST_COLOR, SRC_ALPHA, DST_ALPHA);
    }
    releaseShaderProgram() {
      for (let i = 0; i < this._shaderSets.length; i++) {
        this.gl.deleteProgram(this._shaderSets[i].shaderProgram);
        this._shaderSets[i].shaderProgram = 0;
      }
      this._shaderSets = [];
    }
    generateShaders() {
      for (let i = 0; i < shaderCount; i++) {
        this._shaderSets.push({});
      }
      this._shaderSets[0].shaderProgram = this.loadShaderProgram(vertexShaderSrcSetupMask, fragmentShaderSrcsetupMask);
      this._shaderSets[1].shaderProgram = this.loadShaderProgram(vertexShaderSrc, fragmentShaderSrcPremultipliedAlpha);
      this._shaderSets[2].shaderProgram = this.loadShaderProgram(vertexShaderSrcMasked, fragmentShaderSrcMaskPremultipliedAlpha);
      this._shaderSets[3].shaderProgram = this.loadShaderProgram(vertexShaderSrcMasked, fragmentShaderSrcMaskInvertedPremultipliedAlpha);
      this._shaderSets[4].shaderProgram = this._shaderSets[1].shaderProgram;
      this._shaderSets[5].shaderProgram = this._shaderSets[2].shaderProgram;
      this._shaderSets[6].shaderProgram = this._shaderSets[3].shaderProgram;
      this._shaderSets[7].shaderProgram = this._shaderSets[1].shaderProgram;
      this._shaderSets[8].shaderProgram = this._shaderSets[2].shaderProgram;
      this._shaderSets[9].shaderProgram = this._shaderSets[3].shaderProgram;
      this._shaderSets[0].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[0].shaderProgram, "a_position");
      this._shaderSets[0].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[0].shaderProgram, "a_texCoord");
      this._shaderSets[0].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "s_texture0");
      this._shaderSets[0].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "u_clipMatrix");
      this._shaderSets[0].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "u_channelFlag");
      this._shaderSets[0].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "u_baseColor");
      this._shaderSets[1].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[1].shaderProgram, "a_position");
      this._shaderSets[1].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[1].shaderProgram, "a_texCoord");
      this._shaderSets[1].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "s_texture0");
      this._shaderSets[1].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "u_matrix");
      this._shaderSets[1].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "u_baseColor");
      this._shaderSets[2].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[2].shaderProgram, "a_position");
      this._shaderSets[2].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[2].shaderProgram, "a_texCoord");
      this._shaderSets[2].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "s_texture0");
      this._shaderSets[2].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "s_texture1");
      this._shaderSets[2].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_matrix");
      this._shaderSets[2].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_clipMatrix");
      this._shaderSets[2].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_channelFlag");
      this._shaderSets[2].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_baseColor");
      this._shaderSets[3].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[3].shaderProgram, "a_position");
      this._shaderSets[3].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[3].shaderProgram, "a_texCoord");
      this._shaderSets[3].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "s_texture0");
      this._shaderSets[3].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "s_texture1");
      this._shaderSets[3].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_matrix");
      this._shaderSets[3].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_clipMatrix");
      this._shaderSets[3].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_channelFlag");
      this._shaderSets[3].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_baseColor");
      this._shaderSets[4].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[4].shaderProgram, "a_position");
      this._shaderSets[4].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[4].shaderProgram, "a_texCoord");
      this._shaderSets[4].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "s_texture0");
      this._shaderSets[4].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "u_matrix");
      this._shaderSets[4].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "u_baseColor");
      this._shaderSets[5].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[5].shaderProgram, "a_position");
      this._shaderSets[5].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[5].shaderProgram, "a_texCoord");
      this._shaderSets[5].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "s_texture0");
      this._shaderSets[5].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "s_texture1");
      this._shaderSets[5].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_matrix");
      this._shaderSets[5].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_clipMatrix");
      this._shaderSets[5].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_channelFlag");
      this._shaderSets[5].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_baseColor");
      this._shaderSets[6].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[6].shaderProgram, "a_position");
      this._shaderSets[6].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[6].shaderProgram, "a_texCoord");
      this._shaderSets[6].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "s_texture0");
      this._shaderSets[6].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "s_texture1");
      this._shaderSets[6].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_matrix");
      this._shaderSets[6].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_clipMatrix");
      this._shaderSets[6].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_channelFlag");
      this._shaderSets[6].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_baseColor");
      this._shaderSets[7].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[7].shaderProgram, "a_position");
      this._shaderSets[7].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[7].shaderProgram, "a_texCoord");
      this._shaderSets[7].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "s_texture0");
      this._shaderSets[7].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "u_matrix");
      this._shaderSets[7].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "u_baseColor");
      this._shaderSets[8].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[8].shaderProgram, "a_position");
      this._shaderSets[8].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[8].shaderProgram, "a_texCoord");
      this._shaderSets[8].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "s_texture0");
      this._shaderSets[8].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "s_texture1");
      this._shaderSets[8].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_matrix");
      this._shaderSets[8].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_clipMatrix");
      this._shaderSets[8].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_channelFlag");
      this._shaderSets[8].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_baseColor");
      this._shaderSets[9].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[9].shaderProgram, "a_position");
      this._shaderSets[9].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[9].shaderProgram, "a_texCoord");
      this._shaderSets[9].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "s_texture0");
      this._shaderSets[9].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "s_texture1");
      this._shaderSets[9].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_matrix");
      this._shaderSets[9].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_clipMatrix");
      this._shaderSets[9].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_channelFlag");
      this._shaderSets[9].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_baseColor");
    }
    loadShaderProgram(vertexShaderSource, fragmentShaderSource) {
      let shaderProgram = this.gl.createProgram();
      let vertShader = this.compileShaderSource(this.gl.VERTEX_SHADER, vertexShaderSource);
      if (!vertShader) {
        CubismLogError("Vertex shader compile error!");
        return 0;
      }
      let fragShader = this.compileShaderSource(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
      if (!fragShader) {
        CubismLogError("Vertex shader compile error!");
        return 0;
      }
      this.gl.attachShader(shaderProgram, vertShader);
      this.gl.attachShader(shaderProgram, fragShader);
      this.gl.linkProgram(shaderProgram);
      const linkStatus = this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS);
      if (!linkStatus) {
        CubismLogError("Failed to link program: {0}", shaderProgram);
        this.gl.deleteShader(vertShader);
        this.gl.deleteShader(fragShader);
        if (shaderProgram) {
          this.gl.deleteProgram(shaderProgram);
        }
        return 0;
      }
      this.gl.deleteShader(vertShader);
      this.gl.deleteShader(fragShader);
      return shaderProgram;
    }
    compileShaderSource(shaderType, shaderSource) {
      const source = shaderSource;
      const shader = this.gl.createShader(shaderType);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!shader) {
        const log = this.gl.getShaderInfoLog(shader);
        CubismLogError("Shader compile log: {0} ", log);
      }
      const status = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
      if (!status) {
        this.gl.deleteShader(shader);
        return null;
      }
      return shader;
    }
    setGl(gl) {
      this.gl = gl;
    }
  }
  var ShaderNames = /* @__PURE__ */ ((ShaderNames2) => {
    ShaderNames2[ShaderNames2["ShaderNames_SetupMask"] = 0] = "ShaderNames_SetupMask";
    ShaderNames2[ShaderNames2["ShaderNames_NormalPremultipliedAlpha"] = 1] = "ShaderNames_NormalPremultipliedAlpha";
    ShaderNames2[ShaderNames2["ShaderNames_NormalMaskedPremultipliedAlpha"] = 2] = "ShaderNames_NormalMaskedPremultipliedAlpha";
    ShaderNames2[ShaderNames2["ShaderNames_NomralMaskedInvertedPremultipliedAlpha"] = 3] = "ShaderNames_NomralMaskedInvertedPremultipliedAlpha";
    ShaderNames2[ShaderNames2["ShaderNames_AddPremultipliedAlpha"] = 4] = "ShaderNames_AddPremultipliedAlpha";
    ShaderNames2[ShaderNames2["ShaderNames_AddMaskedPremultipliedAlpha"] = 5] = "ShaderNames_AddMaskedPremultipliedAlpha";
    ShaderNames2[ShaderNames2["ShaderNames_AddMaskedPremultipliedAlphaInverted"] = 6] = "ShaderNames_AddMaskedPremultipliedAlphaInverted";
    ShaderNames2[ShaderNames2["ShaderNames_MultPremultipliedAlpha"] = 7] = "ShaderNames_MultPremultipliedAlpha";
    ShaderNames2[ShaderNames2["ShaderNames_MultMaskedPremultipliedAlpha"] = 8] = "ShaderNames_MultMaskedPremultipliedAlpha";
    ShaderNames2[ShaderNames2["ShaderNames_MultMaskedPremultipliedAlphaInverted"] = 9] = "ShaderNames_MultMaskedPremultipliedAlphaInverted";
    return ShaderNames2;
  })(ShaderNames || {});
  const vertexShaderSrcSetupMask = "attribute vec4     a_position;attribute vec2     a_texCoord;varying vec2       v_texCoord;varying vec4       v_myPos;uniform mat4       u_clipMatrix;void main(){   gl_Position = u_clipMatrix * a_position;   v_myPos = u_clipMatrix * a_position;   v_texCoord = a_texCoord;   v_texCoord.y = 1.0 - v_texCoord.y;}";
  const fragmentShaderSrcsetupMask = "precision mediump float;varying vec2       v_texCoord;varying vec4       v_myPos;uniform vec4       u_baseColor;uniform vec4       u_channelFlag;uniform sampler2D  s_texture0;void main(){   float isInside =        step(u_baseColor.x, v_myPos.x/v_myPos.w)       * step(u_baseColor.y, v_myPos.y/v_myPos.w)       * step(v_myPos.x/v_myPos.w, u_baseColor.z)       * step(v_myPos.y/v_myPos.w, u_baseColor.w);   gl_FragColor = u_channelFlag * texture2D(s_texture0, v_texCoord).a * isInside;}";
  const vertexShaderSrc = "attribute vec4     a_position;attribute vec2     a_texCoord;varying vec2       v_texCoord;uniform mat4       u_matrix;void main(){   gl_Position = u_matrix * a_position;   v_texCoord = a_texCoord;   v_texCoord.y = 1.0 - v_texCoord.y;}";
  const vertexShaderSrcMasked = "attribute vec4     a_position;attribute vec2     a_texCoord;varying vec2       v_texCoord;varying vec4       v_clipPos;uniform mat4       u_matrix;uniform mat4       u_clipMatrix;void main(){   gl_Position = u_matrix * a_position;   v_clipPos = u_clipMatrix * a_position;   v_texCoord = a_texCoord;   v_texCoord.y = 1.0 - v_texCoord.y;}";
  const fragmentShaderSrcPremultipliedAlpha = "precision mediump float;varying vec2       v_texCoord;uniform vec4       u_baseColor;uniform sampler2D  s_texture0;void main(){   gl_FragColor = texture2D(s_texture0 , v_texCoord) * u_baseColor;}";
  const fragmentShaderSrcMaskPremultipliedAlpha = "precision mediump float;varying vec2       v_texCoord;varying vec4       v_clipPos;uniform vec4       u_baseColor;uniform vec4       u_channelFlag;uniform sampler2D  s_texture0;uniform sampler2D  s_texture1;void main(){   vec4 col_formask = texture2D(s_texture0 , v_texCoord) * u_baseColor;   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;   col_formask = col_formask * maskVal;   gl_FragColor = col_formask;}";
  const fragmentShaderSrcMaskInvertedPremultipliedAlpha = "precision mediump float;varying vec2 v_texCoord;varying vec4 v_clipPos;uniform sampler2D s_texture0;uniform sampler2D s_texture1;uniform vec4 u_channelFlag;uniform vec4 u_baseColor;void main(){vec4 col_formask = texture2D(s_texture0, v_texCoord) * u_baseColor;vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;col_formask = col_formask * (1.0 - maskVal);gl_FragColor = col_formask;}";
  class CubismRenderer_WebGL extends CubismRenderer {
    constructor() {
      super();
      this._clippingContextBufferForMask = null;
      this._clippingContextBufferForDraw = null;
      this._clippingManager = new CubismClippingManager_WebGL();
      this.firstDraw = true;
      this._textures = {};
      this._sortedDrawableIndexList = [];
      this._bufferData = {
        vertex: null,
        uv: null,
        index: null
      };
    }
    initialize(model) {
      if (model.isUsingMasking()) {
        this._clippingManager = new CubismClippingManager_WebGL();
        this._clippingManager.initialize(model, model.getDrawableCount(), model.getDrawableMasks(), model.getDrawableMaskCounts());
      }
      for (let i = model.getDrawableCount() - 1; i >= 0; i--) {
        this._sortedDrawableIndexList[i] = 0;
      }
      super.initialize(model);
    }
    bindTexture(modelTextureNo, glTexture) {
      this._textures[modelTextureNo] = glTexture;
    }
    getBindedTextures() {
      return this._textures;
    }
    setClippingMaskBufferSize(size) {
      this._clippingManager.release();
      this._clippingManager = new CubismClippingManager_WebGL();
      this._clippingManager.setClippingMaskBufferSize(size);
      this._clippingManager.initialize(this.getModel(), this.getModel().getDrawableCount(), this.getModel().getDrawableMasks(), this.getModel().getDrawableMaskCounts());
    }
    getClippingMaskBufferSize() {
      return this._clippingManager.getClippingMaskBufferSize();
    }
    release() {
      var _a, _b, _c;
      const self2 = this;
      this._clippingManager.release();
      self2._clippingManager = void 0;
      (_a = this.gl) == null ? void 0 : _a.deleteBuffer(this._bufferData.vertex);
      this._bufferData.vertex = null;
      (_b = this.gl) == null ? void 0 : _b.deleteBuffer(this._bufferData.uv);
      this._bufferData.uv = null;
      (_c = this.gl) == null ? void 0 : _c.deleteBuffer(this._bufferData.index);
      this._bufferData.index = null;
      self2._bufferData = void 0;
      self2._textures = void 0;
    }
    doDrawModel() {
      this.preDraw();
      if (this._clippingManager != null) {
        this._clippingManager.setupClippingContext(this.getModel(), this);
      }
      const drawableCount = this.getModel().getDrawableCount();
      const renderOrder = this.getModel().getDrawableRenderOrders();
      for (let i = 0; i < drawableCount; ++i) {
        const order = renderOrder[i];
        this._sortedDrawableIndexList[order] = i;
      }
      for (let i = 0; i < drawableCount; ++i) {
        const drawableIndex = this._sortedDrawableIndexList[i];
        if (!this.getModel().getDrawableDynamicFlagIsVisible(drawableIndex)) {
          continue;
        }
        this.setClippingContextBufferForDraw(this._clippingManager != null ? this._clippingManager.getClippingContextListForDraw()[drawableIndex] : null);
        this.setIsCulling(this.getModel().getDrawableCulling(drawableIndex));
        this.drawMesh(this.getModel().getDrawableTextureIndices(drawableIndex), this.getModel().getDrawableVertexIndexCount(drawableIndex), this.getModel().getDrawableVertexCount(drawableIndex), this.getModel().getDrawableVertexIndices(drawableIndex), this.getModel().getDrawableVertices(drawableIndex), this.getModel().getDrawableVertexUvs(drawableIndex), this.getModel().getDrawableOpacity(drawableIndex), this.getModel().getDrawableBlendMode(drawableIndex), this.getModel().getDrawableInvertedMaskBit(drawableIndex));
      }
    }
    drawMesh(textureNo, indexCount, vertexCount, indexArray, vertexArray, uvArray, opacity, colorBlendMode, invertedMask) {
      if (this.isCulling()) {
        this.gl.enable(this.gl.CULL_FACE);
      } else {
        this.gl.disable(this.gl.CULL_FACE);
      }
      this.gl.frontFace(this.gl.CCW);
      const modelColorRGBA = this.getModelColor();
      if (this.getClippingContextBufferForMask() == null) {
        modelColorRGBA.A *= opacity;
        if (this.isPremultipliedAlpha()) {
          modelColorRGBA.R *= modelColorRGBA.A;
          modelColorRGBA.G *= modelColorRGBA.A;
          modelColorRGBA.B *= modelColorRGBA.A;
        }
      }
      let drawtexture = null;
      if (this._textures[textureNo] != null) {
        drawtexture = this._textures[textureNo];
      }
      CubismShader_WebGL.getInstance().setupShaderProgram(this, drawtexture, vertexCount, vertexArray, indexArray, uvArray, this._bufferData, opacity, colorBlendMode, modelColorRGBA, this.isPremultipliedAlpha(), this.getMvpMatrix(), invertedMask);
      this.gl.drawElements(this.gl.TRIANGLES, indexCount, this.gl.UNSIGNED_SHORT, 0);
      this.gl.useProgram(null);
      this.setClippingContextBufferForDraw(null);
      this.setClippingContextBufferForMask(null);
    }
    static doStaticRelease() {
      CubismShader_WebGL.deleteInstance();
    }
    setRenderState(fbo, viewport) {
      s_fbo = fbo;
      s_viewport = viewport;
    }
    preDraw() {
      if (this.firstDraw) {
        this.firstDraw = false;
        this._anisortopy = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
      }
      this.gl.disable(this.gl.SCISSOR_TEST);
      this.gl.disable(this.gl.STENCIL_TEST);
      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.frontFace(this.gl.CW);
      this.gl.enable(this.gl.BLEND);
      this.gl.colorMask(true, true, true, true);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }
    setClippingContextBufferForMask(clip) {
      this._clippingContextBufferForMask = clip;
    }
    getClippingContextBufferForMask() {
      return this._clippingContextBufferForMask;
    }
    setClippingContextBufferForDraw(clip) {
      this._clippingContextBufferForDraw = clip;
    }
    getClippingContextBufferForDraw() {
      return this._clippingContextBufferForDraw;
    }
    startUp(gl) {
      this.gl = gl;
      this._clippingManager.setGL(gl);
      CubismShader_WebGL.getInstance().setGl(gl);
    }
  }
  CubismRenderer.staticRelease = () => {
    CubismRenderer_WebGL.doStaticRelease();
  };
  class CubismModelSettingsJson {
    constructor(json) {
      this.groups = json.Groups;
      this.hitAreas = json.HitAreas;
      this.layout = json.Layout;
      this.moc = json.FileReferences.Moc;
      this.expressions = json.FileReferences.Expressions;
      this.motions = json.FileReferences.Motions;
      this.textures = json.FileReferences.Textures;
      this.physics = json.FileReferences.Physics;
      this.pose = json.FileReferences.Pose;
    }
    getEyeBlinkParameters() {
      var _a, _b;
      return (_b = (_a = this.groups) == null ? void 0 : _a.find((group) => group.Name === "EyeBlink")) == null ? void 0 : _b.Ids;
    }
    getLipSyncParameters() {
      var _a, _b;
      return (_b = (_a = this.groups) == null ? void 0 : _a.find((group) => group.Name === "LipSync")) == null ? void 0 : _b.Ids;
    }
  }
  const HitAreaPrefix = "HitArea";
  const HitAreaHead = "Head";
  const HitAreaBody = "Body";
  const PartsIdCore = "Parts01Core";
  const PartsArmPrefix = "Parts01Arm_";
  const PartsArmLPrefix = "Parts01ArmL_";
  const PartsArmRPrefix = "Parts01ArmR_";
  const ParamAngleX = "ParamAngleX";
  const ParamAngleY = "ParamAngleY";
  const ParamAngleZ = "ParamAngleZ";
  const ParamEyeLOpen = "ParamEyeLOpen";
  const ParamEyeLSmile = "ParamEyeLSmile";
  const ParamEyeROpen = "ParamEyeROpen";
  const ParamEyeRSmile = "ParamEyeRSmile";
  const ParamEyeBallX = "ParamEyeBallX";
  const ParamEyeBallY = "ParamEyeBallY";
  const ParamEyeBallForm = "ParamEyeBallForm";
  const ParamBrowLY = "ParamBrowLY";
  const ParamBrowRY = "ParamBrowRY";
  const ParamBrowLX = "ParamBrowLX";
  const ParamBrowRX = "ParamBrowRX";
  const ParamBrowLAngle = "ParamBrowLAngle";
  const ParamBrowRAngle = "ParamBrowRAngle";
  const ParamBrowLForm = "ParamBrowLForm";
  const ParamBrowRForm = "ParamBrowRForm";
  const ParamMouthForm = "ParamMouthForm";
  const ParamMouthOpenY = "ParamMouthOpenY";
  const ParamCheek = "ParamCheek";
  const ParamBodyAngleX = "ParamBodyAngleX";
  const ParamBodyAngleY = "ParamBodyAngleY";
  const ParamBodyAngleZ = "ParamBodyAngleZ";
  const ParamBreath = "ParamBreath";
  const ParamArmLA = "ParamArmLA";
  const ParamArmRA = "ParamArmRA";
  const ParamArmLB = "ParamArmLB";
  const ParamArmRB = "ParamArmRB";
  const ParamHandL = "ParamHandL";
  const ParamHandR = "ParamHandR";
  const ParamHairFront = "ParamHairFront";
  const ParamHairSide = "ParamHairSide";
  const ParamHairBack = "ParamHairBack";
  const ParamHairFluffy = "ParamHairFluffy";
  const ParamShoulderY = "ParamShoulderY";
  const ParamBustX = "ParamBustX";
  const ParamBustY = "ParamBustY";
  const ParamBaseX = "ParamBaseX";
  const ParamBaseY = "ParamBaseY";
  const ParamNONE = "NONE:";
  const LOGICAL_WIDTH = 2;
  const LOGICAL_HEIGHT = 2;
  exports2.config = void 0;
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
    config2.cubism4 = exports2.CubismConfig;
  })(exports2.config || (exports2.config = {}));
  const VERSION = "0.4.0";
  const logger = {
    log(tag, ...messages) {
      if (exports2.config.logLevel <= exports2.config.LOG_LEVEL_VERBOSE) {
        console.log(`[${tag}]`, ...messages);
      }
    },
    warn(tag, ...messages) {
      if (exports2.config.logLevel <= exports2.config.LOG_LEVEL_WARNING) {
        console.warn(`[${tag}]`, ...messages);
      }
    },
    error(tag, ...messages) {
      if (exports2.config.logLevel <= exports2.config.LOG_LEVEL_ERROR) {
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
  class ExpressionManager extends utils.EventEmitter {
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
      return utils.url.resolve(this.url, path);
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
      return !exports2.config.preserveExpressionOnMotion && this.currentPriority > 1;
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
      audio.crossOrigin = "anonymous";
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
  class MotionManager extends utils.EventEmitter {
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
    speakUp(sound, volume, expression) {
      return __async(this, null, function* () {
        if (!exports2.config.sound) {
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
        const isBase64Content = sound && sound.startsWith("data:audio/wav;base64");
        if (sound && !isBase64Content) {
          var A = document.createElement("a");
          A.href = sound;
          sound = A.href;
          soundURL = sound;
        } else {
          soundURL = "data:audio/wav;base64";
        }
        const isUrlPath = sound && (sound.startsWith("http") || sound.startsWith("blob"));
        let file;
        if (isUrlPath || isBase64Content) {
          file = sound;
        }
        const that = this;
        if (file) {
          try {
            audio = SoundManager.add(file, () => {
              expression && that.expressionManager && that.expressionManager.resetExpression();
              that.currentAudio = void 0;
            }, () => {
              expression && that.expressionManager && that.expressionManager.resetExpression();
              that.currentAudio = void 0;
            });
            this.currentAudio = audio;
            let _volume = 1;
            if (volume !== void 0) {
              _volume = volume;
            }
            SoundManager.volume = _volume;
            context = SoundManager.addContext(this.currentAudio);
            this.currentContext = context;
            analyzer = SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
            this.currentAnalyzer = analyzer;
          } catch (e) {
            logger.warn(this.tag, "Failed to create audio", soundURL, e);
          }
        }
        if (audio) {
          const readyToPlay = SoundManager.play(audio).catch((e) => logger.warn(this.tag, "Failed to play audio", audio.src, e));
          if (exports2.config.motionSync) {
            yield readyToPlay;
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
    startMotion(_0, _1) {
      return __async(this, arguments, function* (group, index, priority = MotionPriority.NORMAL, sound, volume, expression) {
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
        if (exports2.config.sound) {
          const isBase64Content = sound && sound.startsWith("data:audio/wav;base64");
          if (sound && !isBase64Content) {
            var A = document.createElement("a");
            A.href = sound;
            sound = A.href;
          }
          const isUrlPath = sound && (sound.startsWith("http") || sound.startsWith("blob"));
          const soundURL = this.getSoundFile(definition);
          let file = soundURL;
          if (soundURL) {
            file = this.settings.resolveURL(soundURL) + "?cache-buster=" + new Date().getTime();
          }
          if (isUrlPath || isBase64Content) {
            file = sound;
          }
          const that = this;
          if (file) {
            try {
              audio = SoundManager.add(file, () => {
                expression && that.expressionManager && that.expressionManager.resetExpression();
                that.currentAudio = void 0;
              }, () => {
                expression && that.expressionManager && that.expressionManager.resetExpression();
                that.currentAudio = void 0;
              });
              this.currentAudio = audio;
              let _volume = 1;
              if (volume !== void 0) {
                _volume = volume;
              }
              SoundManager.volume = _volume;
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
          priority = 3;
          const readyToPlay = SoundManager.play(audio).catch((e) => logger.warn(this.tag, "Failed to play audio", audio.src, e));
          if (exports2.config.motionSync) {
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
        if (this.state.shouldOverrideExpression()) {
          this.expressionManager && this.expressionManager.resetExpression();
        }
        logger.log(this.tag, "Start motion:", this.getMotionName(definition));
        this.emit("motionStart", group, index, audio);
        if (expression && this.expressionManager) {
          this.expressionManager.setExpression(expression);
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
    stopSpeaking() {
      if (this.currentAudio) {
        SoundManager.dispose(this.currentAudio);
        this.currentAudio = void 0;
      }
    }
    stopAllMotions() {
      this._stopAllMotions();
      this.state.reset();
      this.stopSpeaking();
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
      const self2 = this;
      self2.definitions = void 0;
      self2.motionGroups = void 0;
    }
  }
  const tempBounds = { x: 0, y: 0, width: 0, height: 0 };
  class InternalModel extends utils.EventEmitter {
    constructor() {
      super(...arguments);
      this.focusController = new FocusController();
      this.originalWidth = 0;
      this.originalHeight = 0;
      this.width = 0;
      this.height = 0;
      this.localTransform = new math.Matrix();
      this.drawingMatrix = new math.Matrix();
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
      const self2 = this;
      const size = this.getSize();
      self2.originalWidth = size[0];
      self2.originalHeight = size[1];
      const layout = Object.assign({
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT
      }, this.getLayout());
      this.localTransform.scale(layout.width / LOGICAL_WIDTH, layout.height / LOGICAL_HEIGHT);
      self2.width = this.originalWidth * this.localTransform.a;
      self2.height = this.originalHeight * this.localTransform.d;
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
    constructor(message, url, status, aborted = false) {
      super(message);
      this.url = url;
      this.status = status;
      this.aborted = aborted;
    }
  }
  const _XHRLoader = class {
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
        logger.warn(TAG$1, `Failed to load resource as ${xhr.responseType} (Status ${xhr.status}): ${url}`);
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
  const setupEssentials = (context, next) => __async(this, null, function* () {
    if (context.settings) {
      const live2DModel = context.live2dModel;
      const textureLoadings = context.settings.textures.map((tex) => {
        const url = context.settings.resolveURL(tex);
        return createTexture(url, { crossOrigin: context.options.crossOrigin });
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
  class Live2DTransform extends math.Transform {
  }
  const tempPoint = new math.Point();
  const tempMatrix$1 = new math.Matrix();
  let tickerRef;
  class Live2DModel extends display.Container {
    constructor(options) {
      super();
      this.tag = "Live2DModel(uninitialized)";
      this.textures = [];
      this.transform = new Live2DTransform();
      this.anchor = new math.ObservablePoint(this.onAnchorChange, this, 0, 0);
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
    motion(group, index, priority, sound, volume, expression) {
      return index === void 0 ? this.internalModel.motionManager.startRandomMotion(group, priority) : this.internalModel.motionManager.startMotion(group, index, priority, sound, volume, expression);
    }
    resetMotions() {
      return this.internalModel.motionManager.stopAllMotions();
    }
    speak(sound, volume, expression) {
      return this.internalModel.motionManager.speakUp(sound, volume, expression);
    }
    stopSpeaking() {
      return this.internalModel.motionManager.stopSpeaking();
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
      const internalTransform = tempMatrix$1.copyFrom(renderer.globalUniforms.uniforms.projectionMatrix).append(this.worldTransform);
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
          const actualPath = decodeURI(utils.url.resolve(settings.url, definedFile));
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
  FileLoader.factory = (context, next) => __async(this, null, function* () {
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
          const actualPath = decodeURI(utils.url.resolve(settings.url, definedFile));
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
  let ZipLoader = _ZipLoader;
  ZipLoader.ZIP_PROTOCOL = "zip://";
  ZipLoader.uid = 0;
  ZipLoader.factory = (context, next) => __async(this, null, function* () {
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
  if (!window.Live2DCubismCore) {
    throw new Error("Could not find Cubism 4 runtime. This plugin requires live2dcubismcore.js to be loaded.");
  }
  class Cubism4ExpressionManager extends ExpressionManager {
    constructor(settings, options) {
      var _a;
      super(settings, options);
      this.queueManager = new CubismMotionQueueManager();
      this.definitions = (_a = settings.expressions) != null ? _a : [];
      this.init();
    }
    isFinished() {
      return this.queueManager.isFinished();
    }
    getExpressionIndex(name) {
      return this.definitions.findIndex((def) => def.Name === name);
    }
    getExpressionFile(definition) {
      return definition.File;
    }
    createExpression(data, definition) {
      return CubismExpressionMotion.create(data);
    }
    _setExpression(motion) {
      return this.queueManager.startMotion(motion, false, performance.now());
    }
    stopAllExpressions() {
      this.queueManager.stopAllMotions();
    }
    updateParameters(model, now) {
      return this.queueManager.doUpdateMotion(model, now);
    }
  }
  class Cubism4ModelSettings extends ModelSettings {
    constructor(json) {
      super(json);
      if (!Cubism4ModelSettings.isValidJSON(json)) {
        throw new TypeError("Invalid JSON.");
      }
      Object.assign(this, new CubismModelSettingsJson(json));
    }
    static isValidJSON(json) {
      var _a;
      return !!(json == null ? void 0 : json.FileReferences) && typeof json.FileReferences.Moc === "string" && ((_a = json.FileReferences.Textures) == null ? void 0 : _a.length) > 0 && json.FileReferences.Textures.every((item) => typeof item === "string");
    }
    replaceFiles(replace) {
      super.replaceFiles(replace);
      if (this.motions) {
        for (const [group, motions] of Object.entries(this.motions)) {
          for (let i = 0; i < motions.length; i++) {
            motions[i].File = replace(motions[i].File, `motions.${group}[${i}].File`);
            if (motions[i].Sound !== void 0) {
              motions[i].Sound = replace(motions[i].Sound, `motions.${group}[${i}].Sound`);
            }
          }
        }
      }
      if (this.expressions) {
        for (let i = 0; i < this.expressions.length; i++) {
          this.expressions[i].File = replace(this.expressions[i].File, `expressions[${i}].File`);
        }
      }
    }
  }
  applyMixins(Cubism4ModelSettings, [CubismModelSettingsJson]);
  class Cubism4MotionManager extends MotionManager {
    constructor(settings, options) {
      var _a;
      super(settings, options);
      this.groups = { idle: "Idle" };
      this.motionDataType = "json";
      this.queueManager = new CubismMotionQueueManager();
      this.definitions = (_a = settings.motions) != null ? _a : {};
      this.eyeBlinkIds = settings.getEyeBlinkParameters() || [];
      this.lipSyncIds = settings.getLipSyncParameters() || [];
      this.init(options);
    }
    init(options) {
      super.init(options);
      if (this.settings.expressions) {
        this.expressionManager = new Cubism4ExpressionManager(this.settings, options);
      }
      this.queueManager.setEventCallback((caller, eventValue, customData) => {
        this.emit("motion:" + eventValue);
      });
    }
    isFinished() {
      return this.queueManager.isFinished();
    }
    _startMotion(motion, onFinish) {
      motion.setFinishedMotionHandler(onFinish);
      this.queueManager.stopAllMotions();
      return this.queueManager.startMotion(motion, false, performance.now());
    }
    _stopAllMotions() {
      this.queueManager.stopAllMotions();
    }
    createMotion(data, group, definition) {
      const motion = CubismMotion.create(data);
      const json = new CubismMotionJson(data);
      const defaultFadingDuration = (group === this.groups.idle ? exports2.config.idleMotionFadingDuration : exports2.config.motionFadingDuration) / 1e3;
      if (json.getMotionFadeInTime() === void 0) {
        motion.setFadeInTime(definition.FadeInTime > 0 ? definition.FadeInTime : defaultFadingDuration);
      }
      if (json.getMotionFadeOutTime() === void 0) {
        motion.setFadeOutTime(definition.FadeOutTime > 0 ? definition.FadeOutTime : defaultFadingDuration);
      }
      motion.setEffectIds(this.eyeBlinkIds, this.lipSyncIds);
      return motion;
    }
    getMotionFile(definition) {
      return definition.File;
    }
    getMotionName(definition) {
      return definition.File;
    }
    getSoundFile(definition) {
      return definition.Sound;
    }
    updateParameters(model, now) {
      return this.queueManager.doUpdateMotion(model, now);
    }
    destroy() {
      super.destroy();
      this.queueManager.release();
      this.queueManager = void 0;
    }
  }
  const tempMatrix = new CubismMatrix44();
  class Cubism4InternalModel extends InternalModel {
    constructor(coreModel, settings, options) {
      super();
      this.lipSync = true;
      this.breath = CubismBreath.create();
      this.renderer = new CubismRenderer_WebGL();
      this.idParamAngleX = ParamAngleX;
      this.idParamAngleY = ParamAngleY;
      this.idParamAngleZ = ParamAngleZ;
      this.idParamEyeBallX = ParamEyeBallX;
      this.idParamEyeBallY = ParamEyeBallY;
      this.idParamBodyAngleX = ParamBodyAngleX;
      this.idParamBreath = ParamBreath;
      this.idParamMouthForm = ParamMouthForm;
      this.pixelsPerUnit = 1;
      this.centeringTransform = new math.Matrix();
      this.coreModel = coreModel;
      this.settings = settings;
      this.motionManager = new Cubism4MotionManager(settings, options);
      this.init();
    }
    init() {
      var _a;
      super.init();
      if (((_a = this.settings.getEyeBlinkParameters()) == null ? void 0 : _a.length) > 0) {
        this.eyeBlink = CubismEyeBlink.create(this.settings);
      }
      this.breath.setParameters([
        new BreathParameterData(this.idParamAngleX, 0, 15, 6.5345, 0.5),
        new BreathParameterData(this.idParamAngleY, 0, 8, 3.5345, 0.5),
        new BreathParameterData(this.idParamAngleZ, 0, 10, 5.5345, 0.5),
        new BreathParameterData(this.idParamBodyAngleX, 0, 4, 15.5345, 0.5),
        new BreathParameterData(this.idParamBreath, 0, 0.5, 3.2345, 0.5)
      ]);
      this.renderer.initialize(this.coreModel);
      this.renderer.setIsPremultipliedAlpha(true);
    }
    getSize() {
      return [this.coreModel.getModel().canvasinfo.CanvasWidth, this.coreModel.getModel().canvasinfo.CanvasHeight];
    }
    getLayout() {
      const layout = {};
      if (this.settings.layout) {
        for (const key of Object.keys(this.settings.layout)) {
          const commonKey = key.charAt(0).toLowerCase() + key.slice(1);
          layout[commonKey] = this.settings.layout[key];
        }
      }
      return layout;
    }
    setupLayout() {
      super.setupLayout();
      this.pixelsPerUnit = this.coreModel.getModel().canvasinfo.PixelsPerUnit;
      this.centeringTransform.scale(this.pixelsPerUnit, this.pixelsPerUnit).translate(this.originalWidth / 2, this.originalHeight / 2);
    }
    updateWebGLContext(gl, glContextID) {
      this.renderer.firstDraw = true;
      this.renderer._bufferData = {
        vertex: null,
        uv: null,
        index: null
      };
      this.renderer.startUp(gl);
      this.renderer._clippingManager._currentFrameNo = glContextID;
      this.renderer._clippingManager._maskTexture = void 0;
      CubismShader_WebGL.getInstance()._shaderSets = [];
    }
    bindTexture(index, texture) {
      this.renderer.bindTexture(index, texture);
    }
    getHitAreaDefs() {
      var _a, _b;
      return (_b = (_a = this.settings.hitAreas) == null ? void 0 : _a.map((hitArea) => ({
        id: hitArea.Id,
        name: hitArea.Name,
        index: this.coreModel.getDrawableIndex(hitArea.Id)
      }))) != null ? _b : [];
    }
    getDrawableIDs() {
      return this.coreModel.getDrawableIds();
    }
    getDrawableIndex(id) {
      return this.coreModel.getDrawableIndex(id);
    }
    getDrawableVertices(drawIndex) {
      if (typeof drawIndex === "string") {
        drawIndex = this.coreModel.getDrawableIndex(drawIndex);
        if (drawIndex === -1)
          throw new TypeError("Unable to find drawable ID: " + drawIndex);
      }
      const arr = this.coreModel.getDrawableVertices(drawIndex).slice();
      for (let i = 0; i < arr.length; i += 2) {
        arr[i] = arr[i] * this.pixelsPerUnit + this.originalWidth / 2;
        arr[i + 1] = -arr[i + 1] * this.pixelsPerUnit + this.originalHeight / 2;
      }
      return arr;
    }
    updateTransform(transform) {
      this.drawingMatrix.copyFrom(this.centeringTransform).prepend(this.localTransform).prepend(transform);
    }
    update(dt, now) {
      var _a, _b, _c, _d;
      super.update(dt, now);
      dt /= 1e3;
      now /= 1e3;
      const model = this.coreModel;
      this.emit("beforeMotionUpdate");
      const motionUpdated = this.motionManager.update(this.coreModel, now);
      this.emit("afterMotionUpdate");
      model.saveParameters();
      (_a = this.motionManager.expressionManager) == null ? void 0 : _a.update(model, now);
      if (!motionUpdated) {
        (_b = this.eyeBlink) == null ? void 0 : _b.updateParameters(model, dt);
      }
      this.updateFocus();
      this.updateNaturalMovements(dt * 1e3, now * 1e3);
      if (this.lipSync && this.motionManager.currentAudio) {
        let value = this.motionManager.mouthSync();
        let min_ = 0;
        let max_ = 1;
        let weight = 1.2;
        if (value > 0) {
          min_ = 0.4;
        }
        value = clamp(value * weight, min_, max_);
        for (let i = 0; i < this.motionManager.lipSyncIds.length; ++i) {
          model.addParameterValueById(this.motionManager.lipSyncIds[i], value, 1);
        }
      }
      (_c = this.physics) == null ? void 0 : _c.evaluate(model, dt);
      (_d = this.pose) == null ? void 0 : _d.updateParameters(model, dt);
      this.emit("beforeModelUpdate");
      model.update();
      model.loadParameters();
    }
    updateFocus() {
      this.coreModel.addParameterValueById(this.idParamEyeBallX, this.focusController.x);
      this.coreModel.addParameterValueById(this.idParamEyeBallY, this.focusController.y);
      this.coreModel.addParameterValueById(this.idParamAngleX, this.focusController.x * 30);
      this.coreModel.addParameterValueById(this.idParamAngleY, this.focusController.y * 30);
      this.coreModel.addParameterValueById(this.idParamAngleZ, this.focusController.x * this.focusController.y * -30);
      this.coreModel.addParameterValueById(this.idParamBodyAngleX, this.focusController.x * 10);
    }
    updateFacialEmotion(mouthForm) {
      this.coreModel.addParameterValueById(this.idParamMouthForm, mouthForm);
    }
    updateNaturalMovements(dt, now) {
      var _a;
      (_a = this.breath) == null ? void 0 : _a.updateParameters(this.coreModel, dt / 1e3);
    }
    draw(gl) {
      const matrix = this.drawingMatrix;
      const array = tempMatrix.getArray();
      array[0] = matrix.a;
      array[1] = matrix.b;
      array[4] = -matrix.c;
      array[5] = -matrix.d;
      array[12] = matrix.tx;
      array[13] = matrix.ty;
      this.renderer.setMvpMatrix(tempMatrix);
      this.renderer.setRenderState(gl.getParameter(gl.FRAMEBUFFER_BINDING), this.viewport);
      this.renderer.drawModel();
    }
    destroy() {
      super.destroy();
      this.renderer.release();
      this.coreModel.release();
      this.renderer = void 0;
      this.coreModel = void 0;
    }
  }
  let startupPromise;
  let startupRetries = 20;
  function cubism4Ready() {
    if (CubismFramework.isStarted()) {
      return Promise.resolve();
    }
    startupPromise != null ? startupPromise : startupPromise = new Promise((resolve, reject) => {
      function startUpWithRetry() {
        try {
          startUpCubism4();
          resolve();
        } catch (e) {
          startupRetries--;
          if (startupRetries < 0) {
            const err = new Error("Failed to start up Cubism 4 framework.");
            err.cause = e;
            reject(err);
            return;
          }
          logger.log("Cubism4", "Startup failed, retrying 10ms later...");
          setTimeout(startUpWithRetry, 10);
        }
      }
      startUpWithRetry();
    });
    return startupPromise;
  }
  function startUpCubism4(options) {
    options = Object.assign({
      logFunction: console.log,
      loggingLevel: LogLevel.LogLevel_Verbose
    }, options);
    CubismFramework.startUp(options);
    CubismFramework.initialize();
  }
  Live2DFactory.registerRuntime({
    version: 4,
    ready: cubism4Ready,
    test(source) {
      return source instanceof Cubism4ModelSettings || Cubism4ModelSettings.isValidJSON(source);
    },
    isValidMoc(modelData) {
      if (modelData.byteLength < 4) {
        return false;
      }
      const view = new Int8Array(modelData, 0, 4);
      return String.fromCharCode(...view) === "MOC3";
    },
    createModelSettings(json) {
      return new Cubism4ModelSettings(json);
    },
    createCoreModel(data) {
      const moc = CubismMoc.create(data);
      try {
        const model = moc.createModel();
        model.__moc = moc;
        return model;
      } catch (e) {
        try {
          moc.release();
        } catch (ignored) {
        }
        throw e;
      }
    },
    createInternalModel(coreModel, settings, options) {
      const model = new Cubism4InternalModel(coreModel, settings, options);
      const coreModelWithMoc = coreModel;
      if (coreModelWithMoc.__moc) {
        model.__moc = coreModelWithMoc.__moc;
        delete coreModelWithMoc.__moc;
        model.once("destroy", releaseMoc);
      }
      return model;
    },
    createPhysics(coreModel, data) {
      return CubismPhysics.create(data);
    },
    createPose(coreModel, data) {
      return CubismPose.create(data);
    }
  });
  function releaseMoc() {
    var _a;
    (_a = this.__moc) == null ? void 0 : _a.release();
  }
  exports2.ACubismMotion = ACubismMotion;
  exports2.BreathParameterData = BreathParameterData;
  exports2.CSM_ASSERT = CSM_ASSERT;
  exports2.Constant = Constant;
  exports2.Cubism4ExpressionManager = Cubism4ExpressionManager;
  exports2.Cubism4InternalModel = Cubism4InternalModel;
  exports2.Cubism4ModelSettings = Cubism4ModelSettings;
  exports2.Cubism4MotionManager = Cubism4MotionManager;
  exports2.CubismBlendMode = CubismBlendMode;
  exports2.CubismBreath = CubismBreath;
  exports2.CubismClippingContext = CubismClippingContext;
  exports2.CubismClippingManager_WebGL = CubismClippingManager_WebGL;
  exports2.CubismDebug = CubismDebug;
  exports2.CubismExpressionMotion = CubismExpressionMotion;
  exports2.CubismEyeBlink = CubismEyeBlink;
  exports2.CubismFramework = CubismFramework;
  exports2.CubismLogDebug = CubismLogDebug;
  exports2.CubismLogError = CubismLogError;
  exports2.CubismLogInfo = CubismLogInfo;
  exports2.CubismLogVerbose = CubismLogVerbose;
  exports2.CubismLogWarning = CubismLogWarning;
  exports2.CubismMath = CubismMath;
  exports2.CubismMatrix44 = CubismMatrix44;
  exports2.CubismMoc = CubismMoc;
  exports2.CubismModel = CubismModel;
  exports2.CubismModelSettingsJson = CubismModelSettingsJson;
  exports2.CubismModelUserData = CubismModelUserData;
  exports2.CubismModelUserDataJson = CubismModelUserDataJson;
  exports2.CubismMotion = CubismMotion;
  exports2.CubismMotionCurve = CubismMotionCurve;
  exports2.CubismMotionCurveTarget = CubismMotionCurveTarget;
  exports2.CubismMotionData = CubismMotionData;
  exports2.CubismMotionEvent = CubismMotionEvent;
  exports2.CubismMotionJson = CubismMotionJson;
  exports2.CubismMotionManager = CubismMotionManager;
  exports2.CubismMotionPoint = CubismMotionPoint;
  exports2.CubismMotionQueueEntry = CubismMotionQueueEntry;
  exports2.CubismMotionQueueManager = CubismMotionQueueManager;
  exports2.CubismMotionSegment = CubismMotionSegment;
  exports2.CubismMotionSegmentType = CubismMotionSegmentType;
  exports2.CubismPhysics = CubismPhysics;
  exports2.CubismPhysicsInput = CubismPhysicsInput;
  exports2.CubismPhysicsJson = CubismPhysicsJson;
  exports2.CubismPhysicsOutput = CubismPhysicsOutput;
  exports2.CubismPhysicsParticle = CubismPhysicsParticle;
  exports2.CubismPhysicsRig = CubismPhysicsRig;
  exports2.CubismPhysicsSource = CubismPhysicsSource;
  exports2.CubismPhysicsSubRig = CubismPhysicsSubRig;
  exports2.CubismPhysicsTargetType = CubismPhysicsTargetType;
  exports2.CubismPose = CubismPose;
  exports2.CubismRenderTextureResource = CubismRenderTextureResource;
  exports2.CubismRenderer = CubismRenderer;
  exports2.CubismRenderer_WebGL = CubismRenderer_WebGL;
  exports2.CubismShader_WebGL = CubismShader_WebGL;
  exports2.CubismTextureColor = CubismTextureColor;
  exports2.CubismVector2 = CubismVector2;
  exports2.EvaluationOptionFlag = EvaluationOptionFlag;
  exports2.ExpressionBlendType = ExpressionBlendType;
  exports2.ExpressionManager = ExpressionManager;
  exports2.EyeState = EyeState;
  exports2.FileLoader = FileLoader;
  exports2.FocusController = FocusController;
  exports2.HitAreaBody = HitAreaBody;
  exports2.HitAreaHead = HitAreaHead;
  exports2.HitAreaPrefix = HitAreaPrefix;
  exports2.InteractionMixin = InteractionMixin;
  exports2.InternalModel = InternalModel;
  exports2.InvalidMotionQueueEntryHandleValue = InvalidMotionQueueEntryHandleValue;
  exports2.LOGICAL_HEIGHT = LOGICAL_HEIGHT;
  exports2.LOGICAL_WIDTH = LOGICAL_WIDTH;
  exports2.Live2DFactory = Live2DFactory;
  exports2.Live2DLoader = Live2DLoader;
  exports2.Live2DModel = Live2DModel;
  exports2.Live2DTransform = Live2DTransform;
  exports2.LogLevel = LogLevel;
  exports2.ModelSettings = ModelSettings;
  exports2.MotionManager = MotionManager;
  exports2.MotionPreloadStrategy = MotionPreloadStrategy;
  exports2.MotionPriority = MotionPriority;
  exports2.MotionState = MotionState;
  exports2.Options = Options;
  exports2.ParamAngleX = ParamAngleX;
  exports2.ParamAngleY = ParamAngleY;
  exports2.ParamAngleZ = ParamAngleZ;
  exports2.ParamArmLA = ParamArmLA;
  exports2.ParamArmLB = ParamArmLB;
  exports2.ParamArmRA = ParamArmRA;
  exports2.ParamArmRB = ParamArmRB;
  exports2.ParamBaseX = ParamBaseX;
  exports2.ParamBaseY = ParamBaseY;
  exports2.ParamBodyAngleX = ParamBodyAngleX;
  exports2.ParamBodyAngleY = ParamBodyAngleY;
  exports2.ParamBodyAngleZ = ParamBodyAngleZ;
  exports2.ParamBreath = ParamBreath;
  exports2.ParamBrowLAngle = ParamBrowLAngle;
  exports2.ParamBrowLForm = ParamBrowLForm;
  exports2.ParamBrowLX = ParamBrowLX;
  exports2.ParamBrowLY = ParamBrowLY;
  exports2.ParamBrowRAngle = ParamBrowRAngle;
  exports2.ParamBrowRForm = ParamBrowRForm;
  exports2.ParamBrowRX = ParamBrowRX;
  exports2.ParamBrowRY = ParamBrowRY;
  exports2.ParamBustX = ParamBustX;
  exports2.ParamBustY = ParamBustY;
  exports2.ParamCheek = ParamCheek;
  exports2.ParamEyeBallForm = ParamEyeBallForm;
  exports2.ParamEyeBallX = ParamEyeBallX;
  exports2.ParamEyeBallY = ParamEyeBallY;
  exports2.ParamEyeLOpen = ParamEyeLOpen;
  exports2.ParamEyeLSmile = ParamEyeLSmile;
  exports2.ParamEyeROpen = ParamEyeROpen;
  exports2.ParamEyeRSmile = ParamEyeRSmile;
  exports2.ParamHairBack = ParamHairBack;
  exports2.ParamHairFluffy = ParamHairFluffy;
  exports2.ParamHairFront = ParamHairFront;
  exports2.ParamHairSide = ParamHairSide;
  exports2.ParamHandL = ParamHandL;
  exports2.ParamHandR = ParamHandR;
  exports2.ParamMouthForm = ParamMouthForm;
  exports2.ParamMouthOpenY = ParamMouthOpenY;
  exports2.ParamNONE = ParamNONE;
  exports2.ParamShoulderY = ParamShoulderY;
  exports2.PartData = PartData;
  exports2.PartsArmLPrefix = PartsArmLPrefix;
  exports2.PartsArmPrefix = PartsArmPrefix;
  exports2.PartsArmRPrefix = PartsArmRPrefix;
  exports2.PartsIdCore = PartsIdCore;
  exports2.PhysicsJsonEffectiveForces = PhysicsJsonEffectiveForces;
  exports2.ShaderNames = ShaderNames;
  exports2.SoundManager = SoundManager;
  exports2.VERSION = VERSION;
  exports2.XHRLoader = XHRLoader;
  exports2.ZipLoader = ZipLoader;
  exports2.applyMixins = applyMixins;
  exports2.clamp = clamp;
  exports2.copyArray = copyArray;
  exports2.copyProperty = copyProperty;
  exports2.csmRect = csmRect;
  exports2.cubism4Ready = cubism4Ready;
  exports2.folderName = folderName;
  exports2.fragmentShaderSrcMaskInvertedPremultipliedAlpha = fragmentShaderSrcMaskInvertedPremultipliedAlpha;
  exports2.fragmentShaderSrcMaskPremultipliedAlpha = fragmentShaderSrcMaskPremultipliedAlpha;
  exports2.fragmentShaderSrcPremultipliedAlpha = fragmentShaderSrcPremultipliedAlpha;
  exports2.fragmentShaderSrcsetupMask = fragmentShaderSrcsetupMask;
  exports2.logger = logger;
  exports2.rand = rand;
  exports2.remove = remove;
  exports2.startUpCubism4 = startUpCubism4;
  exports2.vertexShaderSrc = vertexShaderSrc;
  exports2.vertexShaderSrcMasked = vertexShaderSrcMasked;
  exports2.vertexShaderSrcSetupMask = vertexShaderSrcSetupMask;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
