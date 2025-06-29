var __defProp = Object.defineProperty;
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
import { utils, Matrix, Texture, Transform, Point, ObservablePoint } from "@pixi/core";
import { Container } from "@pixi/display";
class CubismBreath {
  /**
   * コンストラクタ
   */
  constructor() {
    this._breathParameters = [];
    this._currentTime = 0;
  }
  /**
   * インスタンスの作成
   */
  static create() {
    return new CubismBreath();
  }
  /**
   * 呼吸のパラメータの紐づけ
   * @param breathParameters 呼吸を紐づけたいパラメータのリスト
   */
  setParameters(breathParameters) {
    this._breathParameters = breathParameters;
  }
  /**
   * 呼吸に紐づいているパラメータの取得
   * @return 呼吸に紐づいているパラメータのリスト
   */
  getParameters() {
    return this._breathParameters;
  }
  /**
   * モデルのパラメータの更新
   * @param model 対象のモデル
   * @param deltaTimeSeconds デルタ時間[秒]
   */
  updateParameters(model, deltaTimeSeconds) {
    this._currentTime += deltaTimeSeconds;
    const t = this._currentTime * 2 * 3.14159;
    for (let i = 0; i < this._breathParameters.length; ++i) {
      const data = this._breathParameters[i];
      model.addParameterValueById(
        data.parameterId,
        data.offset + data.peak * Math.sin(t / data.cycle),
        data.weight
      );
    }
  }
  // 積算時間[秒]
}
class BreathParameterData {
  /**
   * コンストラクタ
   * @param parameterId   呼吸をひもづけるパラメータID
   * @param offset        呼吸を正弦波としたときの、波のオフセット
   * @param peak          呼吸を正弦波としたときの、波の高さ
   * @param cycle         呼吸を正弦波としたときの、波の周期
   * @param weight        パラメータへの重み
   */
  constructor(parameterId, offset, peak, cycle, weight) {
    this.parameterId = parameterId == void 0 ? void 0 : parameterId;
    this.offset = offset == void 0 ? 0 : offset;
    this.peak = peak == void 0 ? 0 : peak;
    this.cycle = cycle == void 0 ? 0 : cycle;
    this.weight = weight == void 0 ? 0 : weight;
  }
  // パラメータへの重み
}
const _CubismEyeBlink = class _CubismEyeBlink {
  /**
   * インスタンスを作成する
   * @param modelSetting モデルの設定情報
   * @return 作成されたインスタンス
   * @note 引数がNULLの場合、パラメータIDが設定されていない空のインスタンスを作成する。
   */
  static create(modelSetting) {
    return new _CubismEyeBlink(modelSetting);
  }
  /**
   * まばたきの間隔の設定
   * @param blinkingInterval まばたきの間隔の時間[秒]
   */
  setBlinkingInterval(blinkingInterval) {
    this._blinkingIntervalSeconds = blinkingInterval;
  }
  /**
   * まばたきのモーションの詳細設定
   * @param closing   まぶたを閉じる動作の所要時間[秒]
   * @param closed    まぶたを閉じている動作の所要時間[秒]
   * @param opening   まぶたを開く動作の所要時間[秒]
   */
  setBlinkingSetting(closing, closed, opening) {
    this._closingSeconds = closing;
    this._closedSeconds = closed;
    this._openingSeconds = opening;
  }
  /**
   * まばたきさせるパラメータIDのリストの設定
   * @param parameterIds パラメータのIDのリスト
   */
  setParameterIds(parameterIds) {
    this._parameterIds = parameterIds;
  }
  /**
   * まばたきさせるパラメータIDのリストの取得
   * @return パラメータIDのリスト
   */
  getParameterIds() {
    return this._parameterIds;
  }
  /**
   * モデルのパラメータの更新
   * @param model 対象のモデル
   * @param deltaTimeSeconds デルタ時間[秒]
   */
  updateParameters(model, deltaTimeSeconds) {
    this._userTimeSeconds += deltaTimeSeconds;
    let parameterValue;
    let t = 0;
    switch (this._blinkingState) {
      case 2:
        t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._closingSeconds;
        if (t >= 1) {
          t = 1;
          this._blinkingState = 3;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }
        parameterValue = 1 - t;
        break;
      case 3:
        t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._closedSeconds;
        if (t >= 1) {
          this._blinkingState = 4;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }
        parameterValue = 0;
        break;
      case 4:
        t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._openingSeconds;
        if (t >= 1) {
          t = 1;
          this._blinkingState = 1;
          this._nextBlinkingTime = this.determinNextBlinkingTiming();
        }
        parameterValue = t;
        break;
      case 1:
        if (this._nextBlinkingTime < this._userTimeSeconds) {
          this._blinkingState = 2;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }
        parameterValue = 1;
        break;
      case 0:
      default:
        this._blinkingState = 1;
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
  /**
   * コンストラクタ
   * @param modelSetting モデルの設定情報
   */
  constructor(modelSetting) {
    var _a, _b;
    this._blinkingState = 0;
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
  /**
   * 次の瞬きのタイミングの決定
   *
   * @return 次のまばたきを行う時刻[秒]
   */
  determinNextBlinkingTiming() {
    const r = Math.random();
    return this._userTimeSeconds + r * (2 * this._blinkingIntervalSeconds - 1);
  }
};
_CubismEyeBlink.CloseIfZero = true;
let CubismEyeBlink = _CubismEyeBlink;
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
  /**
   * インスタンスの作成
   * @param pose3json pose3.jsonのデータ
   * @return 作成されたインスタンス
   */
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
  /**
   * モデルのパラメータの更新
   * @param model 対象のモデル
   * @param deltaTimeSeconds デルタ時間[秒]
   */
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
  /**
   * 表示を初期化
   * @param model 対象のモデル
   * @note 不透明度の初期値が0でないパラメータは、不透明度を１に設定する
   */
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
  /**
   * パーツの不透明度をコピー
   *
   * @param model 対象のモデル
   */
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
  /**
   * パーツのフェード操作を行う。
   * @param model 対象のモデル
   * @param deltaTimeSeconds デルタ時間[秒]
   * @param beginIndex フェード操作を行うパーツグループの先頭インデックス
   * @param partGroupCount フェード操作を行うパーツグループの個数
   */
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
  /**
   * コンストラクタ
   */
  constructor() {
    this._fadeTimeSeconds = DefaultFadeInSeconds;
    this._lastModel = void 0;
    this._partGroups = [];
    this._partGroupCounts = [];
  }
  // 前回操作したモデル
}
class PartData {
  /**
   * コンストラクタ
   */
  constructor(v) {
    this.parameterIndex = 0;
    this.partIndex = 0;
    this.partId = "";
    this.link = [];
    if (v != void 0) {
      this.assignment(v);
    }
  }
  /**
   * =演算子のオーバーロード
   */
  assignment(v) {
    this.partId = v.partId;
    this.link = v.link.map((link) => link.clone());
    return this;
  }
  /**
   * 初期化
   * @param model 初期化に使用するモデル
   */
  initialize(model) {
    this.parameterIndex = model.getParameterIndex(this.partId);
    this.partIndex = model.getPartIndex(this.partId);
    model.setParameterValueByIndex(this.parameterIndex, 1);
  }
  /**
   * オブジェクトのコピーを生成する
   */
  clone() {
    const clonePartData = new PartData();
    clonePartData.partId = this.partId;
    clonePartData.parameterIndex = this.parameterIndex;
    clonePartData.partIndex = this.partIndex;
    clonePartData.link = this.link.map((link) => link.clone());
    return clonePartData;
  }
  // 連動するパラメータ
}
class CubismVector2 {
  /**
   * コンストラクタ
   */
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }
  /**
   * ベクトルの加算
   *
   * @param vector2 加算するベクトル値
   * @return 加算結果 ベクトル値
   */
  add(vector2) {
    const ret = new CubismVector2(0, 0);
    ret.x = this.x + vector2.x;
    ret.y = this.y + vector2.y;
    return ret;
  }
  /**
   * ベクトルの減算
   *
   * @param vector2 減算するベクトル値
   * @return 減算結果 ベクトル値
   */
  substract(vector2) {
    const ret = new CubismVector2(0, 0);
    ret.x = this.x - vector2.x;
    ret.y = this.y - vector2.y;
    return ret;
  }
  /**
   * ベクトルの乗算
   *
   * @param vector2 乗算するベクトル値
   * @return 乗算結果 ベクトル値
   */
  multiply(vector2) {
    const ret = new CubismVector2(0, 0);
    ret.x = this.x * vector2.x;
    ret.y = this.y * vector2.y;
    return ret;
  }
  /**
   * ベクトルの乗算(スカラー)
   *
   * @param scalar 乗算するスカラー値
   * @return 乗算結果 ベクトル値
   */
  multiplyByScaler(scalar) {
    return this.multiply(new CubismVector2(scalar, scalar));
  }
  /**
   * ベクトルの除算
   *
   * @param vector2 除算するベクトル値
   * @return 除算結果 ベクトル値
   */
  division(vector2) {
    const ret = new CubismVector2(0, 0);
    ret.x = this.x / vector2.x;
    ret.y = this.y / vector2.y;
    return ret;
  }
  /**
   * ベクトルの除算(スカラー)
   *
   * @param scalar 除算するスカラー値
   * @return 除算結果 ベクトル値
   */
  divisionByScalar(scalar) {
    return this.division(new CubismVector2(scalar, scalar));
  }
  /**
   * ベクトルの長さを取得する
   *
   * @return ベクトルの長さ
   */
  getLength() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  /**
   * ベクトルの距離の取得
   *
   * @param a 点
   * @return ベクトルの距離
   */
  getDistanceWith(a) {
    return Math.sqrt(
      (this.x - a.x) * (this.x - a.x) + (this.y - a.y) * (this.y - a.y)
    );
  }
  /**
   * ドット積の計算
   *
   * @param a 値
   * @return 結果
   */
  dot(a) {
    return this.x * a.x + this.y * a.y;
  }
  /**
   * 正規化の適用
   */
  normalize() {
    const length = Math.pow(this.x * this.x + this.y * this.y, 0.5);
    this.x = this.x / length;
    this.y = this.y / length;
  }
  /**
   * 等しさの確認（等しいか？）
   *
   * 値が等しいか？
   *
   * @param rhs 確認する値
   * @return true 値は等しい
   * @return false 値は等しくない
   */
  isEqual(rhs) {
    return this.x == rhs.x && this.y == rhs.y;
  }
  /**
   * 等しさの確認（等しくないか？）
   *
   * 値が等しくないか？
   *
   * @param rhs 確認する値
   * @return true 値は等しくない
   * @return false 値は等しい
   */
  isNotEqual(rhs) {
    return !this.isEqual(rhs);
  }
}
const _CubismMath = class _CubismMath {
  /**
   * 第一引数の値を最小値と最大値の範囲に収めた値を返す
   *
   * @param value 収められる値
   * @param min   範囲の最小値
   * @param max   範囲の最大値
   * @return 最小値と最大値の範囲に収めた値
   */
  static range(value, min, max) {
    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }
    return value;
  }
  /**
   * サイン関数の値を求める
   *
   * @param x 角度値（ラジアン）
   * @return サイン関数sin(x)の値
   */
  static sin(x) {
    return Math.sin(x);
  }
  /**
   * コサイン関数の値を求める
   *
   * @param x 角度値(ラジアン)
   * @return コサイン関数cos(x)の値
   */
  static cos(x) {
    return Math.cos(x);
  }
  /**
   * 値の絶対値を求める
   *
   * @param x 絶対値を求める値
   * @return 値の絶対値
   */
  static abs(x) {
    return Math.abs(x);
  }
  /**
   * 平方根(ルート)を求める
   * @param x -> 平方根を求める値
   * @return 値の平方根
   */
  static sqrt(x) {
    return Math.sqrt(x);
  }
  /**
   * 立方根を求める
   * @param x -> 立方根を求める値
   * @return 値の立方根
   */
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
  /**
   * イージング処理されたサインを求める
   * フェードイン・アウト時のイージングに利用できる
   *
   * @param value イージングを行う値
   * @return イージング処理されたサイン値
   */
  static getEasingSine(value) {
    if (value < 0) {
      return 0;
    } else if (value > 1) {
      return 1;
    }
    return 0.5 - 0.5 * this.cos(value * Math.PI);
  }
  /**
   * 大きい方の値を返す
   *
   * @param left 左辺の値
   * @param right 右辺の値
   * @return 大きい方の値
   */
  static max(left, right) {
    return left > right ? left : right;
  }
  /**
   * 小さい方の値を返す
   *
   * @param left  左辺の値
   * @param right 右辺の値
   * @return 小さい方の値
   */
  static min(left, right) {
    return left > right ? right : left;
  }
  /**
   * 角度値をラジアン値に変換する
   *
   * @param degrees   角度値
   * @return 角度値から変換したラジアン値
   */
  static degreesToRadian(degrees) {
    return degrees / 180 * Math.PI;
  }
  /**
   * ラジアン値を角度値に変換する
   *
   * @param radian    ラジアン値
   * @return ラジアン値から変換した角度値
   */
  static radianToDegrees(radian) {
    return radian * 180 / Math.PI;
  }
  /**
   * ２つのベクトルからラジアン値を求める
   *
   * @param from  始点ベクトル
   * @param to    終点ベクトル
   * @return ラジアン値から求めた方向ベクトル
   */
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
  /**
   * ２つのベクトルから角度値を求める
   *
   * @param from  始点ベクトル
   * @param to    終点ベクトル
   * @return 角度値から求めた方向ベクトル
   */
  static directionToDegrees(from, to) {
    const radian = this.directionToRadian(from, to);
    let degree = this.radianToDegrees(radian);
    if (to.x - from.x > 0) {
      degree = -degree;
    }
    return degree;
  }
  /**
   * ラジアン値を方向ベクトルに変換する。
   *
   * @param totalAngle    ラジアン値
   * @return ラジアン値から変換した方向ベクトル
   */
  static radianToDirection(totalAngle) {
    const ret = new CubismVector2();
    ret.x = this.sin(totalAngle);
    ret.y = this.cos(totalAngle);
    return ret;
  }
  /**
   * 三次方程式の三次項の係数が0になったときに補欠的に二次方程式の解をもとめる。
   * a * x^2 + b * x + c = 0
   *
   * @param   a -> 二次項の係数値
   * @param   b -> 一次項の係数値
   * @param   c -> 定数項の値
   * @return  二次方程式の解
   */
  static quadraticEquation(a, b, c) {
    if (this.abs(a) < _CubismMath.Epsilon) {
      if (this.abs(b) < _CubismMath.Epsilon) {
        return -c;
      }
      return -c / b;
    }
    return -(b + this.sqrt(b * b - 4 * a * c)) / (2 * a);
  }
  /**
   * カルダノの公式によってベジェのt値に該当する３次方程式の解を求める。
   * 重解になったときには0.0～1.0の値になる解を返す。
   *
   * a * x^3 + b * x^2 + c * x + d = 0
   *
   * @param   a -> 三次項の係数値
   * @param   b -> 二次項の係数値
   * @param   c -> 一次項の係数値
   * @param   d -> 定数項の値
   * @return  0.0～1.0の間にある解
   */
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
  /**
   * コンストラクタ
   */
  constructor() {
  }
};
_CubismMath.Epsilon = 1e-5;
let CubismMath = _CubismMath;
class CubismMatrix44 {
  /**
   * コンストラクタ
   */
  constructor() {
    this._tr = new Float32Array(16);
    this.loadIdentity();
  }
  /**
   * 受け取った２つの行列の乗算を行う。
   *
   * @param a 行列a
   * @param b 行列b
   * @return 乗算結果の行列
   */
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
  /**
   * 単位行列に初期化する
   */
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
  /**
   * 行列を設定
   *
   * @param tr 16個の浮動小数点数で表される4x4の行列
   */
  setMatrix(tr) {
    for (let i = 0; i < 16; ++i) {
      this._tr[i] = tr[i];
    }
  }
  /**
   * 行列を浮動小数点数の配列で取得
   *
   * @return 16個の浮動小数点数で表される4x4の行列
   */
  getArray() {
    return this._tr;
  }
  /**
   * X軸の拡大率を取得
   * @return X軸の拡大率
   */
  getScaleX() {
    return this._tr[0];
  }
  /**
   * Y軸の拡大率を取得する
   *
   * @return Y軸の拡大率
   */
  getScaleY() {
    return this._tr[5];
  }
  /**
   * X軸の移動量を取得
   * @return X軸の移動量
   */
  getTranslateX() {
    return this._tr[12];
  }
  /**
   * Y軸の移動量を取得
   * @return Y軸の移動量
   */
  getTranslateY() {
    return this._tr[13];
  }
  /**
   * X軸の値を現在の行列で計算
   *
   * @param src X軸の値
   * @return 現在の行列で計算されたX軸の値
   */
  transformX(src) {
    return this._tr[0] * src + this._tr[12];
  }
  /**
   * Y軸の値を現在の行列で計算
   *
   * @param src Y軸の値
   * @return 現在の行列で計算されたY軸の値
   */
  transformY(src) {
    return this._tr[5] * src + this._tr[13];
  }
  /**
   * X軸の値を現在の行列で逆計算
   */
  invertTransformX(src) {
    return (src - this._tr[12]) / this._tr[0];
  }
  /**
   * Y軸の値を現在の行列で逆計算
   */
  invertTransformY(src) {
    return (src - this._tr[13]) / this._tr[5];
  }
  /**
   * 現在の行列の位置を起点にして移動
   *
   * 現在の行列の位置を起点にして相対的に移動する。
   *
   * @param x X軸の移動量
   * @param y Y軸の移動量
   */
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
  /**
   * 現在の行列の位置を移動
   *
   * 現在の行列の位置を指定した位置へ移動する
   *
   * @param x X軸の移動量
   * @param y y軸の移動量
   */
  translate(x, y) {
    this._tr[12] = x;
    this._tr[13] = y;
  }
  /**
   * 現在の行列のX軸の位置を指定した位置へ移動する
   *
   * @param x X軸の移動量
   */
  translateX(x) {
    this._tr[12] = x;
  }
  /**
   * 現在の行列のY軸の位置を指定した位置へ移動する
   *
   * @param y Y軸の移動量
   */
  translateY(y) {
    this._tr[13] = y;
  }
  /**
   * 現在の行列の拡大率を相対的に設定する
   *
   * @param x X軸の拡大率
   * @param y Y軸の拡大率
   */
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
  /**
   * 現在の行列の拡大率を指定した倍率に設定する
   *
   * @param x X軸の拡大率
   * @param y Y軸の拡大率
   */
  scale(x, y) {
    this._tr[0] = x;
    this._tr[5] = y;
  }
  /**
   * 現在の行列に行列を乗算
   *
   * @param m 行列
   */
  multiplyByMatrix(m) {
    CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
  }
  /**
   * オブジェクトのコピーを生成する
   */
  clone() {
    const cloneMatrix = new CubismMatrix44();
    for (let i = 0; i < this._tr.length; i++) {
      cloneMatrix._tr[i] = this._tr[i];
    }
    return cloneMatrix;
  }
  // 4x4行列データ
}
class CubismRenderer {
  /**
   * レンダラの初期化処理を実行する
   * 引数に渡したモデルからレンダラの初期化処理に必要な情報を取り出すことができる
   * @param model モデルのインスタンス
   */
  initialize(model) {
    this._model = model;
  }
  /**
   * モデルを描画する
   */
  drawModel() {
    if (this.getModel() == null)
      return;
    this.saveProfile();
    this.doDrawModel();
    this.restoreProfile();
  }
  /**
   * Model-View-Projection 行列をセットする
   * 配列は複製されるので、元の配列は外で破棄して良い
   * @param matrix44 Model-View-Projection 行列
   */
  setMvpMatrix(matrix44) {
    this._mvpMatrix4x4.setMatrix(matrix44.getArray());
  }
  /**
   * Model-View-Projection 行列を取得する
   * @return Model-View-Projection 行列
   */
  getMvpMatrix() {
    return this._mvpMatrix4x4;
  }
  /**
   * モデルの色をセットする
   * 各色0.0~1.0の間で指定する（1.0が標準の状態）
   * @param red 赤チャンネルの値
   * @param green 緑チャンネルの値
   * @param blue 青チャンネルの値
   * @param alpha αチャンネルの値
   */
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
  /**
   * モデルの色を取得する
   * 各色0.0~1.0の間で指定する(1.0が標準の状態)
   *
   * @return RGBAのカラー情報
   */
  getModelColor() {
    return Object.assign({}, this._modelColor);
  }
  /**
   * 乗算済みαの有効・無効をセットする
   * 有効にするならtrue、無効にするならfalseをセットする
   */
  setIsPremultipliedAlpha(enable) {
    this._isPremultipliedAlpha = enable;
  }
  /**
   * 乗算済みαの有効・無効を取得する
   * @return true 乗算済みのα有効
   * @return false 乗算済みのα無効
   */
  isPremultipliedAlpha() {
    return this._isPremultipliedAlpha;
  }
  /**
   * カリング（片面描画）の有効・無効をセットする。
   * 有効にするならtrue、無効にするならfalseをセットする
   */
  setIsCulling(culling) {
    this._isCulling = culling;
  }
  /**
   * カリング（片面描画）の有効・無効を取得する。
   * @return true カリング有効
   * @return false カリング無効
   */
  isCulling() {
    return this._isCulling;
  }
  /**
   * テクスチャの異方性フィルタリングのパラメータをセットする
   * パラメータ値の影響度はレンダラの実装に依存する
   * @param n パラメータの値
   */
  setAnisotropy(n) {
    this._anisotropy = n;
  }
  /**
   * テクスチャの異方性フィルタリングのパラメータをセットする
   * @return 異方性フィルタリングのパラメータ
   */
  getAnisotropy() {
    return this._anisotropy;
  }
  /**
   * レンダリングするモデルを取得する
   * @return レンダリングするモデル
   */
  getModel() {
    return this._model;
  }
  /**
   * マスク描画の方式を変更する。
   * falseの場合、マスクを1枚のテクスチャに分割してレンダリングする（デフォルト）
   * 高速だが、マスク個数の上限が36に限定され、質も荒くなる
   * trueの場合、パーツ描画の前にその都度必要なマスクを描き直す
   * レンダリング品質は高いが描画処理負荷は増す
   * @param high 高精細マスクに切り替えるか？
   */
  useHighPrecisionMask(high) {
    this._useHighPrecisionMask = high;
  }
  /**
   * マスクの描画方式を取得する
   * @return true 高精細方式
   * @return false デフォルト
   */
  isUsingHighPrecisionMask() {
    return this._useHighPrecisionMask;
  }
  /**
   * コンストラクタ
   */
  constructor() {
    this._isCulling = false;
    this._isPremultipliedAlpha = false;
    this._anisotropy = 0;
    this._modelColor = new CubismTextureColor();
    this._useHighPrecisionMask = false;
    this._mvpMatrix4x4 = new CubismMatrix44();
    this._mvpMatrix4x4.loadIdentity();
  }
  // falseの場合、マスクを纏めて描画する trueの場合、マスクはパーツ描画ごとに書き直す
}
var CubismBlendMode = /* @__PURE__ */ ((CubismBlendMode2) => {
  CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Normal"] = 0] = "CubismBlendMode_Normal";
  CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Additive"] = 1] = "CubismBlendMode_Additive";
  CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Multiplicative"] = 2] = "CubismBlendMode_Multiplicative";
  return CubismBlendMode2;
})(CubismBlendMode || {});
class CubismTextureColor {
  /**
   * コンストラクタ
   */
  constructor(r = 1, g = 1, b = 1, a = 1) {
    this.R = r;
    this.G = g;
    this.B = b;
    this.A = a;
  }
  // αチャンネル
}
let s_isStarted = false;
let s_isInitialized = false;
let s_option = void 0;
const Constant = {
  vertexOffset: 0,
  // メッシュ頂点のオフセット値
  vertexStep: 2
  // メッシュ頂点のステップ値
};
class CubismFramework {
  /**
   * Cubism FrameworkのAPIを使用可能にする。
   *  APIを実行する前に必ずこの関数を実行すること。
   *  一度準備が完了して以降は、再び実行しても内部処理がスキップされます。
   *
   * @param    option      Optionクラスのインスタンス
   *
   * @return   準備処理が完了したらtrueが返ります。
   */
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
      CubismLogInfo(
        `Live2D Cubism Core version: {0}.{1}.{2} ({3})`,
        ("00" + major).slice(-2),
        ("00" + minor).slice(-2),
        ("0000" + patch).slice(-4),
        versionNumber
      );
    }
    CubismLogInfo("CubismFramework.startUp() is complete.");
    return s_isStarted;
  }
  /**
   * StartUp()で初期化したCubismFrameworkの各パラメータをクリアします。
   * Dispose()したCubismFrameworkを再利用する際に利用してください。
   */
  static cleanUp() {
    s_isStarted = false;
    s_isInitialized = false;
    s_option = void 0;
  }
  /**
   * Cubism Framework内のリソースを初期化してモデルを表示可能な状態にします。<br>
   *     再度Initialize()するには先にDispose()を実行する必要があります。
   *
   * @param memorySize 初期化時メモリ量 [byte(s)]
   *    複数モデル表示時などにモデルが更新されない際に使用してください。
   *    指定する際は必ず1024*1024*16 byte(16MB)以上の値を指定してください。
   *    それ以外はすべて1024*1024*16 byteに丸めます。
   */
  static initialize(memorySize = 0) {
    if (!s_isStarted) {
      CubismLogWarning("CubismFramework is not started.");
      return;
    }
    if (s_isInitialized) {
      CubismLogWarning(
        "CubismFramework.initialize() skipped, already initialized."
      );
      return;
    }
    Live2DCubismCore.Memory.initializeAmountOfMemory(memorySize);
    s_isInitialized = true;
    CubismLogInfo("CubismFramework.initialize() is complete.");
  }
  /**
   * Cubism Framework内の全てのリソースを解放します。
   *      ただし、外部で確保されたリソースについては解放しません。
   *      外部で適切に破棄する必要があります。
   */
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
  /**
   * Cubism FrameworkのAPIを使用する準備が完了したかどうか
   * @return APIを使用する準備が完了していればtrueが返ります。
   */
  static isStarted() {
    return s_isStarted;
  }
  /**
   * Cubism Frameworkのリソース初期化がすでに行われているかどうか
   * @return リソース確保が完了していればtrueが返ります
   */
  static isInitialized() {
    return s_isInitialized;
  }
  /**
   * Core APIにバインドしたログ関数を実行する
   *
   * @praram message ログメッセージ
   */
  static coreLogFunction(message) {
    if (!Live2DCubismCore.Logging.csmGetLogFunction()) {
      return;
    }
    Live2DCubismCore.Logging.csmGetLogFunction()(message);
  }
  /**
   * 現在のログ出力レベル設定の値を返す。
   *
   * @return  現在のログ出力レベル設定の値
   */
  static getLoggingLevel() {
    if (s_option != null) {
      return s_option.loggingLevel;
    }
    return 5;
  }
  /**
   * 静的クラスとして使用する
   * インスタンス化させない
   */
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
const CSM_ASSERT = typeof process !== "undefined" && process.env.NODE_ENV === "production" ? () => {
} : (expr) => console.assert(expr);
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
  /**
   * ログを出力する。第一引数にログレベルを設定する。
   * CubismFramework.initialize()時にオプションで設定されたログ出力レベルを下回る場合はログに出さない。
   *
   * @param logLevel ログレベルの設定
   * @param format 書式付き文字列
   * @param args 可変長引数
   */
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
  /**
   * データから指定した長さだけダンプ出力する。
   * CubismFramework.initialize()時にオプションで設定されたログ出力レベルを下回る場合はログに出さない。
   *
   * @param logLevel ログレベルの設定
   * @param data ダンプするデータ
   * @param length ダンプする長さ
   */
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
  /**
   * private コンストラクタ
   */
  constructor() {
  }
}
class DrawableColorData {
  constructor(isOverwritten = false, color = new CubismTextureColor()) {
    this.isOverwritten = isOverwritten;
    this.Color = color;
  }
}
class PartColorData {
  constructor(isOverwritten = false, color = new CubismTextureColor()) {
    this.isOverwritten = isOverwritten;
    this.Color = color;
  }
}
class DrawableCullingData {
  /**
   * コンストラクタ
   *
   * @param isOverwritten
   * @param isCulling
   */
  constructor(isOverwritten = false, isCulling = false) {
    this.isOverwritten = isOverwritten;
    this.isCulling = isCulling;
  }
}
class CubismModel {
  /**
   * モデルのパラメータの更新
   */
  update() {
    this._model.update();
    this._model.drawables.resetDynamicFlags();
  }
  /**
   * PixelsPerUnitを取得する
   * @returns PixelsPerUnit
   */
  getPixelsPerUnit() {
    if (this._model == null) {
      return 0;
    }
    return this._model.canvasinfo.PixelsPerUnit;
  }
  /**
   * キャンバスの幅を取得する
   */
  getCanvasWidth() {
    if (this._model == null) {
      return 0;
    }
    return this._model.canvasinfo.CanvasWidth / this._model.canvasinfo.PixelsPerUnit;
  }
  /**
   * キャンバスの高さを取得する
   */
  getCanvasHeight() {
    if (this._model == null) {
      return 0;
    }
    return this._model.canvasinfo.CanvasHeight / this._model.canvasinfo.PixelsPerUnit;
  }
  /**
   * パラメータを保存する
   */
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
  /**
   * 乗算色を取得する
   * @param index Drawablesのインデックス
   * @returns 指定したdrawableの乗算色(RGBA)
   */
  getMultiplyColor(index) {
    if (this.getOverwriteFlagForModelMultiplyColors() || this.getOverwriteFlagForDrawableMultiplyColors(index)) {
      return this._userMultiplyColors[index].Color;
    }
    const color = this.getDrawableMultiplyColor(index);
    return color;
  }
  /**
   * スクリーン色を取得する
   * @param index Drawablesのインデックス
   * @returns 指定したdrawableのスクリーン色(RGBA)
   */
  getScreenColor(index) {
    if (this.getOverwriteFlagForModelScreenColors() || this.getOverwriteFlagForDrawableScreenColors(index)) {
      return this._userScreenColors[index].Color;
    }
    const color = this.getDrawableScreenColor(index);
    return color;
  }
  /**
   * 乗算色をセットする
   * @param index Drawablesのインデックス
   * @param color 設定する乗算色(CubismTextureColor)
   */
  setMultiplyColorByTextureColor(index, color) {
    this.setMultiplyColorByRGBA(index, color.R, color.G, color.B, color.A);
  }
  /**
   * 乗算色をセットする
   * @param index Drawablesのインデックス
   * @param r 設定する乗算色のR値
   * @param g 設定する乗算色のG値
   * @param b 設定する乗算色のB値
   * @param a 設定する乗算色のA値
   */
  setMultiplyColorByRGBA(index, r, g, b, a = 1) {
    this._userMultiplyColors[index].Color.R = r;
    this._userMultiplyColors[index].Color.G = g;
    this._userMultiplyColors[index].Color.B = b;
    this._userMultiplyColors[index].Color.A = a;
  }
  /**
   * スクリーン色をセットする
   * @param index Drawablesのインデックス
   * @param color 設定するスクリーン色(CubismTextureColor)
   */
  setScreenColorByTextureColor(index, color) {
    this.setScreenColorByRGBA(index, color.R, color.G, color.B, color.A);
  }
  /**
   * スクリーン色をセットする
   * @param index Drawablesのインデックス
   * @param r 設定するスクリーン色のR値
   * @param g 設定するスクリーン色のG値
   * @param b 設定するスクリーン色のB値
   * @param a 設定するスクリーン色のA値
   */
  setScreenColorByRGBA(index, r, g, b, a = 1) {
    this._userScreenColors[index].Color.R = r;
    this._userScreenColors[index].Color.G = g;
    this._userScreenColors[index].Color.B = b;
    this._userScreenColors[index].Color.A = a;
  }
  /**
   * partの乗算色を取得する
   * @param partIndex partのインデックス
   * @returns 指定したpartの乗算色
   */
  getPartMultiplyColor(partIndex) {
    return this._userPartMultiplyColors[partIndex].Color;
  }
  /**
   * partのスクリーン色を取得する
   * @param partIndex partのインデックス
   * @returns 指定したpartのスクリーン色
   */
  getPartScreenColor(partIndex) {
    return this._userPartScreenColors[partIndex].Color;
  }
  /**
   * partのOverwriteColor setter関数
   * @param partIndex partのインデックス
   * @param r 設定する色のR値
   * @param g 設定する色のG値
   * @param b 設定する色のB値
   * @param a 設定する色のA値
   * @param partColors 設定するpartのカラーデータ配列
   * @param drawableColors partに関連するDrawableのカラーデータ配列
   */
  setPartColor(partIndex, r, g, b, a, partColors, drawableColors) {
    partColors[partIndex].Color.R = r;
    partColors[partIndex].Color.G = g;
    partColors[partIndex].Color.B = b;
    partColors[partIndex].Color.A = a;
    if (partColors[partIndex].isOverwritten) {
      for (let i = 0; i < this._partChildDrawables[partIndex].length; ++i) {
        const drawableIndex = this._partChildDrawables[partIndex][i];
        drawableColors[drawableIndex].Color.R = r;
        drawableColors[drawableIndex].Color.G = g;
        drawableColors[drawableIndex].Color.B = b;
        drawableColors[drawableIndex].Color.A = a;
      }
    }
  }
  /**
   * 乗算色をセットする
   * @param partIndex partのインデックス
   * @param color 設定する乗算色(CubismTextureColor)
   */
  setPartMultiplyColorByTextureColor(partIndex, color) {
    this.setPartMultiplyColorByRGBA(
      partIndex,
      color.R,
      color.G,
      color.B,
      color.A
    );
  }
  /**
   * 乗算色をセットする
   * @param partIndex partのインデックス
   * @param r 設定する乗算色のR値
   * @param g 設定する乗算色のG値
   * @param b 設定する乗算色のB値
   * @param a 設定する乗算色のA値
   */
  setPartMultiplyColorByRGBA(partIndex, r, g, b, a) {
    this.setPartColor(
      partIndex,
      r,
      g,
      b,
      a,
      this._userPartMultiplyColors,
      this._userMultiplyColors
    );
  }
  /**
   * スクリーン色をセットする
   * @param partIndex partのインデックス
   * @param color 設定するスクリーン色(CubismTextureColor)
   */
  setPartScreenColorByTextureColor(partIndex, color) {
    this.setPartScreenColorByRGBA(
      partIndex,
      color.R,
      color.G,
      color.B,
      color.A
    );
  }
  /**
   * スクリーン色をセットする
   * @param partIndex partのインデックス
   * @param r 設定するスクリーン色のR値
   * @param g 設定するスクリーン色のG値
   * @param b 設定するスクリーン色のB値
   * @param a 設定するスクリーン色のA値
   */
  setPartScreenColorByRGBA(partIndex, r, g, b, a) {
    this.setPartColor(
      partIndex,
      r,
      g,
      b,
      a,
      this._userPartScreenColors,
      this._userScreenColors
    );
  }
  /**
   * SDKから指定したモデルの乗算色を上書きするか
   * @returns true -> SDKからの情報を優先する
   *          false -> モデルに設定されている色情報を使用
   */
  getOverwriteFlagForModelMultiplyColors() {
    return this._isOverwrittenModelMultiplyColors;
  }
  /**
   * SDKから指定したモデルのスクリーン色を上書きするか
   * @returns true -> SDKからの情報を優先する
   *          false -> モデルに設定されている色情報を使用
   */
  getOverwriteFlagForModelScreenColors() {
    return this._isOverwrittenModelScreenColors;
  }
  /**
   * SDKから指定したモデルの乗算色を上書きするかセットする
   * @param value true -> SDKからの情報を優先する
   *              false -> モデルに設定されている色情報を使用
   */
  setOverwriteFlagForModelMultiplyColors(value) {
    this._isOverwrittenModelMultiplyColors = value;
  }
  /**
   * SDKから指定したモデルのスクリーン色を上書きするかセットする
   * @param value true -> SDKからの情報を優先する
   *              false -> モデルに設定されている色情報を使用
   */
  setOverwriteFlagForModelScreenColors(value) {
    this._isOverwrittenModelScreenColors = value;
  }
  /**
   * SDKから指定したDrawableIndexの乗算色を上書きするか
   * @returns true -> SDKからの情報を優先する
   *          false -> モデルに設定されている色情報を使用
   */
  getOverwriteFlagForDrawableMultiplyColors(drawableindex) {
    return this._userMultiplyColors[drawableindex].isOverwritten;
  }
  /**
   * SDKから指定したDrawableIndexのスクリーン色を上書きするか
   * @returns true -> SDKからの情報を優先する
   *          false -> モデルに設定されている色情報を使用
   */
  getOverwriteFlagForDrawableScreenColors(drawableindex) {
    return this._userScreenColors[drawableindex].isOverwritten;
  }
  /**
   * SDKから指定したDrawableIndexの乗算色を上書きするかセットする
   * @param value true -> SDKからの情報を優先する
   *              false -> モデルに設定されている色情報を使用
   */
  setOverwriteFlagForDrawableMultiplyColors(drawableindex, value) {
    this._userMultiplyColors[drawableindex].isOverwritten = value;
  }
  /**
   * SDKから指定したDrawableIndexのスクリーン色を上書きするかセットする
   * @param value true -> SDKからの情報を優先する
   *              false -> モデルに設定されている色情報を使用
   */
  setOverwriteFlagForDrawableScreenColors(drawableindex, value) {
    this._userScreenColors[drawableindex].isOverwritten = value;
  }
  /**
   * SDKからpartの乗算色を上書きするか
   * @param partIndex partのインデックス
   * @returns true    ->  SDKからの情報を優先する
   *          false   ->  モデルに設定されている色情報を使用
   */
  getOverwriteColorForPartMultiplyColors(partIndex) {
    return this._userPartMultiplyColors[partIndex].isOverwritten;
  }
  /**
   * SDKからpartのスクリーン色を上書きするか
   * @param partIndex partのインデックス
   * @returns true    ->  SDKからの情報を優先する
   *          false   ->  モデルに設定されている色情報を使用
   */
  getOverwriteColorForPartScreenColors(partIndex) {
    return this._userPartScreenColors[partIndex].isOverwritten;
  }
  /**
   * partのOverwriteFlag setter関数
   * @param partIndex partのインデックス
   * @param value true -> SDKからの情報を優先する
   *              false -> モデルに設定されている色情報を使用
   * @param partColors 設定するpartのカラーデータ配列
   * @param drawableColors partに関連するDrawableのカラーデータ配列
   */
  setOverwriteColorForPartColors(partIndex, value, partColors, drawableColors) {
    partColors[partIndex].isOverwritten = value;
    for (let i = 0; i < this._partChildDrawables[partIndex].length; ++i) {
      const drawableIndex = this._partChildDrawables[partIndex][i];
      drawableColors[drawableIndex].isOverwritten = value;
      if (value) {
        drawableColors[drawableIndex].Color.R = partColors[partIndex].Color.R;
        drawableColors[drawableIndex].Color.G = partColors[partIndex].Color.G;
        drawableColors[drawableIndex].Color.B = partColors[partIndex].Color.B;
        drawableColors[drawableIndex].Color.A = partColors[partIndex].Color.A;
      }
    }
  }
  /**
   * SDKからpartのスクリーン色を上書きするかをセットする
   * @param partIndex partのインデックス
   * @param value true -> SDKからの情報を優先する
   *              false -> モデルに設定されている色情報を使用
   */
  setOverwriteColorForPartMultiplyColors(partIndex, value) {
    this._userPartMultiplyColors[partIndex].isOverwritten = value;
    this.setOverwriteColorForPartColors(
      partIndex,
      value,
      this._userPartMultiplyColors,
      this._userMultiplyColors
    );
  }
  /**
   * SDKからpartのスクリーン色を上書きするかをセットする
   * @param partIndex partのインデックス
   * @param value true -> SDKからの情報を優先する
   *              false -> モデルに設定されている色情報を使用
   */
  setOverwriteColorForPartScreenColors(partIndex, value) {
    this._userPartScreenColors[partIndex].isOverwritten = value;
    this.setOverwriteColorForPartColors(
      partIndex,
      value,
      this._userPartScreenColors,
      this._userScreenColors
    );
  }
  /**
   * Drawableのカリング情報を取得する。
   *
   * @param   drawableIndex   Drawableのインデックス
   * @return  Drawableのカリング情報
   */
  getDrawableCulling(drawableIndex) {
    if (this.getOverwriteFlagForModelCullings() || this.getOverwriteFlagForDrawableCullings(drawableIndex)) {
      return this._userCullings[drawableIndex].isCulling;
    }
    const constantFlags = this._model.drawables.constantFlags;
    return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(
      constantFlags[drawableIndex]
    );
  }
  /**
   * Drawableのカリング情報を設定する。
   *
   * @param drawableIndex Drawableのインデックス
   * @param isCulling カリング情報
   */
  setDrawableCulling(drawableIndex, isCulling) {
    this._userCullings[drawableIndex].isCulling = isCulling;
  }
  /**
   * SDKからモデル全体のカリング設定を上書きするか。
   *
   * @retval  true    ->  SDK上のカリング設定を使用
   * @retval  false   ->  モデルのカリング設定を使用
   */
  getOverwriteFlagForModelCullings() {
    return this._isOverwrittenCullings;
  }
  /**
   * SDKからモデル全体のカリング設定を上書きするかを設定する。
   *
   * @param isOverwrittenCullings SDK上のカリング設定を使うならtrue、モデルのカリング設定を使うならfalse
   */
  setOverwriteFlagForModelCullings(isOverwrittenCullings) {
    this._isOverwrittenCullings = isOverwrittenCullings;
  }
  /**
   *
   * @param drawableIndex Drawableのインデックス
   * @retval  true    ->  SDK上のカリング設定を使用
   * @retval  false   ->  モデルのカリング設定を使用
   */
  getOverwriteFlagForDrawableCullings(drawableIndex) {
    return this._userCullings[drawableIndex].isOverwritten;
  }
  /**
   *
   * @param drawableIndex Drawableのインデックス
   * @param isOverwrittenCullings SDK上のカリング設定を使うならtrue、モデルのカリング設定を使うならfalse
   */
  setOverwriteFlagForDrawableCullings(drawableIndex, isOverwrittenCullings) {
    this._userCullings[drawableIndex].isOverwritten = isOverwrittenCullings;
  }
  /**
   * モデルの不透明度を取得する
   *
   * @returns 不透明度の値
   */
  getModelOapcity() {
    return this._modelOpacity;
  }
  /**
   * モデルの不透明度を設定する
   *
   * @param value 不透明度の値
   */
  setModelOapcity(value) {
    this._modelOpacity = value;
  }
  /**
   * モデルを取得
   */
  getModel() {
    return this._model;
  }
  /**
   * パーツのインデックスを取得
   * @param partId パーツのID
   * @return パーツのインデックス
   */
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
  /**
   * パーツのIDを取得する。
   *
   * @param partIndex 取得するパーツのインデックス
   * @return パーツのID
   */
  getPartId(partIndex) {
    return this._model.parts.ids[partIndex];
  }
  /**
   * パーツの個数の取得
   * @return パーツの個数
   */
  getPartCount() {
    return this._model.parts.count;
  }
  /**
   * パーツの不透明度の設定(Index)
   * @param partIndex パーツのインデックス
   * @param opacity 不透明度
   */
  setPartOpacityByIndex(partIndex, opacity) {
    if (partIndex in this._notExistPartOpacities) {
      this._notExistPartOpacities[partIndex] = opacity;
      return;
    }
    CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
    this._partOpacities[partIndex] = opacity;
  }
  /**
   * パーツの不透明度の設定(Id)
   * @param partId パーツのID
   * @param opacity パーツの不透明度
   */
  setPartOpacityById(partId, opacity) {
    const index = this.getPartIndex(partId);
    if (index < 0) {
      return;
    }
    this.setPartOpacityByIndex(index, opacity);
  }
  /**
   * パーツの不透明度の取得(index)
   * @param partIndex パーツのインデックス
   * @return パーツの不透明度
   */
  getPartOpacityByIndex(partIndex) {
    if (partIndex in this._notExistPartOpacities) {
      return this._notExistPartOpacities[partIndex];
    }
    CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
    return this._partOpacities[partIndex];
  }
  /**
   * パーツの不透明度の取得(id)
   * @param partId パーツのＩｄ
   * @return パーツの不透明度
   */
  getPartOpacityById(partId) {
    const index = this.getPartIndex(partId);
    if (index < 0) {
      return 0;
    }
    return this.getPartOpacityByIndex(index);
  }
  /**
   * パラメータのインデックスの取得
   * @param パラメータID
   * @return パラメータのインデックス
   */
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
  /**
   * パラメータの個数の取得
   * @return パラメータの個数
   */
  getParameterCount() {
    return this._model.parameters.count;
  }
  /**
   * パラメータの種類の取得
   * @param parameterIndex パラメータのインデックス
   * @return csmParameterType_Normal -> 通常のパラメータ
   *          csmParameterType_BlendShape -> ブレンドシェイプパラメータ
   */
  getParameterType(parameterIndex) {
    return this._model.parameters.types[parameterIndex];
  }
  /**
   * パラメータの最大値の取得
   * @param parameterIndex パラメータのインデックス
   * @return パラメータの最大値
   */
  getParameterMaximumValue(parameterIndex) {
    return this._model.parameters.maximumValues[parameterIndex];
  }
  /**
   * パラメータの最小値の取得
   * @param parameterIndex パラメータのインデックス
   * @return パラメータの最小値
   */
  getParameterMinimumValue(parameterIndex) {
    return this._model.parameters.minimumValues[parameterIndex];
  }
  /**
   * パラメータのデフォルト値の取得
   * @param parameterIndex パラメータのインデックス
   * @return パラメータのデフォルト値
   */
  getParameterDefaultValue(parameterIndex) {
    return this._model.parameters.defaultValues[parameterIndex];
  }
  /**
   * パラメータの値の取得
   * @param parameterIndex    パラメータのインデックス
   * @return パラメータの値
   */
  getParameterValueByIndex(parameterIndex) {
    if (parameterIndex in this._notExistParameterValues) {
      return this._notExistParameterValues[parameterIndex];
    }
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );
    return this._parameterValues[parameterIndex];
  }
  /**
   * パラメータの値の取得
   * @param parameterId    パラメータのID
   * @return パラメータの値
   */
  getParameterValueById(parameterId) {
    const parameterIndex = this.getParameterIndex(parameterId);
    return this.getParameterValueByIndex(parameterIndex);
  }
  /**
   * パラメータの値の設定
   * @param parameterIndex パラメータのインデックス
   * @param value パラメータの値
   * @param weight 重み
   */
  setParameterValueByIndex(parameterIndex, value, weight = 1) {
    if (parameterIndex in this._notExistParameterValues) {
      this._notExistParameterValues[parameterIndex] = weight == 1 ? value : this._notExistParameterValues[parameterIndex] * (1 - weight) + value * weight;
      return;
    }
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );
    if (this._model.parameters.maximumValues[parameterIndex] < value) {
      value = this._model.parameters.maximumValues[parameterIndex];
    }
    if (this._model.parameters.minimumValues[parameterIndex] > value) {
      value = this._model.parameters.minimumValues[parameterIndex];
    }
    this._parameterValues[parameterIndex] = weight == 1 ? value : this._parameterValues[parameterIndex] = this._parameterValues[parameterIndex] * (1 - weight) + value * weight;
  }
  /**
   * パラメータの値の設定
   * @param parameterId パラメータのID
   * @param value パラメータの値
   * @param weight 重み
   */
  setParameterValueById(parameterId, value, weight = 1) {
    const index = this.getParameterIndex(parameterId);
    this.setParameterValueByIndex(index, value, weight);
  }
  /**
   * パラメータの値の加算(index)
   * @param parameterIndex パラメータインデックス
   * @param value 加算する値
   * @param weight 重み
   */
  addParameterValueByIndex(parameterIndex, value, weight = 1) {
    this.setParameterValueByIndex(
      parameterIndex,
      this.getParameterValueByIndex(parameterIndex) + value * weight
    );
  }
  /**
   * パラメータの値の加算(id)
   * @param parameterId パラメータＩＤ
   * @param value 加算する値
   * @param weight 重み
   */
  addParameterValueById(parameterId, value, weight = 1) {
    const index = this.getParameterIndex(parameterId);
    this.addParameterValueByIndex(index, value, weight);
  }
  /**
   * パラメータの値の乗算
   * @param parameterId パラメータのID
   * @param value 乗算する値
   * @param weight 重み
   */
  multiplyParameterValueById(parameterId, value, weight = 1) {
    const index = this.getParameterIndex(parameterId);
    this.multiplyParameterValueByIndex(index, value, weight);
  }
  /**
   * パラメータの値の乗算
   * @param parameterIndex パラメータのインデックス
   * @param value 乗算する値
   * @param weight 重み
   */
  multiplyParameterValueByIndex(parameterIndex, value, weight = 1) {
    this.setParameterValueByIndex(
      parameterIndex,
      this.getParameterValueByIndex(parameterIndex) * (1 + (value - 1) * weight)
    );
  }
  getDrawableIds() {
    return this._drawableIds.slice();
  }
  /**
   * Drawableのインデックスの取得
   * @param drawableId DrawableのID
   * @return Drawableのインデックス
   */
  getDrawableIndex(drawableId) {
    const drawableCount = this._model.drawables.count;
    for (let drawableIndex = 0; drawableIndex < drawableCount; ++drawableIndex) {
      if (this._drawableIds[drawableIndex] == drawableId) {
        return drawableIndex;
      }
    }
    return -1;
  }
  /**
   * Drawableの個数の取得
   * @return drawableの個数
   */
  getDrawableCount() {
    return this._model.drawables.count;
  }
  /**
   * DrawableのIDを取得する
   * @param drawableIndex Drawableのインデックス
   * @return drawableのID
   */
  getDrawableId(drawableIndex) {
    return this._model.drawables.ids[drawableIndex];
  }
  /**
   * Drawableの描画順リストの取得
   * @return Drawableの描画順リスト
   */
  getDrawableRenderOrders() {
    return this._model.drawables.renderOrders;
  }
  /**
   * @deprecated
   * 関数名が誤っていたため、代替となる getDrawableTextureIndex を追加し、この関数は非推奨となりました。
   *
   * Drawableのテクスチャインデックスリストの取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableのテクスチャインデックスリスト
   */
  getDrawableTextureIndices(drawableIndex) {
    return this.getDrawableTextureIndex(drawableIndex);
  }
  /**
   * Drawableのテクスチャインデックスの取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableのテクスチャインデックス
   */
  getDrawableTextureIndex(drawableIndex) {
    const textureIndices = this._model.drawables.textureIndices;
    return textureIndices[drawableIndex];
  }
  /**
   * DrawableのVertexPositionsの変化情報の取得
   *
   * 直近のCubismModel.update関数でDrawableの頂点情報が変化したかを取得する。
   *
   * @param   drawableIndex   Drawableのインデックス
   * @retval  true    Drawableの頂点情報が直近のCubismModel.update関数で変化した
   * @retval  false   Drawableの頂点情報が直近のCubismModel.update関数で変化していない
   */
  getDrawableDynamicFlagVertexPositionsDidChange(drawableIndex) {
    const dynamicFlags = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }
  /**
   * Drawableの頂点インデックスの個数の取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの頂点インデックスの個数
   */
  getDrawableVertexIndexCount(drawableIndex) {
    return this._model.drawables.indexCounts[drawableIndex];
  }
  /**
   * Drawableの頂点の個数の取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの頂点の個数
   */
  getDrawableVertexCount(drawableIndex) {
    return this._model.drawables.vertexCounts[drawableIndex];
  }
  /**
   * Drawableの頂点リストの取得
   * @param drawableIndex drawableのインデックス
   * @return drawableの頂点リスト
   */
  getDrawableVertices(drawableIndex) {
    return this.getDrawableVertexPositions(drawableIndex);
  }
  /**
   * Drawableの頂点インデックスリストの取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの頂点インデックスリスト
   */
  getDrawableVertexIndices(drawableIndex) {
    return this._model.drawables.indices[drawableIndex];
  }
  /**
   * Drawableの頂点リストの取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの頂点リスト
   */
  getDrawableVertexPositions(drawableIndex) {
    return this._model.drawables.vertexPositions[drawableIndex];
  }
  /**
   * Drawableの頂点のUVリストの取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの頂点UVリスト
   */
  getDrawableVertexUvs(drawableIndex) {
    return this._model.drawables.vertexUvs[drawableIndex];
  }
  /**
   * Drawableの不透明度の取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの不透明度
   */
  getDrawableOpacity(drawableIndex) {
    return this._model.drawables.opacities[drawableIndex];
  }
  /**
   * Drawableの乗算色の取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの乗算色(RGBA)
   * スクリーン色はRGBAで取得されるが、Aは必ず0
   */
  getDrawableMultiplyColor(drawableIndex) {
    const multiplyColors = this._model.drawables.multiplyColors;
    const index = drawableIndex * 4;
    const multiplyColor = new CubismTextureColor();
    multiplyColor.R = multiplyColors[index];
    multiplyColor.G = multiplyColors[index + 1];
    multiplyColor.B = multiplyColors[index + 2];
    multiplyColor.A = multiplyColors[index + 3];
    return multiplyColor;
  }
  /**
   * Drawableのスクリーン色の取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableのスクリーン色(RGBA)
   * スクリーン色はRGBAで取得されるが、Aは必ず0
   */
  getDrawableScreenColor(drawableIndex) {
    const screenColors = this._model.drawables.screenColors;
    const index = drawableIndex * 4;
    const screenColor = new CubismTextureColor();
    screenColor.R = screenColors[index];
    screenColor.G = screenColors[index + 1];
    screenColor.B = screenColors[index + 2];
    screenColor.A = screenColors[index + 3];
    return screenColor;
  }
  /**
   * Drawableの親パーツのインデックスの取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableの親パーツのインデックス
   */
  getDrawableParentPartIndex(drawableIndex) {
    return this._model.drawables.parentPartIndices[drawableIndex];
  }
  /**
   * Drawableのブレンドモードを取得
   * @param drawableIndex Drawableのインデックス
   * @return drawableのブレンドモード
   */
  getDrawableBlendMode(drawableIndex) {
    const constantFlags = this._model.drawables.constantFlags;
    return Live2DCubismCore.Utils.hasBlendAdditiveBit(
      constantFlags[drawableIndex]
    ) ? CubismBlendMode.CubismBlendMode_Additive : Live2DCubismCore.Utils.hasBlendMultiplicativeBit(
      constantFlags[drawableIndex]
    ) ? CubismBlendMode.CubismBlendMode_Multiplicative : CubismBlendMode.CubismBlendMode_Normal;
  }
  /**
   * Drawableのマスクの反転使用の取得
   *
   * Drawableのマスク使用時の反転設定を取得する。
   * マスクを使用しない場合は無視される。
   *
   * @param drawableIndex Drawableのインデックス
   * @return Drawableの反転設定
   */
  getDrawableInvertedMaskBit(drawableIndex) {
    const constantFlags = this._model.drawables.constantFlags;
    return Live2DCubismCore.Utils.hasIsInvertedMaskBit(
      constantFlags[drawableIndex]
    );
  }
  /**
   * Drawableのクリッピングマスクリストの取得
   * @return Drawableのクリッピングマスクリスト
   */
  getDrawableMasks() {
    return this._model.drawables.masks;
  }
  /**
   * Drawableのクリッピングマスクの個数リストの取得
   * @return Drawableのクリッピングマスクの個数リスト
   */
  getDrawableMaskCounts() {
    return this._model.drawables.maskCounts;
  }
  /**
   * クリッピングマスクの使用状態
   *
   * @return true クリッピングマスクを使用している
   * @return false クリッピングマスクを使用していない
   */
  isUsingMasking() {
    for (let d = 0; d < this._model.drawables.count; ++d) {
      if (this._model.drawables.maskCounts[d] <= 0) {
        continue;
      }
      return true;
    }
    return false;
  }
  /**
   * Drawableの表示情報を取得する
   *
   * @param drawableIndex Drawableのインデックス
   * @return true Drawableが表示
   * @return false Drawableが非表示
   */
  getDrawableDynamicFlagIsVisible(drawableIndex) {
    const dynamicFlags = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasIsVisibleBit(dynamicFlags[drawableIndex]);
  }
  /**
   * DrawableのDrawOrderの変化情報の取得
   *
   * 直近のCubismModel.update関数でdrawableのdrawOrderが変化したかを取得する。
   * drawOrderはartMesh上で指定する0から1000の情報
   * @param drawableIndex drawableのインデックス
   * @return true drawableの不透明度が直近のCubismModel.update関数で変化した
   * @return false drawableの不透明度が直近のCubismModel.update関数で変化している
   */
  getDrawableDynamicFlagVisibilityDidChange(drawableIndex) {
    const dynamicFlags = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVisibilityDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }
  /**
   * Drawableの不透明度の変化情報の取得
   *
   * 直近のCubismModel.update関数でdrawableの不透明度が変化したかを取得する。
   *
   * @param drawableIndex drawableのインデックス
   * @return true Drawableの不透明度が直近のCubismModel.update関数で変化した
   * @return false Drawableの不透明度が直近のCubismModel.update関数で変化してない
   */
  getDrawableDynamicFlagOpacityDidChange(drawableIndex) {
    const dynamicFlags = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasOpacityDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }
  /**
   * Drawableの描画順序の変化情報の取得
   *
   * 直近のCubismModel.update関数でDrawableの描画の順序が変化したかを取得する。
   *
   * @param drawableIndex Drawableのインデックス
   * @return true Drawableの描画の順序が直近のCubismModel.update関数で変化した
   * @return false Drawableの描画の順序が直近のCubismModel.update関数で変化してない
   */
  getDrawableDynamicFlagRenderOrderDidChange(drawableIndex) {
    const dynamicFlags = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }
  /**
   * Drawableの乗算色・スクリーン色の変化情報の取得
   *
   * 直近のCubismModel.update関数でDrawableの乗算色・スクリーン色が変化したかを取得する。
   *
   * @param drawableIndex Drawableのインデックス
   * @return true Drawableの乗算色・スクリーン色が直近のCubismModel.update関数で変化した
   * @return false Drawableの乗算色・スクリーン色が直近のCubismModel.update関数で変化してない
   */
  getDrawableDynamicFlagBlendColorDidChange(drawableIndex) {
    const dynamicFlags = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasBlendColorDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }
  /**
   * 保存されたパラメータの読み込み
   */
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
  /**
   * 初期化する
   */
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
    const partCount = this._model.parts.count;
    {
      const partIds = this._model.parts.ids;
      for (let i = 0; i < partCount; ++i) {
        this._partIds.push(partIds[i]);
      }
    }
    {
      const drawableIds = this._model.drawables.ids;
      const drawableCount = this._model.drawables.count;
      const userCulling = new DrawableCullingData(
        false,
        false
      );
      {
        for (let i = 0; i < partCount; ++i) {
          const multiplyColor = new CubismTextureColor(
            1,
            1,
            1,
            1
          );
          const screenColor = new CubismTextureColor(
            0,
            0,
            0,
            1
          );
          const userMultiplyColor = new PartColorData(
            false,
            multiplyColor
          );
          const userScreenColor = new PartColorData(
            false,
            screenColor
          );
          this._userPartMultiplyColors.push(userMultiplyColor);
          this._userPartScreenColors.push(userScreenColor);
          this._partChildDrawables.push([]);
        }
      }
      {
        for (let i = 0; i < drawableCount; ++i) {
          const multiplyColor = new CubismTextureColor(
            1,
            1,
            1,
            1
          );
          const screenColor = new CubismTextureColor(
            0,
            0,
            0,
            1
          );
          const userMultiplyColor = new DrawableColorData(
            false,
            multiplyColor
          );
          const userScreenColor = new DrawableColorData(
            false,
            screenColor
          );
          this._drawableIds.push(drawableIds[i]);
          this._userMultiplyColors.push(userMultiplyColor);
          this._userScreenColors.push(userScreenColor);
          this._userCullings.push(userCulling);
          const parentIndex = this.getDrawableParentPartIndex(i);
          if (parentIndex >= 0) {
            this._partChildDrawables[parentIndex].push(i);
          }
        }
      }
    }
  }
  /**
   * コンストラクタ
   * @param model モデル
   */
  constructor(model) {
    this._model = model;
    this._savedParameters = [];
    this._parameterIds = [];
    this._drawableIds = [];
    this._partIds = [];
    this._isOverwrittenModelMultiplyColors = false;
    this._isOverwrittenModelScreenColors = false;
    this._isOverwrittenCullings = false;
    this._modelOpacity = 1;
    this._userMultiplyColors = [];
    this._userScreenColors = [];
    this._userCullings = [];
    this._userPartMultiplyColors = [];
    this._userPartScreenColors = [];
    this._partChildDrawables = [];
    this._notExistPartId = {};
    this._notExistParameterId = {};
    this._notExistParameterValues = {};
    this._notExistPartOpacities = {};
    this.initialize();
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._model.release();
    this._model = void 0;
  }
  // カリング設定の配列
}
class CubismMoc {
  /**
   * Mocデータの作成
   */
  static create(mocBytes, shouldCheckMocConsistency) {
    if (shouldCheckMocConsistency) {
      const consistency = this.hasMocConsistency(mocBytes);
      if (!consistency) {
        throw new Error(`Inconsistent MOC3.`);
      }
    }
    const moc = Live2DCubismCore.Moc.fromArrayBuffer(mocBytes);
    if (moc) {
      const cubismMoc = new CubismMoc(moc);
      cubismMoc._mocVersion = Live2DCubismCore.Version.csmGetMocVersion(
        moc,
        mocBytes
      );
      return cubismMoc;
    }
    throw new Error("Failed to CubismMoc.create().");
  }
  /**
   * モデルを作成する
   *
   * @return Mocデータから作成されたモデル
   */
  createModel() {
    let cubismModel;
    const model = Live2DCubismCore.Model.fromMoc(
      this._moc
    );
    if (model) {
      cubismModel = new CubismModel(model);
      ++this._modelCount;
      return cubismModel;
    }
    throw new Error("Unknown error");
  }
  /**
   * モデルを削除する
   */
  deleteModel(model) {
    if (model != null) {
      --this._modelCount;
    }
  }
  /**
   * コンストラクタ
   */
  constructor(moc) {
    this._moc = moc;
    this._modelCount = 0;
    this._mocVersion = 0;
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._moc._release();
    this._moc = void 0;
  }
  /**
   * 最新の.moc3 Versionを取得
   */
  getLatestMocVersion() {
    return Live2DCubismCore.Version.csmGetLatestMocVersion();
  }
  /**
   * 読み込んだモデルの.moc3 Versionを取得
   */
  getMocVersion() {
    return this._mocVersion;
  }
  /**
   * .moc3 の整合性を検証する
   */
  static hasMocConsistency(mocBytes) {
    const isConsistent = Live2DCubismCore.Moc.prototype.hasMocConsistency(mocBytes);
    return isConsistent === 1 ? true : false;
  }
  // 読み込んだモデルの.moc3 Version
}
class CubismModelUserDataJson {
  /**
   * コンストラクタ
   * @param json    userdata3.jsonが読み込まれているバッファ
   * @param size      バッファのサイズ
   */
  constructor(json, size) {
    this._json = json;
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._json = void 0;
  }
  /**
   * ユーザーデータ個数の取得
   * @return ユーザーデータの個数
   */
  getUserDataCount() {
    return this._json.Meta.UserDataCount;
  }
  /**
   * ユーザーデータ総文字列数の取得
   *
   * @return ユーザーデータ総文字列数
   */
  getTotalUserDataSize() {
    return this._json.Meta.TotalUserDataSize;
  }
  /**
   * ユーザーデータのタイプの取得
   *
   * @return ユーザーデータのタイプ
   */
  getUserDataTargetType(i) {
    return this._json.UserData[i].Target;
  }
  /**
   * ユーザーデータのターゲットIDの取得
   *
   * @param i インデックス
   * @return ユーザーデータターゲットID
   */
  getUserDataId(i) {
    return this._json.UserData[i].Id;
  }
  /**
   * ユーザーデータの文字列の取得
   *
   * @param i インデックス
   * @return ユーザーデータ
   */
  getUserDataValue(i) {
    return this._json.UserData[i].Value;
  }
}
const ArtMesh = "ArtMesh";
class CubismModelUserData {
  /**
   * インスタンスの作成
   *
   * @param json    userdata3.jsonが読み込まれているバッファ
   * @param size      バッファのサイズ
   * @return 作成されたインスタンス
   */
  static create(json, size) {
    const ret = new CubismModelUserData();
    ret.parseUserData(json, size);
    return ret;
  }
  /**
   * ArtMeshのユーザーデータのリストの取得
   *
   * @return ユーザーデータリスト
   */
  getArtMeshUserDatas() {
    return this._artMeshUserDataNode;
  }
  /**
   * userdata3.jsonのパース
   *
   * @param data    userdata3.jsonが読み込まれているバッファ
   * @param size      バッファのサイズ
   */
  parseUserData(data, size) {
    const json = new CubismModelUserDataJson(
      data,
      size
    );
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
  /**
   * コンストラクタ
   */
  constructor() {
    this._userDataNodes = [];
    this._artMeshUserDataNode = [];
  }
  /**
   * デストラクタ相当の処理
   *
   * ユーザーデータ構造体配列を解放する
   */
  release() {
    this._userDataNodes = null;
  }
  // 閲覧リストの保持
}
class ACubismMotion {
  /**
   * コンストラクタ
   */
  constructor() {
    this._fadeInSeconds = -1;
    this._fadeOutSeconds = -1;
    this._weight = 1;
    this._offsetSeconds = 0;
    this._firedEventValues = [];
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._weight = 0;
  }
  /**
   * モデルのパラメータ
   * @param model 対象のモデル
   * @param motionQueueEntry CubismMotionQueueManagerで管理されているモーション
   * @param userTimeSeconds デルタ時間の積算値[秒]
   */
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
        motionQueueEntry.setEndTime(
          duration <= 0 ? -1 : motionQueueEntry.getStartTime() + duration
        );
      }
    }
    let fadeWeight = this._weight;
    const fadeIn = this._fadeInSeconds == 0 ? 1 : CubismMath.getEasingSine(
      (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / this._fadeInSeconds
    );
    const fadeOut = this._fadeOutSeconds == 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine(
      (motionQueueEntry.getEndTime() - userTimeSeconds) / this._fadeOutSeconds
    );
    fadeWeight = fadeWeight * fadeIn * fadeOut;
    motionQueueEntry.setState(userTimeSeconds, fadeWeight);
    CSM_ASSERT(0 <= fadeWeight && fadeWeight <= 1);
    this.doUpdateParameters(
      model,
      userTimeSeconds,
      fadeWeight,
      motionQueueEntry
    );
    if (motionQueueEntry.getEndTime() > 0 && motionQueueEntry.getEndTime() < userTimeSeconds) {
      motionQueueEntry.setIsFinished(true);
    }
  }
  /**
   * フェードインの時間を設定する
   * @param fadeInSeconds フェードインにかかる時間[秒]
   */
  setFadeInTime(fadeInSeconds) {
    this._fadeInSeconds = fadeInSeconds;
  }
  /**
   * フェードアウトの時間を設定する
   * @param fadeOutSeconds フェードアウトにかかる時間[秒]
   */
  setFadeOutTime(fadeOutSeconds) {
    this._fadeOutSeconds = fadeOutSeconds;
  }
  /**
   * フェードアウトにかかる時間の取得
   * @return フェードアウトにかかる時間[秒]
   */
  getFadeOutTime() {
    return this._fadeOutSeconds;
  }
  /**
   * フェードインにかかる時間の取得
   * @return フェードインにかかる時間[秒]
   */
  getFadeInTime() {
    return this._fadeInSeconds;
  }
  /**
   * モーション適用の重みの設定
   * @param weight 重み（0.0 - 1.0）
   */
  setWeight(weight) {
    this._weight = weight;
  }
  /**
   * モーション適用の重みの取得
   * @return 重み（0.0 - 1.0）
   */
  getWeight() {
    return this._weight;
  }
  /**
   * モーションの長さの取得
   * @return モーションの長さ[秒]
   *
   * @note ループの時は「-1」。
   *       ループでない場合は、オーバーライドする。
   *       正の値の時は取得される時間で終了する。
   *       「-1」の時は外部から停止命令がない限り終わらない処理となる。
   */
  getDuration() {
    return -1;
  }
  /**
   * モーションのループ1回分の長さの取得
   * @return モーションのループ一回分の長さ[秒]
   *
   * @note ループしない場合は、getDuration()と同じ値を返す
   *       ループ一回分の長さが定義できない場合(プログラム的に動き続けるサブクラスなど)の場合は「-1」を返す
   */
  getLoopDuration() {
    return -1;
  }
  /**
   * モーション再生の開始時刻の設定
   * @param offsetSeconds モーション再生の開始時刻[秒]
   */
  setOffsetTime(offsetSeconds) {
    this._offsetSeconds = offsetSeconds;
  }
  /**
   * モデルのパラメータ更新
   *
   * イベント発火のチェック。
   * 入力する時間は呼ばれるモーションタイミングを０とした秒数で行う。
   *
   * @param beforeCheckTimeSeconds 前回のイベントチェック時間[秒]
   * @param motionTimeSeconds 今回の再生時間[秒]
   */
  getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
    return this._firedEventValues;
  }
  /**
   * モーション再生終了コールバックの登録
   *
   * モーション再生終了コールバックを登録する。
   * isFinishedフラグを設定するタイミングで呼び出される。
   * 以下の状態の際には呼び出されない:
   *   1. 再生中のモーションが「ループ」として設定されているとき
   *   2. コールバックが登録されていない時
   *
   * @param onFinishedMotionHandler モーション再生終了コールバック関数
   */
  setFinishedMotionHandler(onFinishedMotionHandler) {
    this._onFinishedMotion = onFinishedMotionHandler;
  }
  /**
   * モーション再生終了コールバックの取得
   *
   * モーション再生終了コールバックを取得する。
   *
   * @return 登録されているモーション再生終了コールバック関数
   */
  getFinishedMotionHandler() {
    return this._onFinishedMotion;
  }
  /**
   * 透明度のカーブが存在するかどうかを確認する
   *
   * @returns true  -> キーが存在する
   *          false -> キーが存在しない
   */
  isExistModelOpacity() {
    return false;
  }
  /**
   * 透明度のカーブのインデックスを返す
   *
   * @returns success:透明度のカーブのインデックス
   */
  getModelOpacityIndex() {
    return -1;
  }
  /**
   * 透明度のIdを返す
   *
   * @param index モーションカーブのインデックス
   * @returns success:透明度のId
   */
  getModelOpacityId(index) {
    return void 0;
  }
  /**
   * 指定時間の透明度の値を返す
   *
   * @returns success:モーションの現在時間におけるOpacityの値
   *
   * @note  更新後の値を取るにはUpdateParameters() の後に呼び出す。
   */
  getModelOpacityValue() {
    return 1;
  }
}
const DefaultFadeTime = 1;
class CubismExpressionMotion extends ACubismMotion {
  /**
   * インスタンスを作成する。
   * @param json expファイルが読み込まれているバッファ
   * @param size バッファのサイズ
   * @return 作成されたインスタンス
   */
  static create(json) {
    const expression = new CubismExpressionMotion();
    expression.parse(json);
    return expression;
  }
  /**
   * モデルのパラメータの更新の実行
   * @param model 対象のモデル
   * @param userTimeSeconds デルタ時間の積算値[秒]
   * @param weight モーションの重み
   * @param motionQueueEntry CubismMotionQueueManagerで管理されているモーション
   */
  doUpdateParameters(model, userTimeSeconds, weight, motionQueueEntry) {
    for (let i = 0; i < this._parameters.length; ++i) {
      const parameter = this._parameters[i];
      switch (parameter.blendType) {
        case 0: {
          model.addParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        case 1: {
          model.multiplyParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        case 2: {
          model.setParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
      }
    }
  }
  parse(json) {
    this.setFadeInTime(
      json.FadeInTime != void 0 ? json.FadeInTime : DefaultFadeTime
    );
    this.setFadeOutTime(
      json.FadeOutTime != void 0 ? json.FadeOutTime : DefaultFadeTime
    );
    const parameterCount = (json.Parameters || []).length;
    for (let i = 0; i < parameterCount; ++i) {
      const param = json.Parameters[i];
      const parameterId = param.Id;
      const value = param.Value;
      let blendType;
      if (!param.Blend || param.Blend === "Add") {
        blendType = 0;
      } else if (param.Blend === "Multiply") {
        blendType = 1;
      } else if (param.Blend === "Overwrite") {
        blendType = 2;
      } else {
        blendType = 0;
      }
      const item = {
        parameterId,
        blendType,
        value
      };
      this._parameters.push(item);
    }
  }
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this._parameters = [];
  }
  // 表情のパラメータ情報リスト
}
var ExpressionBlendType = /* @__PURE__ */ ((ExpressionBlendType2) => {
  ExpressionBlendType2[ExpressionBlendType2["ExpressionBlendType_Add"] = 0] = "ExpressionBlendType_Add";
  ExpressionBlendType2[ExpressionBlendType2["ExpressionBlendType_Multiply"] = 1] = "ExpressionBlendType_Multiply";
  ExpressionBlendType2[ExpressionBlendType2["ExpressionBlendType_Overwrite"] = 2] = "ExpressionBlendType_Overwrite";
  return ExpressionBlendType2;
})(ExpressionBlendType || {});
var CubismConfig;
((CubismConfig2) => {
  CubismConfig2.supportMoreMaskDivisions = true;
  CubismConfig2.setOpacityFromMotion = false;
})(CubismConfig || (CubismConfig = {}));
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
  // 値
}
class CubismMotionSegment {
  /**
   * @brief コンストラクタ
   *
   * コンストラクタ。
   */
  constructor() {
    this.basePointIndex = 0;
    this.segmentType = 0;
  }
  // セグメントの種類
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
  // フェードアウトにかかる時間[秒]
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
  // イベントのリスト
}
class CubismMotionJson {
  /**
   * コンストラクタ
   * @param json motion3.jsonが読み込まれているバッファ
   */
  constructor(json) {
    this._json = json;
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._json = void 0;
  }
  /**
   * モーションの長さを取得する
   * @return モーションの長さ[秒]
   */
  getMotionDuration() {
    return this._json.Meta.Duration;
  }
  /**
   * モーションのループ情報の取得
   * @return true ループする
   * @return false ループしない
   */
  isMotionLoop() {
    return this._json.Meta.Loop || false;
  }
  getEvaluationOptionFlag(flagType) {
    if (0 == flagType) {
      return !!this._json.Meta.AreBeziersRestricted;
    }
    return false;
  }
  /**
   * モーションカーブの個数の取得
   * @return モーションカーブの個数
   */
  getMotionCurveCount() {
    return this._json.Meta.CurveCount;
  }
  /**
   * モーションのフレームレートの取得
   * @return フレームレート[FPS]
   */
  getMotionFps() {
    return this._json.Meta.Fps;
  }
  /**
   * モーションのセグメントの総合計の取得
   * @return モーションのセグメントの取得
   */
  getMotionTotalSegmentCount() {
    return this._json.Meta.TotalSegmentCount;
  }
  /**
   * モーションのカーブの制御店の総合計の取得
   * @return モーションのカーブの制御点の総合計
   */
  getMotionTotalPointCount() {
    return this._json.Meta.TotalPointCount;
  }
  /**
   * モーションのフェードイン時間の取得
   * @return フェードイン時間[秒]
   */
  getMotionFadeInTime() {
    return this._json.Meta.FadeInTime;
  }
  /**
   * モーションのフェードアウト時間の取得
   * @return フェードアウト時間[秒]
   */
  getMotionFadeOutTime() {
    return this._json.Meta.FadeOutTime;
  }
  /**
   * モーションのカーブの種類の取得
   * @param curveIndex カーブのインデックス
   * @return カーブの種類
   */
  getMotionCurveTarget(curveIndex) {
    return this._json.Curves[curveIndex].Target;
  }
  /**
   * モーションのカーブのIDの取得
   * @param curveIndex カーブのインデックス
   * @return カーブのID
   */
  getMotionCurveId(curveIndex) {
    return this._json.Curves[curveIndex].Id;
  }
  /**
   * モーションのカーブのフェードイン時間の取得
   * @param curveIndex カーブのインデックス
   * @return フェードイン時間[秒]
   */
  getMotionCurveFadeInTime(curveIndex) {
    return this._json.Curves[curveIndex].FadeInTime;
  }
  /**
   * モーションのカーブのフェードアウト時間の取得
   * @param curveIndex カーブのインデックス
   * @return フェードアウト時間[秒]
   */
  getMotionCurveFadeOutTime(curveIndex) {
    return this._json.Curves[curveIndex].FadeOutTime;
  }
  /**
   * モーションのカーブのセグメントの個数を取得する
   * @param curveIndex カーブのインデックス
   * @return モーションのカーブのセグメントの個数
   */
  getMotionCurveSegmentCount(curveIndex) {
    return this._json.Curves[curveIndex].Segments.length;
  }
  /**
   * モーションのカーブのセグメントの値の取得
   * @param curveIndex カーブのインデックス
   * @param segmentIndex セグメントのインデックス
   * @return セグメントの値
   */
  getMotionCurveSegment(curveIndex, segmentIndex) {
    return this._json.Curves[curveIndex].Segments[segmentIndex];
  }
  /**
   * イベントの個数の取得
   * @return イベントの個数
   */
  getEventCount() {
    return this._json.Meta.UserDataCount || 0;
  }
  /**
   *  イベントの総文字数の取得
   * @return イベントの総文字数
   */
  getTotalEventValueSize() {
    return this._json.Meta.TotalUserDataSize;
  }
  /**
   * イベントの時間の取得
   * @param userDataIndex イベントのインデックス
   * @return イベントの時間[秒]
   */
  getEventTime(userDataIndex) {
    return this._json.UserData[userDataIndex].Time;
  }
  /**
   * イベントの取得
   * @param userDataIndex イベントのインデックス
   * @return イベントの文字列
   */
  getEventValue(userDataIndex) {
    return this._json.UserData[userDataIndex].Value;
  }
  // motion3.jsonのデータ
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
const IdNameOpacity = "Opacity";
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
  return segment.evaluate(
    motionData.points.slice(segment.basePointIndex),
    time
  );
}
class CubismMotion extends ACubismMotion {
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this._eyeBlinkParameterIds = [];
    this._lipSyncParameterIds = [];
    this._sourceFrameRate = 30;
    this._loopDurationSeconds = -1;
    this._isLoop = false;
    this._isLoopFadeIn = true;
    this._lastWeight = 0;
    this._modelOpacity = 1;
  }
  /**
   * インスタンスを作成する
   *
   * @param json motion3.jsonが読み込まれているバッファ
   * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
   * @return 作成されたインスタンス
   */
  static create(json, onFinishedMotionHandler) {
    const ret = new CubismMotion();
    ret.parse(json);
    ret._sourceFrameRate = ret._motionData.fps;
    ret._loopDurationSeconds = ret._motionData.duration;
    ret._onFinishedMotion = onFinishedMotionHandler;
    return ret;
  }
  /**
   * モデルのパラメータの更新の実行
   * @param model             対象のモデル
   * @param userTimeSeconds   現在の時刻[秒]
   * @param fadeWeight        モーションの重み
   * @param motionQueueEntry  CubismMotionQueueManagerで管理されているモーション
   */
  doUpdateParameters(model, userTimeSeconds, fadeWeight, motionQueueEntry) {
    if (this._modelCurveIdEyeBlink == null) {
      this._modelCurveIdEyeBlink = EffectNameEyeBlink;
    }
    if (this._modelCurveIdLipSync == null) {
      this._modelCurveIdLipSync = EffectNameLipSync;
    }
    if (this._modelCurveIdOpacity == null) {
      this._modelCurveIdOpacity = IdNameOpacity;
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
      CubismLogDebug(
        "too many eye blink targets : {0}",
        this._eyeBlinkParameterIds.length
      );
    }
    if (this._lipSyncParameterIds.length > MaxTargetSize) {
      CubismLogDebug(
        "too many lip sync targets : {0}",
        this._lipSyncParameterIds.length
      );
    }
    const tmpFadeIn = this._fadeInSeconds <= 0 ? 1 : CubismMath.getEasingSine(
      (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / this._fadeInSeconds
    );
    const tmpFadeOut = this._fadeOutSeconds <= 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine(
      (motionQueueEntry.getEndTime() - userTimeSeconds) / this._fadeOutSeconds
    );
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
      } else if (curves[c].id == this._modelCurveIdOpacity) {
        this._modelOpacity = value;
        model.setModelOapcity(this.getModelOpacityValue());
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
          fin = curves[c].fadeInTime == 0 ? 1 : CubismMath.getEasingSine(
            (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / curves[c].fadeInTime
          );
        }
        if (curves[c].fadeOutTime < 0) {
          fout = tmpFadeOut;
        } else {
          fout = curves[c].fadeOutTime == 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine(
            (motionQueueEntry.getEndTime() - userTimeSeconds) / curves[c].fadeOutTime
          );
        }
        const paramWeight = this._weight * fin * fout;
        v = sourceValue + (value - sourceValue) * paramWeight;
      }
      model.setParameterValueByIndex(parameterIndex, v, 1);
    }
    {
      if (eyeBlinkValue != Number.MAX_VALUE) {
        for (let i = 0; i < this._eyeBlinkParameterIds.length && i < MaxTargetSize; ++i) {
          const sourceValue = model.getParameterValueById(
            this._eyeBlinkParameterIds[i]
          );
          if (eyeBlinkFlags >> i & 1) {
            continue;
          }
          const v = sourceValue + (eyeBlinkValue - sourceValue) * fadeWeight;
          model.setParameterValueById(this._eyeBlinkParameterIds[i], v);
        }
      }
      if (lipSyncValue != Number.MAX_VALUE) {
        for (let i = 0; i < this._lipSyncParameterIds.length && i < MaxTargetSize; ++i) {
          const sourceValue = model.getParameterValueById(
            this._lipSyncParameterIds[i]
          );
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
      if (CubismConfig.setOpacityFromMotion) {
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
  /**
   * ループ情報の設定
   * @param loop ループ情報
   */
  setIsLoop(loop) {
    this._isLoop = loop;
  }
  /**
   * ループ情報の取得
   * @return true ループする
   * @return false ループしない
   */
  isLoop() {
    return this._isLoop;
  }
  /**
   * ループ時のフェードイン情報の設定
   * @param loopFadeIn  ループ時のフェードイン情報
   */
  setIsLoopFadeIn(loopFadeIn) {
    this._isLoopFadeIn = loopFadeIn;
  }
  /**
   * ループ時のフェードイン情報の取得
   *
   * @return  true    する
   * @return  false   しない
   */
  isLoopFadeIn() {
    return this._isLoopFadeIn;
  }
  /**
   * モーションの長さを取得する。
   *
   * @return  モーションの長さ[秒]
   */
  getDuration() {
    return this._isLoop ? -1 : this._loopDurationSeconds;
  }
  /**
   * モーションのループ時の長さを取得する。
   *
   * @return  モーションのループ時の長さ[秒]
   */
  getLoopDuration() {
    return this._loopDurationSeconds;
  }
  /**
   * パラメータに対するフェードインの時間を設定する。
   *
   * @param parameterId     パラメータID
   * @param value           フェードインにかかる時間[秒]
   */
  setParameterFadeInTime(parameterId, value) {
    const curves = this._motionData.curves;
    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves[i].id) {
        curves[i].fadeInTime = value;
        return;
      }
    }
  }
  /**
   * パラメータに対するフェードアウトの時間の設定
   * @param parameterId     パラメータID
   * @param value           フェードアウトにかかる時間[秒]
   */
  setParameterFadeOutTime(parameterId, value) {
    const curves = this._motionData.curves;
    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves[i].id) {
        curves[i].fadeOutTime = value;
        return;
      }
    }
  }
  /**
   * パラメータに対するフェードインの時間の取得
   * @param    parameterId     パラメータID
   * @return   フェードインにかかる時間[秒]
   */
  getParameterFadeInTime(parameterId) {
    const curves = this._motionData.curves;
    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves[i].id) {
        return curves[i].fadeInTime;
      }
    }
    return -1;
  }
  /**
   * パラメータに対するフェードアウトの時間を取得
   *
   * @param   parameterId     パラメータID
   * @return   フェードアウトにかかる時間[秒]
   */
  getParameterFadeOutTime(parameterId) {
    const curves = this._motionData.curves;
    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves[i].id) {
        return curves[i].fadeOutTime;
      }
    }
    return -1;
  }
  /**
   * 自動エフェクトがかかっているパラメータIDリストの設定
   * @param eyeBlinkParameterIds    自動まばたきがかかっているパラメータIDのリスト
   * @param lipSyncParameterIds     リップシンクがかかっているパラメータIDのリスト
   */
  setEffectIds(eyeBlinkParameterIds, lipSyncParameterIds) {
    this._eyeBlinkParameterIds = eyeBlinkParameterIds;
    this._lipSyncParameterIds = lipSyncParameterIds;
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._motionData = void 0;
  }
  /**
   * motion3.jsonをパースする。
   *
   * @param motionJson  motion3.jsonが読み込まれているバッファ
   */
  parse(motionJson) {
    this._motionData = new CubismMotionData();
    const json = new CubismMotionJson(motionJson);
    this._motionData.duration = json.getMotionDuration();
    this._motionData.loop = json.isMotionLoop();
    this._motionData.curveCount = json.getMotionCurveCount();
    this._motionData.fps = json.getMotionFps();
    this._motionData.eventCount = json.getEventCount();
    const areBeziersRestructed = json.getEvaluationOptionFlag(
      EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted
    );
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
    this._motionData.curves = Array.from({
      length: this._motionData.curveCount
    }).map(() => new CubismMotionCurve());
    this._motionData.segments = Array.from({
      length: json.getMotionTotalSegmentCount()
    }).map(() => new CubismMotionSegment());
    this._motionData.events = Array.from({
      length: this._motionData.eventCount
    }).map(() => new CubismMotionEvent());
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
          CubismLogWarning(
            'Warning : Unable to get segment type from Curve! The number of "CurveCount" may be incorrect!'
          );
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
          this._motionData.points[totalPointCount] = new CubismMotionPoint(
            json.getMotionCurveSegment(curveCount, segmentPosition),
            json.getMotionCurveSegment(curveCount, segmentPosition + 1)
          );
          totalPointCount += 1;
          segmentPosition += 2;
        } else {
          this._motionData.segments[totalSegmentCount].basePointIndex = totalPointCount - 1;
        }
        const segment = json.getMotionCurveSegment(
          curveCount,
          segmentPosition
        );
        switch (segment) {
          case CubismMotionSegmentType.CubismMotionSegmentType_Linear: {
            this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Linear;
            this._motionData.segments[totalSegmentCount].evaluate = linearEvaluate;
            this._motionData.points[totalPointCount] = new CubismMotionPoint(
              json.getMotionCurveSegment(curveCount, segmentPosition + 1),
              json.getMotionCurveSegment(curveCount, segmentPosition + 2)
            );
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
            this._motionData.points[totalPointCount] = new CubismMotionPoint(
              json.getMotionCurveSegment(curveCount, segmentPosition + 1),
              json.getMotionCurveSegment(curveCount, segmentPosition + 2)
            );
            this._motionData.points[totalPointCount + 1] = new CubismMotionPoint(
              json.getMotionCurveSegment(curveCount, segmentPosition + 3),
              json.getMotionCurveSegment(curveCount, segmentPosition + 4)
            );
            this._motionData.points[totalPointCount + 2] = new CubismMotionPoint(
              json.getMotionCurveSegment(curveCount, segmentPosition + 5),
              json.getMotionCurveSegment(curveCount, segmentPosition + 6)
            );
            totalPointCount += 3;
            segmentPosition += 7;
            break;
          }
          case CubismMotionSegmentType.CubismMotionSegmentType_Stepped: {
            this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Stepped;
            this._motionData.segments[totalSegmentCount].evaluate = steppedEvaluate;
            this._motionData.points[totalPointCount] = new CubismMotionPoint(
              json.getMotionCurveSegment(curveCount, segmentPosition + 1),
              json.getMotionCurveSegment(curveCount, segmentPosition + 2)
            );
            totalPointCount += 1;
            segmentPosition += 3;
            break;
          }
          case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped: {
            this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped;
            this._motionData.segments[totalSegmentCount].evaluate = inverseSteppedEvaluate;
            this._motionData.points[totalPointCount] = new CubismMotionPoint(
              json.getMotionCurveSegment(curveCount, segmentPosition + 1),
              json.getMotionCurveSegment(curveCount, segmentPosition + 2)
            );
            totalPointCount += 1;
            segmentPosition += 3;
            break;
          }
          default: {
            CSM_ASSERT(0);
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
  /**
   * モデルのパラメータ更新
   *
   * イベント発火のチェック。
   * 入力する時間は呼ばれるモーションタイミングを０とした秒数で行う。
   *
   * @param beforeCheckTimeSeconds   前回のイベントチェック時間[秒]
   * @param motionTimeSeconds        今回の再生時間[秒]
   */
  getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
    this._firedEventValues.length = 0;
    for (let u = 0; u < this._motionData.eventCount; ++u) {
      if (this._motionData.events[u].fireTime > beforeCheckTimeSeconds && this._motionData.events[u].fireTime <= motionTimeSeconds) {
        this._firedEventValues.push(this._motionData.events[u].value);
      }
    }
    return this._firedEventValues;
  }
  /**
   * 透明度のカーブが存在するかどうかを確認する
   *
   * @returns true  -> キーが存在する
   *          false -> キーが存在しない
   */
  isExistModelOpacity() {
    for (let i = 0; i < this._motionData.curveCount; i++) {
      const curve = this._motionData.curves[i];
      if (curve.type != CubismMotionCurveTarget.CubismMotionCurveTarget_Model) {
        continue;
      }
      if (curve.id === IdNameOpacity) {
        return true;
      }
    }
    return false;
  }
  /**
   * 透明度のカーブのインデックスを返す
   *
   * @returns success:透明度のカーブのインデックス
   */
  getModelOpacityIndex() {
    if (this.isExistModelOpacity()) {
      for (let i = 0; i < this._motionData.curveCount; i++) {
        const curve = this._motionData.curves[i];
        if (curve.type != CubismMotionCurveTarget.CubismMotionCurveTarget_Model) {
          continue;
        }
        if (curve.id === IdNameOpacity) {
          return i;
        }
      }
    }
    return -1;
  }
  /**
   * 透明度のIdを返す
   *
   * @param index モーションカーブのインデックス
   * @returns success:透明度のカーブのインデックス
   */
  getModelOpacityId(index) {
    if (index != -1) {
      const curve = this._motionData.curves[index];
      if (curve.type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model) {
        if (curve.id === IdNameOpacity) {
          return curve.id;
        }
      }
    }
    return void 0;
  }
  /**
   * 現在時間の透明度の値を返す
   *
   * @returns success:モーションの当該時間におけるOpacityの値
   */
  getModelOpacityValue() {
    return this._modelOpacity;
  }
  // モーションから取得した不透明度
}
class CubismMotionQueueEntry {
  /**
   * コンストラクタ
   */
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
  /**
   * デストラクタ相当の処理
   */
  release() {
    if (this._autoDelete && this._motion) {
      this._motion.release();
    }
  }
  /**
   * フェードアウト時間と開始判定の設定
   * @param fadeOutSeconds フェードアウトにかかる時間[秒]
   */
  setFadeOut(fadeOutSeconds) {
    this._fadeOutSeconds = fadeOutSeconds;
    this._isTriggeredFadeOut = true;
  }
  /**
   * フェードアウトの開始
   * @param fadeOutSeconds フェードアウトにかかる時間[秒]
   * @param userTimeSeconds デルタ時間の積算値[秒]
   */
  startFadeOut(fadeOutSeconds, userTimeSeconds) {
    const newEndTimeSeconds = userTimeSeconds + fadeOutSeconds;
    this._isTriggeredFadeOut = true;
    if (this._endTimeSeconds < 0 || newEndTimeSeconds < this._endTimeSeconds) {
      this._endTimeSeconds = newEndTimeSeconds;
    }
  }
  /**
   * モーションの終了の確認
   *
   * @return true モーションが終了した
   * @return false 終了していない
   */
  isFinished() {
    return this._finished;
  }
  /**
   * モーションの開始の確認
   * @return true モーションが開始した
   * @return false 開始していない
   */
  isStarted() {
    return this._started;
  }
  /**
   * モーションの開始時刻の取得
   * @return モーションの開始時刻[秒]
   */
  getStartTime() {
    return this._startTimeSeconds;
  }
  /**
   * フェードインの開始時刻の取得
   * @return フェードインの開始時刻[秒]
   */
  getFadeInStartTime() {
    return this._fadeInStartTimeSeconds;
  }
  /**
   * フェードインの終了時刻の取得
   * @return フェードインの終了時刻の取得
   */
  getEndTime() {
    return this._endTimeSeconds;
  }
  /**
   * モーションの開始時刻の設定
   * @param startTime モーションの開始時刻
   */
  setStartTime(startTime) {
    this._startTimeSeconds = startTime;
  }
  /**
   * フェードインの開始時刻の設定
   * @param startTime フェードインの開始時刻[秒]
   */
  setFadeInStartTime(startTime) {
    this._fadeInStartTimeSeconds = startTime;
  }
  /**
   * フェードインの終了時刻の設定
   * @param endTime フェードインの終了時刻[秒]
   */
  setEndTime(endTime) {
    this._endTimeSeconds = endTime;
  }
  /**
   * モーションの終了の設定
   * @param f trueならモーションの終了
   */
  setIsFinished(f) {
    this._finished = f;
  }
  /**
   * モーション開始の設定
   * @param f trueならモーションの開始
   */
  setIsStarted(f) {
    this._started = f;
  }
  /**
   * モーションの有効性の確認
   * @return true モーションは有効
   * @return false モーションは無効
   */
  isAvailable() {
    return this._available;
  }
  /**
   * モーションの有効性の設定
   * @param v trueならモーションは有効
   */
  setIsAvailable(v) {
    this._available = v;
  }
  /**
   * モーションの状態の設定
   * @param timeSeconds 現在時刻[秒]
   * @param weight モーション尾重み
   */
  setState(timeSeconds, weight) {
    this._stateTimeSeconds = timeSeconds;
    this._stateWeight = weight;
  }
  /**
   * モーションの現在時刻の取得
   * @return モーションの現在時刻[秒]
   */
  getStateTime() {
    return this._stateTimeSeconds;
  }
  /**
   * モーションの重みの取得
   * @return モーションの重み
   */
  getStateWeight() {
    return this._stateWeight;
  }
  /**
   * 最後にイベントの発火をチェックした時間を取得
   *
   * @return 最後にイベントの発火をチェックした時間[秒]
   */
  getLastCheckEventSeconds() {
    return this._lastEventCheckSeconds;
  }
  /**
   * 最後にイベントをチェックした時間を設定
   * @param checkSeconds 最後にイベントをチェックした時間[秒]
   */
  setLastCheckEventSeconds(checkSeconds) {
    this._lastEventCheckSeconds = checkSeconds;
  }
  /**
   * フェードアウト開始判定の取得
   * @return フェードアウト開始するかどうか
   */
  isTriggeredFadeOut() {
    return this._isTriggeredFadeOut;
  }
  /**
   * フェードアウト時間の取得
   * @return フェードアウト時間[秒]
   */
  getFadeOutSeconds() {
    return this._fadeOutSeconds;
  }
  // インスタンスごとに一意の値を持つ識別番号
}
class CubismMotionQueueManager {
  /**
   * コンストラクタ
   */
  constructor() {
    this._userTimeSeconds = 0;
    this._eventCustomData = null;
    this._motions = [];
  }
  /**
   * デストラクタ
   */
  release() {
    for (let i = 0; i < this._motions.length; ++i) {
      if (this._motions[i]) {
        this._motions[i].release();
      }
    }
    this._motions = void 0;
  }
  /**
   * 指定したモーションの開始
   *
   * 指定したモーションを開始する。同じタイプのモーションが既にある場合は、既存のモーションに終了フラグを立て、フェードアウトを開始させる。
   *
   * @param   motion          開始するモーション
   * @param   autoDelete      再生が終了したモーションのインスタンスを削除するなら true
   * @param   userTimeSeconds デルタ時間の積算値[秒]
   * @return                      開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するIsFinished()の引数で使用する。開始できない時は「-1」
   */
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
  /**
   * 全てのモーションの終了の確認
   * @return true 全て終了している
   * @return false 終了していない
   */
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
  /**
   * 指定したモーションの終了の確認
   * @param motionQueueEntryNumber モーションの識別番号
   * @return true 全て終了している
   * @return false 終了していない
   */
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
  /**
   * 全てのモーションを停止する
   */
  stopAllMotions() {
    for (let i = 0; i < this._motions.length; i++) {
      const motionQueueEntry = this._motions[i];
      if (motionQueueEntry != null) {
        motionQueueEntry.release();
      }
    }
    this._motions = [];
  }
  /**
     * 指定したCubismMotionQueueEntryの取得
  
     * @param   motionQueueEntryNumber  モーションの識別番号
     * @return  指定したCubismMotionQueueEntry
     * @return  null   見つからなかった
     */
  getCubismMotionQueueEntry(motionQueueEntryNumber) {
    return this._motions.find(
      (entry) => entry != null && entry._motionQueueEntryHandle == motionQueueEntryNumber
    );
  }
  /**
   * イベントを受け取るCallbackの登録
   *
   * @param callback コールバック関数
   * @param customData コールバックに返されるデータ
   */
  setEventCallback(callback, customData = null) {
    this._eventCallBack = callback;
    this._eventCustomData = customData;
  }
  /**
   * モーションを更新して、モデルにパラメータ値を反映する。
   *
   * @param   model   対象のモデル
   * @param   userTimeSeconds   デルタ時間の積算値[秒]
   * @return  true    モデルへパラメータ値の反映あり
   * @return  false   モデルへパラメータ値の反映なし(モーションの変化なし)
   */
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
      const firedList = motion.getFiredEvent(
        motionQueueEntry.getLastCheckEventSeconds() - motionQueueEntry.getStartTime(),
        userTimeSeconds - motionQueueEntry.getStartTime()
      );
      for (let i2 = 0; i2 < firedList.length; ++i2) {
        this._eventCallBack(this, firedList[i2], this._eventCustomData);
      }
      motionQueueEntry.setLastCheckEventSeconds(userTimeSeconds);
      if (motionQueueEntry.isFinished()) {
        motionQueueEntry.release();
        this._motions.splice(i, 1);
      } else {
        if (motionQueueEntry.isTriggeredFadeOut()) {
          motionQueueEntry.startFadeOut(
            motionQueueEntry.getFadeOutSeconds(),
            userTimeSeconds
          );
        }
        i++;
      }
    }
    return updated;
  }
  // コールバックに戻されるデータ
}
const InvalidMotionQueueEntryHandleValue = -1;
class CubismMotionManager extends CubismMotionQueueManager {
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this._currentPriority = 0;
    this._reservePriority = 0;
  }
  /**
   * 再生中のモーションの優先度の取得
   * @return  モーションの優先度
   */
  getCurrentPriority() {
    return this._currentPriority;
  }
  /**
   * 予約中のモーションの優先度を取得する。
   * @return  モーションの優先度
   */
  getReservePriority() {
    return this._reservePriority;
  }
  /**
   * 予約中のモーションの優先度を設定する。
   * @param   val     優先度
   */
  setReservePriority(val) {
    this._reservePriority = val;
  }
  /**
   * 優先度を設定してモーションを開始する。
   *
   * @param motion          モーション
   * @param autoDelete      再生が狩猟したモーションのインスタンスを削除するならtrue
   * @param priority        優先度
   * @return                開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するIsFinished()の引数で使用する。開始できない時は「-1」
   */
  startMotionPriority(motion, autoDelete, priority) {
    if (priority == this._reservePriority) {
      this._reservePriority = 0;
    }
    this._currentPriority = priority;
    return super.startMotion(motion, autoDelete, this._userTimeSeconds);
  }
  /**
   * モーションを更新して、モデルにパラメータ値を反映する。
   *
   * @param model   対象のモデル
   * @param deltaTimeSeconds    デルタ時間[秒]
   * @return  true    更新されている
   * @return  false   更新されていない
   */
  updateMotion(model, deltaTimeSeconds) {
    this._userTimeSeconds += deltaTimeSeconds;
    const updated = super.doUpdateMotion(model, this._userTimeSeconds);
    if (this.isFinished()) {
      this._currentPriority = 0;
    }
    return updated;
  }
  /**
   * モーションを予約する。
   *
   * @param   priority    優先度
   * @return  true    予約できた
   * @return  false   予約できなかった
   */
  reserveMotion(priority) {
    if (priority <= this._reservePriority || priority <= this._currentPriority) {
      return false;
    }
    this._reservePriority = priority;
    return true;
  }
  // 再生予定のモーションの優先度。再生中は0になる。モーションファイルを別スレッドで読み込むときの機能。
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
  // 風
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
  // 現在の速度
}
class CubismPhysicsSubRig {
  constructor() {
    this.normalizationPosition = {};
    this.normalizationAngle = {};
  }
  // 正規化された角度
}
class CubismPhysicsInput {
  constructor() {
    this.source = {};
  }
  // 正規化されたパラメータ値の取得関数
}
class CubismPhysicsOutput {
  constructor() {
    this.destination = {};
    this.translationScale = new CubismVector2(0, 0);
  }
  // 物理演算のスケール値の取得関数
}
class CubismPhysicsRig {
  constructor() {
    this.settings = [];
    this.inputs = [];
    this.outputs = [];
    this.particles = [];
    this.gravity = new CubismVector2(0, 0);
    this.wind = new CubismVector2(0, 0);
    this.fps = 0;
  }
  //物理演算動作FPS
}
class CubismPhysicsJson {
  /**
   * コンストラクタ
   * @param json physics3.jsonが読み込まれているバッファ
   */
  constructor(json) {
    this._json = json;
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._json = void 0;
  }
  /**
   * 重力の取得
   * @return 重力
   */
  getGravity() {
    const ret = new CubismVector2(0, 0);
    ret.x = this._json.Meta.EffectiveForces.Gravity.X;
    ret.y = this._json.Meta.EffectiveForces.Gravity.Y;
    return ret;
  }
  /**
   * 風の取得
   * @return 風
   */
  getWind() {
    const ret = new CubismVector2(0, 0);
    ret.x = this._json.Meta.EffectiveForces.Wind.X;
    ret.y = this._json.Meta.EffectiveForces.Wind.Y;
    return ret;
  }
  /**
   * 物理演算設定FPSの取得
   * @return 物理演算設定FPS
   */
  getFps() {
    return this._json.Meta.Fps || 0;
  }
  /**
   * 物理店の管理の個数の取得
   * @return 物理店の管理の個数
   */
  getSubRigCount() {
    return this._json.Meta.PhysicsSettingCount;
  }
  /**
   * 入力の総合計の取得
   * @return 入力の総合計
   */
  getTotalInputCount() {
    return this._json.Meta.TotalInputCount;
  }
  /**
   * 出力の総合計の取得
   * @return 出力の総合計
   */
  getTotalOutputCount() {
    return this._json.Meta.TotalOutputCount;
  }
  /**
   * 物理点の個数の取得
   * @return 物理点の個数
   */
  getVertexCount() {
    return this._json.Meta.VertexCount;
  }
  /**
   * 正規化された位置の最小値の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @return 正規化された位置の最小値
   */
  getNormalizationPositionMinimumValue(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Position.Minimum;
  }
  /**
   * 正規化された位置の最大値の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @return 正規化された位置の最大値
   */
  getNormalizationPositionMaximumValue(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Position.Maximum;
  }
  /**
   * 正規化された位置のデフォルト値の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @return 正規化された位置のデフォルト値
   */
  getNormalizationPositionDefaultValue(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Position.Default;
  }
  /**
   * 正規化された角度の最小値の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @return 正規化された角度の最小値
   */
  getNormalizationAngleMinimumValue(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Angle.Minimum;
  }
  /**
   * 正規化された角度の最大値の取得
   * @param physicsSettingIndex
   * @return 正規化された角度の最大値
   */
  getNormalizationAngleMaximumValue(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Angle.Maximum;
  }
  /**
   * 正規化された角度のデフォルト値の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @return 正規化された角度のデフォルト値
   */
  getNormalizationAngleDefaultValue(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Normalization.Angle.Default;
  }
  /**
   * 入力の個数の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @return 入力の個数
   */
  getInputCount(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Input.length;
  }
  /**
   * 入力の重みの取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param inputIndex 入力のインデックス
   * @return 入力の重み
   */
  getInputWeight(physicsSettingIndex, inputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Weight;
  }
  /**
   * 入力の反転の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param inputIndex 入力のインデックス
   * @return 入力の反転
   */
  getInputReflect(physicsSettingIndex, inputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Reflect;
  }
  /**
   * 入力の種類の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param inputIndex 入力のインデックス
   * @return 入力の種類
   */
  getInputType(physicsSettingIndex, inputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Type;
  }
  /**
   * 入力元のIDの取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param inputIndex 入力のインデックス
   * @return 入力元のID
   */
  getInputSourceId(physicsSettingIndex, inputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Input[inputIndex].Source.Id;
  }
  /**
   * 出力の個数の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @return 出力の個数
   */
  getOutputCount(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Output.length;
  }
  /**
   * 出力の物理点のインデックスの取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param outputIndex 出力のインデックス
   * @return 出力の物理点のインデックス
   */
  getOutputVertexIndex(physicsSettingIndex, outputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].VertexIndex;
  }
  /**
   * 出力の角度のスケールを取得する
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param outputIndex 出力のインデックス
   * @return 出力の角度のスケール
   */
  getOutputAngleScale(physicsSettingIndex, outputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Scale;
  }
  /**
   * 出力の重みの取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param outputIndex 出力のインデックス
   * @return 出力の重み
   */
  getOutputWeight(physicsSettingIndex, outputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Weight;
  }
  /**
   * 出力先のIDの取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param outputIndex 出力のインデックス
   * @return 出力先のID
   */
  getOutputDestinationId(physicsSettingIndex, outputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Destination.Id;
  }
  /**
   * 出力の種類の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param outputIndex 出力のインデックス
   * @return 出力の種類
   */
  getOutputType(physicsSettingIndex, outputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Type;
  }
  /**
   * 出力の反転の取得
   * @param physicsSettingIndex 物理演算のインデックス
   * @param outputIndex 出力のインデックス
   * @return 出力の反転
   */
  getOutputReflect(physicsSettingIndex, outputIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Output[outputIndex].Reflect;
  }
  /**
   * 物理点の個数の取得
   * @param physicsSettingIndex 物理演算男設定のインデックス
   * @return 物理点の個数
   */
  getParticleCount(physicsSettingIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Vertices.length;
  }
  /**
   * 物理点の動きやすさの取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param vertexIndex 物理点のインデックス
   * @return 物理点の動きやすさ
   */
  getParticleMobility(physicsSettingIndex, vertexIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Mobility;
  }
  /**
   * 物理点の遅れの取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param vertexIndex 物理点のインデックス
   * @return 物理点の遅れ
   */
  getParticleDelay(physicsSettingIndex, vertexIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Delay;
  }
  /**
   * 物理点の加速度の取得
   * @param physicsSettingIndex 物理演算の設定
   * @param vertexIndex 物理点のインデックス
   * @return 物理点の加速度
   */
  getParticleAcceleration(physicsSettingIndex, vertexIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Acceleration;
  }
  /**
   * 物理点の距離の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param vertexIndex 物理点のインデックス
   * @return 物理点の距離
   */
  getParticleRadius(physicsSettingIndex, vertexIndex) {
    return this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Radius;
  }
  /**
   * 物理点の位置の取得
   * @param physicsSettingIndex 物理演算の設定のインデックス
   * @param vertexIndex 物理点のインデックス
   * @return 物理点の位置
   */
  getParticlePosition(physicsSettingIndex, vertexIndex) {
    const ret = new CubismVector2(0, 0);
    ret.x = this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Position.X;
    ret.y = this._json.PhysicsSettings[physicsSettingIndex].Vertices[vertexIndex].Position.Y;
    return ret;
  }
  // physics3.jsonデータ
}
const PhysicsTypeTagX = "X";
const PhysicsTypeTagY = "Y";
const PhysicsTypeTagAngle = "Angle";
const AirResistance = 5;
const MaximumWeight = 100;
const MovementThreshold = 1e-3;
const MaxDeltaTime = 5;
class CubismPhysics {
  /**
   * インスタンスの作成
   * @param json    physics3.jsonが読み込まれているバッファ
   * @return 作成されたインスタンス
   */
  static create(json) {
    const ret = new CubismPhysics();
    ret.parse(json);
    ret._physicsRig.gravity.y = 0;
    return ret;
  }
  /**
   * インスタンスを破棄する
   * @param physics 破棄するインスタンス
   */
  static delete(physics) {
    if (physics != null) {
      physics.release();
    }
  }
  /**
   * physics3.jsonをパースする。
   * @param physicsJson physics3.jsonが読み込まれているバッファ
   */
  parse(physicsJson) {
    this._physicsRig = new CubismPhysicsRig();
    const json = new CubismPhysicsJson(physicsJson);
    this._physicsRig.gravity = json.getGravity();
    this._physicsRig.wind = json.getWind();
    this._physicsRig.subRigCount = json.getSubRigCount();
    this._physicsRig.fps = json.getFps();
    this._currentRigOutputs = [];
    this._previousRigOutputs = [];
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
      const currentRigOutput = new PhysicsOutput();
      const previousRigOutput = new PhysicsOutput();
      for (let j = 0; j < setting.outputCount; ++j) {
        currentRigOutput.outputs[j] = 0;
        previousRigOutput.outputs[j] = 0;
        let output = this._physicsRig.outputs[outputIndex + j];
        if (!output) {
          output = new CubismPhysicsOutput();
          this._physicsRig.outputs[outputIndex + j] = output;
        }
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
      }
      this._currentRigOutputs.push(currentRigOutput);
      this._previousRigOutputs.push(previousRigOutput);
      outputIndex += setting.outputCount;
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
  /**
   * 現在のパラメータ値で物理演算が安定化する状態を演算する。
   * @param model 物理演算の結果を適用するモデル
   */
  stabilization(model) {
    var _a, _b, _c, _d;
    let totalAngle;
    let weight;
    let radAngle;
    let outputValue;
    const totalTranslation = new CubismVector2();
    let currentSetting;
    let currentInputs;
    let currentOutputs;
    let currentParticles;
    let parameterValues;
    let parameterMaximumValues;
    let parameterMinimumValues;
    let parameterDefaultValues;
    parameterValues = model.getModel().parameters.values;
    parameterMaximumValues = model.getModel().parameters.maximumValues;
    parameterMinimumValues = model.getModel().parameters.minimumValues;
    parameterDefaultValues = model.getModel().parameters.defaultValues;
    if (((_b = (_a = this._parameterCaches) == null ? void 0 : _a.length) != null ? _b : 0) < model.getParameterCount()) {
      this._parameterCaches = new Float32Array(model.getParameterCount());
    }
    if (((_d = (_c = this._parameterInputCaches) == null ? void 0 : _c.length) != null ? _d : 0) < model.getParameterCount()) {
      this._parameterInputCaches = new Float32Array(model.getParameterCount());
    }
    for (let j = 0; j < model.getParameterCount(); ++j) {
      this._parameterCaches[j] = parameterValues[j];
      this._parameterInputCaches[j] = parameterValues[j];
    }
    for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
      totalAngle = { angle: 0 };
      totalTranslation.x = 0;
      totalTranslation.y = 0;
      currentSetting = this._physicsRig.settings[settingIndex];
      currentInputs = this._physicsRig.inputs.slice(
        currentSetting.baseInputIndex
      );
      currentOutputs = this._physicsRig.outputs.slice(
        currentSetting.baseOutputIndex
      );
      currentParticles = this._physicsRig.particles.slice(
        currentSetting.baseParticleIndex
      );
      for (let i = 0; i < currentSetting.inputCount; ++i) {
        weight = currentInputs[i].weight / MaximumWeight;
        if (currentInputs[i].sourceParameterIndex == -1) {
          currentInputs[i].sourceParameterIndex = model.getParameterIndex(
            currentInputs[i].source.id
          );
        }
        currentInputs[i].getNormalizedParameterValue(
          totalTranslation,
          totalAngle,
          parameterValues[currentInputs[i].sourceParameterIndex],
          parameterMinimumValues[currentInputs[i].sourceParameterIndex],
          parameterMaximumValues[currentInputs[i].sourceParameterIndex],
          parameterDefaultValues[currentInputs[i].sourceParameterIndex],
          currentSetting.normalizationPosition,
          currentSetting.normalizationAngle,
          currentInputs[i].reflect,
          weight
        );
        this._parameterCaches[currentInputs[i].sourceParameterIndex] = parameterValues[currentInputs[i].sourceParameterIndex];
      }
      radAngle = CubismMath.degreesToRadian(-totalAngle.angle);
      totalTranslation.x = totalTranslation.x * CubismMath.cos(radAngle) - totalTranslation.y * CubismMath.sin(radAngle);
      totalTranslation.y = totalTranslation.x * CubismMath.sin(radAngle) + totalTranslation.y * CubismMath.cos(radAngle);
      updateParticlesForStabilization(
        currentParticles,
        currentSetting.particleCount,
        totalTranslation,
        totalAngle.angle,
        this._options.wind,
        MovementThreshold * currentSetting.normalizationPosition.maximum
      );
      for (let i = 0; i < currentSetting.outputCount; ++i) {
        const particleIndex = currentOutputs[i].vertexIndex;
        if (currentOutputs[i].destinationParameterIndex == -1) {
          currentOutputs[i].destinationParameterIndex = model.getParameterIndex(
            currentOutputs[i].destination.id
          );
        }
        if (particleIndex < 1 || particleIndex >= currentSetting.particleCount) {
          continue;
        }
        let translation = new CubismVector2();
        translation = currentParticles[particleIndex].position.substract(
          currentParticles[particleIndex - 1].position
        );
        outputValue = currentOutputs[i].getValue(
          translation,
          currentParticles,
          particleIndex,
          currentOutputs[i].reflect,
          this._options.gravity
        );
        this._currentRigOutputs[settingIndex].outputs[i] = outputValue;
        this._previousRigOutputs[settingIndex].outputs[i] = outputValue;
        const destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
        const outParameterCaches = !Float32Array.prototype.slice && "subarray" in Float32Array.prototype ? JSON.parse(
          JSON.stringify(
            parameterValues.subarray(destinationParameterIndex)
          )
        ) : parameterValues.slice(destinationParameterIndex);
        updateOutputParameterValue(
          outParameterCaches,
          parameterMinimumValues[destinationParameterIndex],
          parameterMaximumValues[destinationParameterIndex],
          outputValue,
          currentOutputs[i]
        );
        for (let offset = destinationParameterIndex, outParamIndex = 0; offset < this._parameterCaches.length; offset++, outParamIndex++) {
          parameterValues[offset] = this._parameterCaches[offset] = outParameterCaches[outParamIndex];
        }
      }
    }
  }
  /**
   * 物理演算の評価
   *
   * Pendulum interpolation weights
   *
   * 振り子の計算結果は保存され、パラメータへの出力は保存された前回の結果で補間されます。
   * The result of the pendulum calculation is saved and
   * the output to the parameters is interpolated with the saved previous result of the pendulum calculation.
   *
   * 図で示すと[1]と[2]で補間されます。
   * The figure shows the interpolation between [1] and [2].
   *
   * 補間の重みは最新の振り子計算タイミングと次回のタイミングの間で見た現在時間で決定する。
   * The weight of the interpolation are determined by the current time seen between
   * the latest pendulum calculation timing and the next timing.
   *
   * 図で示すと[2]と[4]の間でみた(3)の位置の重みになる。
   * Figure shows the weight of position (3) as seen between [2] and [4].
   *
   * 解釈として振り子計算のタイミングと重み計算のタイミングがズレる。
   * As an interpretation, the pendulum calculation and weights are misaligned.
   *
   * physics3.jsonにFPS情報が存在しない場合は常に前の振り子状態で設定される。
   * If there is no FPS information in physics3.json, it is always set in the previous pendulum state.
   *
   * この仕様は補間範囲を逸脱したことが原因の震えたような見た目を回避を目的にしている。
   * The purpose of this specification is to avoid the quivering appearance caused by deviations from the interpolation range.
   *
   * ------------ time -------------->
   *
   *                 |+++++|------| <- weight
   * ==[1]====#=====[2]---(3)----(4)
   *          ^ output contents
   *
   * 1:_previousRigOutputs
   * 2:_currentRigOutputs
   * 3:_currentRemainTime (now rendering)
   * 4:next particles timing
   * @param model 物理演算の結果を適用するモデル
   * @param deltaTimeSeconds デルタ時間[秒]
   */
  evaluate(model, deltaTimeSeconds) {
    var _a, _b, _c, _d;
    let totalAngle;
    let weight;
    let radAngle;
    let outputValue;
    const totalTranslation = new CubismVector2();
    let currentSetting;
    let currentInputs;
    let currentOutputs;
    let currentParticles;
    if (0 >= deltaTimeSeconds) {
      return;
    }
    let parameterValues;
    let parameterMaximumValues;
    let parameterMinimumValues;
    let parameterDefaultValues;
    let physicsDeltaTime;
    this._currentRemainTime += deltaTimeSeconds;
    if (this._currentRemainTime > MaxDeltaTime) {
      this._currentRemainTime = 0;
    }
    parameterValues = model.getModel().parameters.values;
    parameterMaximumValues = model.getModel().parameters.maximumValues;
    parameterMinimumValues = model.getModel().parameters.minimumValues;
    parameterDefaultValues = model.getModel().parameters.defaultValues;
    if (((_b = (_a = this._parameterCaches) == null ? void 0 : _a.length) != null ? _b : 0) < model.getParameterCount()) {
      this._parameterCaches = new Float32Array(model.getParameterCount());
    }
    if (((_d = (_c = this._parameterInputCaches) == null ? void 0 : _c.length) != null ? _d : 0) < model.getParameterCount()) {
      this._parameterInputCaches = new Float32Array(model.getParameterCount());
      for (let j = 0; j < model.getParameterCount(); ++j) {
        this._parameterInputCaches[j] = parameterValues[j];
      }
    }
    if (this._physicsRig.fps > 0) {
      physicsDeltaTime = 1 / this._physicsRig.fps;
    } else {
      physicsDeltaTime = deltaTimeSeconds;
    }
    while (this._currentRemainTime >= physicsDeltaTime) {
      for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
        currentSetting = this._physicsRig.settings[settingIndex];
        currentOutputs = this._physicsRig.outputs.slice(
          currentSetting.baseOutputIndex
        );
        for (let i = 0; i < currentSetting.outputCount; ++i) {
          this._previousRigOutputs[settingIndex].outputs[i] = this._currentRigOutputs[settingIndex].outputs[i];
        }
      }
      const inputWeight = physicsDeltaTime / this._currentRemainTime;
      for (let j = 0; j < model.getParameterCount(); ++j) {
        this._parameterCaches[j] = this._parameterInputCaches[j] * (1 - inputWeight) + parameterValues[j] * inputWeight;
        this._parameterInputCaches[j] = this._parameterCaches[j];
      }
      for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
        totalAngle = { angle: 0 };
        totalTranslation.x = 0;
        totalTranslation.y = 0;
        currentSetting = this._physicsRig.settings[settingIndex];
        currentInputs = this._physicsRig.inputs.slice(
          currentSetting.baseInputIndex
        );
        currentOutputs = this._physicsRig.outputs.slice(
          currentSetting.baseOutputIndex
        );
        currentParticles = this._physicsRig.particles.slice(
          currentSetting.baseParticleIndex
        );
        for (let i = 0; i < currentSetting.inputCount; ++i) {
          weight = currentInputs[i].weight / MaximumWeight;
          if (currentInputs[i].sourceParameterIndex == -1) {
            currentInputs[i].sourceParameterIndex = model.getParameterIndex(
              currentInputs[i].source.id
            );
          }
          currentInputs[i].getNormalizedParameterValue(
            totalTranslation,
            totalAngle,
            this._parameterCaches[currentInputs[i].sourceParameterIndex],
            parameterMinimumValues[currentInputs[i].sourceParameterIndex],
            parameterMaximumValues[currentInputs[i].sourceParameterIndex],
            parameterDefaultValues[currentInputs[i].sourceParameterIndex],
            currentSetting.normalizationPosition,
            currentSetting.normalizationAngle,
            currentInputs[i].reflect,
            weight
          );
        }
        radAngle = CubismMath.degreesToRadian(-totalAngle.angle);
        totalTranslation.x = totalTranslation.x * CubismMath.cos(radAngle) - totalTranslation.y * CubismMath.sin(radAngle);
        totalTranslation.y = totalTranslation.x * CubismMath.sin(radAngle) + totalTranslation.y * CubismMath.cos(radAngle);
        updateParticles(
          currentParticles,
          currentSetting.particleCount,
          totalTranslation,
          totalAngle.angle,
          this._options.wind,
          MovementThreshold * currentSetting.normalizationPosition.maximum,
          physicsDeltaTime,
          AirResistance
        );
        for (let i = 0; i < currentSetting.outputCount; ++i) {
          const particleIndex = currentOutputs[i].vertexIndex;
          if (currentOutputs[i].destinationParameterIndex == -1) {
            currentOutputs[i].destinationParameterIndex = model.getParameterIndex(currentOutputs[i].destination.id);
          }
          if (particleIndex < 1 || particleIndex >= currentSetting.particleCount) {
            continue;
          }
          const translation = new CubismVector2();
          translation.x = currentParticles[particleIndex].position.x - currentParticles[particleIndex - 1].position.x;
          translation.y = currentParticles[particleIndex].position.y - currentParticles[particleIndex - 1].position.y;
          outputValue = currentOutputs[i].getValue(
            translation,
            currentParticles,
            particleIndex,
            currentOutputs[i].reflect,
            this._options.gravity
          );
          this._currentRigOutputs[settingIndex].outputs[i] = outputValue;
          const destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
          const outParameterCaches = !Float32Array.prototype.slice && "subarray" in Float32Array.prototype ? JSON.parse(
            JSON.stringify(
              this._parameterCaches.subarray(destinationParameterIndex)
            )
          ) : this._parameterCaches.slice(destinationParameterIndex);
          updateOutputParameterValue(
            outParameterCaches,
            parameterMinimumValues[destinationParameterIndex],
            parameterMaximumValues[destinationParameterIndex],
            outputValue,
            currentOutputs[i]
          );
          for (let offset = destinationParameterIndex, outParamIndex = 0; offset < this._parameterCaches.length; offset++, outParamIndex++) {
            this._parameterCaches[offset] = outParameterCaches[outParamIndex];
          }
        }
      }
      this._currentRemainTime -= physicsDeltaTime;
    }
    const alpha = this._currentRemainTime / physicsDeltaTime;
    this.interpolate(model, alpha);
  }
  /**
   * 物理演算結果の適用
   * 振り子演算の最新の結果と一つ前の結果から指定した重みで適用する。
   * @param model 物理演算の結果を適用するモデル
   * @param weight 最新結果の重み
   */
  interpolate(model, weight) {
    let currentOutputs;
    let currentSetting;
    let parameterValues;
    let parameterMaximumValues;
    let parameterMinimumValues;
    parameterValues = model.getModel().parameters.values;
    parameterMaximumValues = model.getModel().parameters.maximumValues;
    parameterMinimumValues = model.getModel().parameters.minimumValues;
    for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
      currentSetting = this._physicsRig.settings[settingIndex];
      currentOutputs = this._physicsRig.outputs.slice(
        currentSetting.baseOutputIndex
      );
      for (let i = 0; i < currentSetting.outputCount; ++i) {
        if (currentOutputs[i].destinationParameterIndex == -1) {
          continue;
        }
        const destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
        const outParameterValues = !Float32Array.prototype.slice && "subarray" in Float32Array.prototype ? JSON.parse(
          JSON.stringify(
            parameterValues.subarray(destinationParameterIndex)
          )
        ) : parameterValues.slice(destinationParameterIndex);
        updateOutputParameterValue(
          outParameterValues,
          parameterMinimumValues[destinationParameterIndex],
          parameterMaximumValues[destinationParameterIndex],
          this._previousRigOutputs[settingIndex].outputs[i] * (1 - weight) + this._currentRigOutputs[settingIndex].outputs[i] * weight,
          currentOutputs[i]
        );
        for (let offset = destinationParameterIndex, outParamIndex = 0; offset < parameterValues.length; offset++, outParamIndex++) {
          parameterValues[offset] = outParameterValues[outParamIndex];
        }
      }
    }
  }
  /**
   * オプションの設定
   * @param options オプション
   */
  setOptions(options) {
    this._options = options;
  }
  /**
   * オプションの取得
   * @return オプション
   */
  getOption() {
    return this._options;
  }
  /**
   * コンストラクタ
   */
  constructor() {
    this._options = new Options();
    this._options.gravity.y = -1;
    this._options.gravity.x = 0;
    this._options.wind.x = 0;
    this._options.wind.y = 0;
    this._currentRigOutputs = [];
    this._previousRigOutputs = [];
    this._currentRemainTime = 0;
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this._physicsRig = void 0;
  }
  /**
   * 初期化する
   */
  initialize() {
    let strand;
    let currentSetting;
    let radius;
    for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
      currentSetting = this._physicsRig.settings[settingIndex];
      strand = this._physicsRig.particles.slice(
        currentSetting.baseParticleIndex
      );
      strand[0].initialPosition = new CubismVector2(0, 0);
      strand[0].lastPosition = new CubismVector2(
        strand[0].initialPosition.x,
        strand[0].initialPosition.y
      );
      strand[0].lastGravity = new CubismVector2(0, -1);
      strand[0].lastGravity.y *= -1;
      strand[0].velocity = new CubismVector2(0, 0);
      strand[0].force = new CubismVector2(0, 0);
      for (let i = 1; i < currentSetting.particleCount; ++i) {
        radius = new CubismVector2(0, 0);
        radius.y = strand[i].radius;
        strand[i].initialPosition = new CubismVector2(
          strand[i - 1].initialPosition.x + radius.x,
          strand[i - 1].initialPosition.y + radius.y
        );
        strand[i].position = new CubismVector2(
          strand[i].initialPosition.x,
          strand[i].initialPosition.y
        );
        strand[i].lastPosition = new CubismVector2(
          strand[i].initialPosition.x,
          strand[i].initialPosition.y
        );
        strand[i].lastGravity = new CubismVector2(0, -1);
        strand[i].lastGravity.y *= -1;
        strand[i].velocity = new CubismVector2(0, 0);
        strand[i].force = new CubismVector2(0, 0);
      }
    }
  }
  ///< UpdateParticlesが動くときの入力をキャッシュ
}
class Options {
  constructor() {
    this.gravity = new CubismVector2(0, 0);
    this.wind = new CubismVector2(0, 0);
  }
  // 風の方向
}
class PhysicsOutput {
  constructor() {
    this.outputs = [];
  }
  // 物理演算出力結果
}
function getInputTranslationXFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
  targetTranslation.x += normalizeParameterValue(
    value,
    parameterMinimumValue,
    parameterMaximumValue,
    parameterDefaultValue,
    normalizationPosition.minimum,
    normalizationPosition.maximum,
    normalizationPosition.defalut,
    isInverted
  ) * weight;
}
function getInputTranslationYFromNormalizedParamterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
  targetTranslation.y += normalizeParameterValue(
    value,
    parameterMinimumValue,
    parameterMaximumValue,
    parameterDefaultValue,
    normalizationPosition.minimum,
    normalizationPosition.maximum,
    normalizationPosition.defalut,
    isInverted
  ) * weight;
}
function getInputAngleFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizaitionPosition, normalizationAngle, isInverted, weight) {
  targetAngle.angle += normalizeParameterValue(
    value,
    parameterMinimumValue,
    parameterMaximumValue,
    parameterDefaultValue,
    normalizationAngle.minimum,
    normalizationAngle.maximum,
    normalizationAngle.defalut,
    isInverted
  ) * weight;
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
    parentGravity = particles[particleIndex - 1].position.substract(
      particles[particleIndex - 2].position
    );
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
  strand[0].position = new CubismVector2(
    totalTranslation.x,
    totalTranslation.y
  );
  totalRadian = CubismMath.degreesToRadian(totalAngle);
  currentGravity = CubismMath.radianToDirection(totalRadian);
  currentGravity.normalize();
  for (let i = 1; i < strandCount; ++i) {
    strand[i].force = currentGravity.multiplyByScaler(strand[i].acceleration).add(windDirection);
    strand[i].lastPosition = new CubismVector2(
      strand[i].position.x,
      strand[i].position.y
    );
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
    strand[i].position = strand[i - 1].position.add(
      newDirection.multiplyByScaler(strand[i].radius)
    );
    if (CubismMath.abs(strand[i].position.x) < thresholdValue) {
      strand[i].position.x = 0;
    }
    if (delay != 0) {
      strand[i].velocity = strand[i].position.substract(strand[i].lastPosition);
      strand[i].velocity = strand[i].velocity.divisionByScalar(delay);
      strand[i].velocity = strand[i].velocity.multiplyByScaler(
        strand[i].mobility
      );
    }
    strand[i].force = new CubismVector2(0, 0);
    strand[i].lastGravity = new CubismVector2(
      currentGravity.x,
      currentGravity.y
    );
  }
}
function updateParticlesForStabilization(strand, strandCount, totalTranslation, totalAngle, windDirection, thresholdValue) {
  let totalRadian;
  let currentGravity;
  let force = new CubismVector2(0, 0);
  strand[0].position = new CubismVector2(
    totalTranslation.x,
    totalTranslation.y
  );
  totalRadian = CubismMath.degreesToRadian(totalAngle);
  currentGravity = CubismMath.radianToDirection(totalRadian);
  currentGravity.normalize();
  for (let i = 1; i < strandCount; ++i) {
    strand[i].force = currentGravity.multiplyByScaler(strand[i].acceleration).add(windDirection);
    strand[i].lastPosition = new CubismVector2(
      strand[i].position.x,
      strand[i].position.y
    );
    strand[i].velocity = new CubismVector2(0, 0);
    force = strand[i].force;
    force.normalize();
    force = force.multiplyByScaler(strand[i].radius);
    strand[i].position = strand[i - 1].position.add(force);
    if (CubismMath.abs(strand[i].position.x) < thresholdValue) {
      strand[i].position.x = 0;
    }
    strand[i].force = new CubismVector2(0, 0);
    strand[i].lastGravity = new CubismVector2(
      currentGravity.x,
      currentGravity.y
    );
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
  const minNormValue = CubismMath.min(
    normalizedMinimum,
    normalizedMaximum
  );
  const maxNormValue = CubismMath.max(
    normalizedMinimum,
    normalizedMaximum
  );
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
  /**
   * コンストラクタ
   * @param x 左端X座標
   * @param y 上端Y座標
   * @param w 幅
   * @param h 高さ
   */
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  /**
   * 矩形中央のX座標を取得する
   */
  getCenterX() {
    return this.x + 0.5 * this.width;
  }
  /**
   * 矩形中央のY座標を取得する
   */
  getCenterY() {
    return this.y + 0.5 * this.height;
  }
  /**
   * 右側のX座標を取得する
   */
  getRight() {
    return this.x + this.width;
  }
  /**
   * 下端のY座標を取得する
   */
  getBottom() {
    return this.y + this.height;
  }
  /**
   * 矩形に値をセットする
   * @param r 矩形のインスタンス
   */
  setRect(r) {
    this.x = r.x;
    this.y = r.y;
    this.width = r.width;
    this.height = r.height;
  }
  /**
   * 矩形中央を軸にして縦横を拡縮する
   * @param w 幅方向に拡縮する量
   * @param h 高さ方向に拡縮する量
   */
  expand(w, h) {
    this.x -= w;
    this.y -= h;
    this.width += w * 2;
    this.height += h * 2;
  }
  // 高さ
}
const ColorChannelCount = 4;
const ClippingMaskMaxCountOnDefault = 999;
const ClippingMaskMaxCountOnMultiRenderTexture = 999;
const ShaderCount = 10;
let s_instance;
let s_viewport;
let s_fbo;
class CubismClippingManager_WebGL {
  /**
   * カラーチャンネル（RGBA）のフラグを取得する
   * @param channelNo カラーチャンネル（RGBA）の番号（0:R, 1:G, 2:B, 3:A）
   */
  getChannelFlagAsColor(channelNo) {
    return this._channelColors[channelNo];
  }
  /**
   * テンポラリのレンダーテクスチャのアドレスを取得する
   * FrameBufferObjectが存在しない場合、新しく生成する
   *
   * @return レンダーテクスチャの配列
   */
  getMaskRenderTexture() {
    if (this._maskTexture && this._maskTexture.textures != null) {
      this._maskTexture.frameNo = this._currentFrameNo;
    } else {
      this._maskRenderTextures = [];
      this._maskColorBuffers = [];
      const size = this._clippingMaskBufferSize;
      for (let index = 0; index < this._renderTextureCount; index++) {
        this._maskColorBuffers.push(this.gl.createTexture());
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._maskColorBuffers[index]);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          size,
          size,
          0,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          null
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR
        );
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this._maskRenderTextures.push(this.gl.createFramebuffer());
        this.gl.bindFramebuffer(
          this.gl.FRAMEBUFFER,
          this._maskRenderTextures[index]
        );
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          this._maskColorBuffers[index],
          0
        );
      }
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo);
      this._maskTexture = new CubismRenderTextureResource(
        this._currentFrameNo,
        this._maskRenderTextures
      );
    }
    return this._maskTexture.textures;
  }
  /**
   * WebGLレンダリングコンテキストを設定する
   * @param gl WebGLレンダリングコンテキスト
   */
  setGL(gl) {
    this.gl = gl;
  }
  /**
   * マスクされる描画オブジェクト群全体を囲む矩形（モデル座標系）を計算する
   * @param model モデルのインスタンス
   * @param clippingContext クリッピングマスクのコンテキスト
   */
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
      let maxX = -Number.MAX_VALUE;
      let maxY = -Number.MAX_VALUE;
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
  /**
   * コンストラクタ
   */
  constructor() {
    this._currentMaskRenderTexture = null;
    this._currentFrameNo = 0;
    this._renderTextureCount = 0;
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
  /**
   * デストラクタ相当の処理
   */
  release() {
    var _a;
    const self2 = this;
    for (let i = 0; i < this._clippingContextListForMask.length; i++) {
      if (this._clippingContextListForMask[i]) {
        (_a = this._clippingContextListForMask[i]) == null ? void 0 : _a.release();
      }
    }
    self2._clippingContextListForMask = void 0;
    self2._clippingContextListForDraw = void 0;
    if (this._maskTexture) {
      for (let i = 0; i < this._maskTexture.textures.length; i++) {
        this.gl.deleteFramebuffer(this._maskTexture.textures[i]);
      }
      this._maskTexture = void 0;
    }
    self2._channelColors = void 0;
    if (this._maskColorBuffers) {
      for (let index = 0; index < this._maskColorBuffers.length; index++) {
        this.gl.deleteTexture(this._maskColorBuffers[index]);
      }
    }
    this._maskColorBuffers = void 0;
    this._maskRenderTextures = void 0;
    this._clearedFrameBufferflags = void 0;
  }
  /**
   * マネージャの初期化処理
   * クリッピングマスクを使う描画オブジェクトの登録を行う
   * @param model モデルのインスタンス
   * @param drawableCount 描画オブジェクトの数
   * @param drawableMasks 描画オブジェクトをマスクする描画オブジェクトのインデックスのリスト
   * @param drawableMaskCounts 描画オブジェクトをマスクする描画オブジェクトの数
   * @param renderTextureCount バッファの生成数
   */
  initialize(model, drawableCount, drawableMasks, drawableMaskCounts, renderTextureCount) {
    if (renderTextureCount % 1 != 0) {
      CubismLogWarning(
        "The number of render textures must be specified as an integer. The decimal point is rounded down and corrected to an integer."
      );
      renderTextureCount = ~~renderTextureCount;
    }
    if (renderTextureCount < 1) {
      CubismLogWarning(
        "The number of render textures must be an integer greater than or equal to 1. Set the number of render textures to 1."
      );
    }
    this._renderTextureCount = renderTextureCount < 1 ? 1 : renderTextureCount;
    this._clearedFrameBufferflags = [];
    for (let i = 0; i < drawableCount; i++) {
      if (drawableMaskCounts[i] <= 0) {
        this._clippingContextListForDraw.push(null);
        continue;
      }
      let clippingContext = this.findSameClip(
        drawableMasks[i],
        drawableMaskCounts[i]
      );
      if (clippingContext == null) {
        clippingContext = new CubismClippingContext(
          this,
          drawableMasks[i],
          drawableMaskCounts[i]
        );
        this._clippingContextListForMask.push(clippingContext);
      }
      clippingContext.addClippedDrawable(i);
      this._clippingContextListForDraw.push(clippingContext);
    }
  }
  /**
   * クリッピングコンテキストを作成する。モデル描画時に実行する。
   * @param model モデルのインスタンス
   * @param renderer レンダラのインスタンス
   */
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
      this.setupLayoutBounds(
        renderer.isUsingHighPrecisionMask() ? 0 : usingClipCount
      );
      if (!renderer.isUsingHighPrecisionMask()) {
        this.gl.viewport(
          0,
          0,
          this._clippingMaskBufferSize,
          this._clippingMaskBufferSize
        );
        this._currentMaskRenderTexture = this.getMaskRenderTexture()[0];
        renderer.preDraw();
        this.gl.bindFramebuffer(
          this.gl.FRAMEBUFFER,
          this._currentMaskRenderTexture
        );
      }
      if (!this._clearedFrameBufferflags) {
        this._clearedFrameBufferflags = [];
      }
      for (let index = 0; index < this._renderTextureCount; index++) {
        this._clearedFrameBufferflags[index] = false;
      }
      for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
        const clipContext = this._clippingContextListForMask[clipIndex];
        const allClipedDrawRect = clipContext._allClippedDrawRect;
        const layoutBoundsOnTex01 = clipContext._layoutBounds;
        const MARGIN = 0.05;
        let scaleX = 0;
        let scaleY = 0;
        const clipContextRenderTexture = this.getMaskRenderTexture()[clipContext._bufferIndex];
        if (this._currentMaskRenderTexture != clipContextRenderTexture && !renderer.isUsingHighPrecisionMask()) {
          this._currentMaskRenderTexture = clipContextRenderTexture;
          renderer.preDraw();
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            this._currentMaskRenderTexture
          );
        }
        if (renderer.isUsingHighPrecisionMask()) {
          const ppu = model.getPixelsPerUnit();
          const maskPixelSize = clipContext.getClippingManager()._clippingMaskBufferSize;
          const physicalMaskWidth = layoutBoundsOnTex01.width * maskPixelSize;
          const physicalMaskHeight = layoutBoundsOnTex01.height * maskPixelSize;
          this._tmpBoundsOnModel.setRect(allClipedDrawRect);
          if (this._tmpBoundsOnModel.width * ppu > physicalMaskWidth) {
            this._tmpBoundsOnModel.expand(
              allClipedDrawRect.width * MARGIN,
              0
            );
            scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
          } else {
            scaleX = ppu / physicalMaskWidth;
          }
          if (this._tmpBoundsOnModel.height * ppu > physicalMaskHeight) {
            this._tmpBoundsOnModel.expand(
              0,
              allClipedDrawRect.height * MARGIN
            );
            scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
          } else {
            scaleY = ppu / physicalMaskHeight;
          }
        } else {
          this._tmpBoundsOnModel.setRect(allClipedDrawRect);
          this._tmpBoundsOnModel.expand(
            allClipedDrawRect.width * MARGIN,
            allClipedDrawRect.height * MARGIN
          );
          scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
          scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
        }
        {
          this._tmpMatrix.loadIdentity();
          {
            this._tmpMatrix.translateRelative(-1, -1);
            this._tmpMatrix.scaleRelative(2, 2);
          }
          {
            this._tmpMatrix.translateRelative(
              layoutBoundsOnTex01.x,
              layoutBoundsOnTex01.y
            );
            this._tmpMatrix.scaleRelative(scaleX, scaleY);
            this._tmpMatrix.translateRelative(
              -this._tmpBoundsOnModel.x,
              -this._tmpBoundsOnModel.y
            );
          }
          this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());
        }
        {
          this._tmpMatrix.loadIdentity();
          {
            this._tmpMatrix.translateRelative(
              layoutBoundsOnTex01.x,
              layoutBoundsOnTex01.y
            );
            this._tmpMatrix.scaleRelative(scaleX, scaleY);
            this._tmpMatrix.translateRelative(
              -this._tmpBoundsOnModel.x,
              -this._tmpBoundsOnModel.y
            );
          }
          this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
        }
        clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
        clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
        if (!renderer.isUsingHighPrecisionMask()) {
          const clipDrawCount = clipContext._clippingIdCount;
          for (let i = 0; i < clipDrawCount; i++) {
            const clipDrawIndex = clipContext._clippingIdList[i];
            if (!model.getDrawableDynamicFlagVertexPositionsDidChange(
              clipDrawIndex
            )) {
              continue;
            }
            renderer.setIsCulling(
              model.getDrawableCulling(clipDrawIndex) != false
            );
            if (!this._clearedFrameBufferflags[clipContext._bufferIndex]) {
              this.gl.clearColor(1, 1, 1, 1);
              this.gl.clear(this.gl.COLOR_BUFFER_BIT);
              this._clearedFrameBufferflags[clipContext._bufferIndex] = true;
            }
            renderer.setClippingContextBufferForMask(clipContext);
            renderer.drawMesh(
              model.getDrawableTextureIndex(clipDrawIndex),
              model.getDrawableVertexIndexCount(clipDrawIndex),
              model.getDrawableVertexCount(clipDrawIndex),
              model.getDrawableVertexIndices(clipDrawIndex),
              model.getDrawableVertices(clipDrawIndex),
              model.getDrawableVertexUvs(clipDrawIndex),
              model.getMultiplyColor(clipDrawIndex),
              model.getScreenColor(clipDrawIndex),
              model.getDrawableOpacity(clipDrawIndex),
              CubismBlendMode.CubismBlendMode_Normal,
              // クリッピングは通常描画を強制
              false
              // マスク生成時はクリッピングの反転使用は全く関係がない
            );
          }
        }
      }
      if (!renderer.isUsingHighPrecisionMask()) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo);
        renderer.setClippingContextBufferForMask(null);
        this.gl.viewport(
          s_viewport[0],
          s_viewport[1],
          s_viewport[2],
          s_viewport[3]
        );
      }
    }
  }
  /**
   * 既にマスクを作っているかを確認
   * 作っている様であれば該当するクリッピングマスクのインスタンスを返す
   * 作っていなければNULLを返す
   * @param drawableMasks 描画オブジェクトをマスクする描画オブジェクトのリスト
   * @param drawableMaskCounts 描画オブジェクトをマスクする描画オブジェクトの数
   * @return 該当するクリッピングマスクが存在すればインスタンスを返し、なければNULLを返す
   */
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
  /**
   * クリッピングコンテキストを配置するレイアウト
   * 指定された数のレンダーテクスチャを極力いっぱいに使ってマスクをレイアウトする
   * マスクグループの数が4以下ならRGBA各チャンネルに一つずつマスクを配置し、5以上6以下ならRGBAを2,2,1,1と配置する。
   *
   * @param usingClipCount 配置するクリッピングコンテキストの数
   */
  setupLayoutBounds(usingClipCount) {
    const useClippingMaskMaxCount = this._renderTextureCount <= 1 ? ClippingMaskMaxCountOnDefault : ClippingMaskMaxCountOnMultiRenderTexture * this._renderTextureCount;
    if (usingClipCount <= 0 || usingClipCount > useClippingMaskMaxCount) {
      if (usingClipCount > useClippingMaskMaxCount) {
        CubismLogError(
          "not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}",
          usingClipCount - useClippingMaskMaxCount,
          this._renderTextureCount,
          usingClipCount
        );
      }
      for (let index = 0; index < this._clippingContextListForMask.length; index++) {
        const clipContext = this._clippingContextListForMask[index];
        clipContext._layoutChannelNo = 0;
        clipContext._layoutBounds.x = 0;
        clipContext._layoutBounds.y = 0;
        clipContext._layoutBounds.width = 1;
        clipContext._layoutBounds.height = 1;
        clipContext._bufferIndex = 0;
      }
      return;
    }
    const layoutCountMaxValue = this._renderTextureCount <= 1 ? 9 : 8;
    let countPerSheetDiv = usingClipCount / this._renderTextureCount;
    let countPerSheetMod = usingClipCount % this._renderTextureCount;
    countPerSheetDiv = ~~countPerSheetDiv;
    countPerSheetMod = ~~countPerSheetMod;
    let div = countPerSheetDiv / ColorChannelCount;
    let mod = countPerSheetDiv % ColorChannelCount;
    div = ~~div;
    mod = ~~mod;
    let curClipIndex = 0;
    for (let renderTextureNo = 0; renderTextureNo < this._renderTextureCount; renderTextureNo++) {
      for (let channelNo = 0; channelNo < ColorChannelCount; channelNo++) {
        let layoutCount = div + (channelNo < mod ? 1 : 0);
        const checkChannelNo = mod + 1 >= ColorChannelCount ? 0 : mod + 1;
        if (layoutCount < layoutCountMaxValue && channelNo == checkChannelNo) {
          layoutCount += renderTextureNo < countPerSheetMod ? 1 : 0;
        }
        if (layoutCount == 0)
          ;
        else if (layoutCount == 1) {
          const clipContext = this._clippingContextListForMask[curClipIndex++];
          clipContext._layoutChannelNo = channelNo;
          clipContext._layoutBounds.x = 0;
          clipContext._layoutBounds.y = 0;
          clipContext._layoutBounds.width = 1;
          clipContext._layoutBounds.height = 1;
          clipContext._bufferIndex = renderTextureNo;
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
            cc._bufferIndex = renderTextureNo;
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
            cc._bufferIndex = renderTextureNo;
          }
        } else if (layoutCount <= layoutCountMaxValue) {
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
            cc._bufferIndex = renderTextureNo;
          }
        } else if (CubismConfig.supportMoreMaskDivisions && layoutCount <= 16) {
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
            cc._bufferIndex = renderTextureNo;
          }
        } else {
          CubismLogError(
            "not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}",
            usingClipCount - useClippingMaskMaxCount,
            this._renderTextureCount,
            usingClipCount
          );
          for (let index = 0; index < layoutCount; index++) {
            const cc = this._clippingContextListForMask[curClipIndex++];
            cc._layoutChannelNo = 0;
            cc._layoutBounds.x = 0;
            cc._layoutBounds.y = 0;
            cc._layoutBounds.width = 1;
            cc._layoutBounds.height = 1;
            cc._bufferIndex = 0;
          }
        }
      }
    }
  }
  /**
   * カラーバッファを取得する
   * @return カラーバッファ
   */
  getColorBuffer() {
    return this._maskColorBuffers;
  }
  /**
   * 画面描画に使用するクリッピングマスクのリストを取得する
   * @return 画面描画に使用するクリッピングマスクのリスト
   */
  getClippingContextListForDraw() {
    return this._clippingContextListForDraw;
  }
  /**
   * マスクの合計数をカウント
   * @returns
   */
  getClippingMaskCount() {
    return this._clippingContextListForMask.length;
  }
  /**
   * クリッピングマスクバッファのサイズを設定する
   * @param size クリッピングマスクバッファのサイズ
   */
  setClippingMaskBufferSize(size) {
    this._clippingMaskBufferSize = size;
  }
  /**
   * クリッピングマスクバッファのサイズを取得する
   * @return クリッピングマスクバッファのサイズ
   */
  getClippingMaskBufferSize() {
    return this._clippingMaskBufferSize;
  }
  /**
   * このバッファのレンダーテクスチャの枚数を取得する
   * @return このバッファのレンダーテクスチャの枚数
   */
  getRenderTextureCount() {
    return this._renderTextureCount;
  }
  // WebGLレンダリングコンテキスト
}
class CubismRenderTextureResource {
  /**
   * 引数付きコンストラクタ
   * @param frameNo レンダラーのフレーム番号
   * @param texture テクスチャのアドレス
   */
  constructor(frameNo, texture) {
    this.frameNo = frameNo;
    this.textures = texture;
  }
  // テクスチャのアドレス
}
class CubismClippingContext {
  /**
   * 引数付きコンストラクタ
   */
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
    this._bufferIndex = 0;
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    const self2 = this;
    self2._layoutBounds = void 0;
    self2._allClippedDrawRect = void 0;
    self2._clippedDrawableIndexList = void 0;
  }
  /**
   * このマスクにクリップされる描画オブジェクトを追加する
   *
   * @param drawableIndex クリッピング対象に追加する描画オブジェクトのインデックス
   */
  addClippedDrawable(drawableIndex) {
    this._clippedDrawableIndexList.push(drawableIndex);
  }
  /**
   * このマスクを管理するマネージャのインスタンスを取得する
   * @return クリッピングマネージャのインスタンス
   */
  getClippingManager() {
    return this._owner;
  }
  setGl(gl) {
    this._owner.setGL(gl);
  }
  // このマスクを管理しているマネージャのインスタンス
}
class CubismRendererProfile_WebGL {
  setGlEnable(index, enabled) {
    if (enabled)
      this.gl.enable(index);
    else
      this.gl.disable(index);
  }
  setGlEnableVertexAttribArray(index, enabled) {
    if (enabled)
      this.gl.enableVertexAttribArray(index);
    else
      this.gl.disableVertexAttribArray(index);
  }
  save() {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }
    this._lastArrayBufferBinding = this.gl.getParameter(
      this.gl.ARRAY_BUFFER_BINDING
    );
    this._lastArrayBufferBinding = this.gl.getParameter(
      this.gl.ELEMENT_ARRAY_BUFFER_BINDING
    );
    this._lastProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
    this._lastActiveTexture = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this._lastTexture1Binding2D = this.gl.getParameter(
      this.gl.TEXTURE_BINDING_2D
    );
    this.gl.activeTexture(this.gl.TEXTURE0);
    this._lastTexture0Binding2D = this.gl.getParameter(
      this.gl.TEXTURE_BINDING_2D
    );
    this._lastVertexAttribArrayEnabled[0] = this.gl.getVertexAttrib(
      0,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[1] = this.gl.getVertexAttrib(
      1,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[2] = this.gl.getVertexAttrib(
      2,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[3] = this.gl.getVertexAttrib(
      3,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastScissorTest = this.gl.isEnabled(this.gl.SCISSOR_TEST);
    this._lastStencilTest = this.gl.isEnabled(this.gl.STENCIL_TEST);
    this._lastDepthTest = this.gl.isEnabled(this.gl.DEPTH_TEST);
    this._lastCullFace = this.gl.isEnabled(this.gl.CULL_FACE);
    this._lastBlend = this.gl.isEnabled(this.gl.BLEND);
    this._lastFrontFace = this.gl.getParameter(this.gl.FRONT_FACE);
    this._lastColorMask = this.gl.getParameter(this.gl.COLOR_WRITEMASK);
    this._lastBlending[0] = this.gl.getParameter(this.gl.BLEND_SRC_RGB);
    this._lastBlending[1] = this.gl.getParameter(this.gl.BLEND_DST_RGB);
    this._lastBlending[2] = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA);
    this._lastBlending[3] = this.gl.getParameter(this.gl.BLEND_DST_ALPHA);
    this._lastFBO = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
    this._lastViewport = this.gl.getParameter(this.gl.VIEWPORT);
  }
  restore() {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }
    this.gl.useProgram(this._lastProgram);
    this.setGlEnableVertexAttribArray(0, this._lastVertexAttribArrayEnabled[0]);
    this.setGlEnableVertexAttribArray(1, this._lastVertexAttribArrayEnabled[1]);
    this.setGlEnableVertexAttribArray(2, this._lastVertexAttribArrayEnabled[2]);
    this.setGlEnableVertexAttribArray(3, this._lastVertexAttribArrayEnabled[3]);
    this.setGlEnable(this.gl.SCISSOR_TEST, this._lastScissorTest);
    this.setGlEnable(this.gl.STENCIL_TEST, this._lastStencilTest);
    this.setGlEnable(this.gl.DEPTH_TEST, this._lastDepthTest);
    this.setGlEnable(this.gl.CULL_FACE, this._lastCullFace);
    this.setGlEnable(this.gl.BLEND, this._lastBlend);
    this.gl.frontFace(this._lastFrontFace);
    this.gl.colorMask(
      this._lastColorMask[0],
      this._lastColorMask[1],
      this._lastColorMask[2],
      this._lastColorMask[3]
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._lastArrayBufferBinding);
    this.gl.bindBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      this._lastElementArrayBufferBinding
    );
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture1Binding2D);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture0Binding2D);
    this.gl.activeTexture(this._lastActiveTexture);
    this.gl.blendFuncSeparate(
      this._lastBlending[0],
      this._lastBlending[1],
      this._lastBlending[2],
      this._lastBlending[3]
    );
  }
  setGl(gl) {
    this.gl = gl;
  }
  constructor() {
    this._lastVertexAttribArrayEnabled = new Array(4);
    this._lastColorMask = new Array(4);
    this._lastBlending = new Array(4);
    this._lastViewport = new Array(4);
  }
}
class CubismShader_WebGL {
  /**
   * インスタンスを取得する（シングルトン）
   * @return インスタンス
   */
  static getInstance() {
    if (s_instance == null) {
      s_instance = new CubismShader_WebGL();
      return s_instance;
    }
    return s_instance;
  }
  /**
   * インスタンスを開放する（シングルトン）
   */
  static deleteInstance() {
    if (s_instance) {
      s_instance.release();
      s_instance = void 0;
    }
  }
  /**
   * privateなコンストラクタ
   */
  constructor() {
    this._shaderSets = [];
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    this.releaseShaderProgram();
  }
  /**
   * シェーダープログラムの一連のセットアップを実行する
   * @param renderer レンダラのインスタンス
   * @param textureId GPUのテクスチャID
   * @param vertexCount ポリゴンメッシュの頂点数
   * @param vertexArray ポリゴンメッシュの頂点配列
   * @param indexArray インデックスバッファの頂点配列
   * @param uvArray uv配列
   * @param opacity 不透明度
   * @param colorBlendMode カラーブレンディングのタイプ
   * @param baseColor ベースカラー
   * @param isPremultipliedAlpha 乗算済みアルファかどうか
   * @param matrix4x4 Model-View-Projection行列
   * @param invertedMask マスクを反転して使用するフラグ
   */
  setupShaderProgram(renderer, textureId, vertexCount, vertexArray, indexArray, uvArray, bufferData, opacity, colorBlendMode, baseColor, multiplyColor, screenColor, isPremultipliedAlpha, matrix4x4, invertedMask) {
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
      const shaderSet = this._shaderSets[
        0
        /* ShaderNames_SetupMask */
      ];
      this.gl.useProgram(shaderSet.shaderProgram);
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
      this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
      if (bufferData.vertex == null) {
        bufferData.vertex = this.gl.createBuffer();
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.vertex);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        vertexArray,
        this.gl.DYNAMIC_DRAW
      );
      this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
      this.gl.vertexAttribPointer(
        shaderSet.attributePositionLocation,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
      );
      if (bufferData.uv == null) {
        bufferData.uv = this.gl.createBuffer();
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.uv);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
      this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
      this.gl.vertexAttribPointer(
        shaderSet.attributeTexCoordLocation,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
      );
      const channelNo = clippingContextBufferForMask._layoutChannelNo;
      const colorChannel = clippingContextBufferForMask.getClippingManager().getChannelFlagAsColor(channelNo);
      this.gl.uniform4f(
        shaderSet.uniformChannelFlagLocation,
        colorChannel.R,
        colorChannel.G,
        colorChannel.B,
        colorChannel.A
      );
      this.gl.uniformMatrix4fv(
        shaderSet.uniformClipMatrixLocation,
        false,
        clippingContextBufferForMask._matrixForMask.getArray()
      );
      const rect = clippingContextBufferForMask._layoutBounds;
      this.gl.uniform4f(
        shaderSet.uniformBaseColorLocation,
        rect.x * 2 - 1,
        rect.y * 2 - 1,
        rect.getRight() * 2 - 1,
        rect.getBottom() * 2 - 1
      );
      this.gl.uniform4f(
        shaderSet.uniformMultiplyColorLocation,
        multiplyColor.R,
        multiplyColor.G,
        multiplyColor.B,
        multiplyColor.A
      );
      this.gl.uniform4f(
        shaderSet.uniformScreenColorLocation,
        screenColor.R,
        screenColor.G,
        screenColor.B,
        screenColor.A
      );
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
          shaderSet = this._shaderSets[1 + offset];
          SRC_COLOR = this.gl.ONE;
          DST_COLOR = this.gl.ONE_MINUS_SRC_ALPHA;
          SRC_ALPHA = this.gl.ONE;
          DST_ALPHA = this.gl.ONE_MINUS_SRC_ALPHA;
          break;
        case CubismBlendMode.CubismBlendMode_Additive:
          shaderSet = this._shaderSets[4 + offset];
          SRC_COLOR = this.gl.ONE;
          DST_COLOR = this.gl.ONE;
          SRC_ALPHA = this.gl.ZERO;
          DST_ALPHA = this.gl.ONE;
          break;
        case CubismBlendMode.CubismBlendMode_Multiplicative:
          shaderSet = this._shaderSets[7 + offset];
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
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        vertexArray,
        this.gl.DYNAMIC_DRAW
      );
      this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
      this.gl.vertexAttribPointer(
        shaderSet.attributePositionLocation,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
      );
      if (bufferData.uv == null) {
        bufferData.uv = this.gl.createBuffer();
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.uv);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
      this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
      this.gl.vertexAttribPointer(
        shaderSet.attributeTexCoordLocation,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
      );
      if (clippingContextBufferForDraw != null) {
        this.gl.activeTexture(this.gl.TEXTURE1);
        const tex = clippingContextBufferForDraw.getClippingManager().getColorBuffer()[renderer.getClippingContextBufferForDraw()._bufferIndex];
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.uniform1i(shaderSet.samplerTexture1Location, 1);
        this.gl.uniformMatrix4fv(
          shaderSet.uniformClipMatrixLocation,
          false,
          clippingContextBufferForDraw._matrixForDraw.getArray()
        );
        const channelNo = clippingContextBufferForDraw._layoutChannelNo;
        const colorChannel = clippingContextBufferForDraw.getClippingManager().getChannelFlagAsColor(channelNo);
        this.gl.uniform4f(
          shaderSet.uniformChannelFlagLocation,
          colorChannel.R,
          colorChannel.G,
          colorChannel.B,
          colorChannel.A
        );
      }
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
      this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
      this.gl.uniformMatrix4fv(
        shaderSet.uniformMatrixLocation,
        false,
        matrix4x4.getArray()
      );
      this.gl.uniform4f(
        shaderSet.uniformBaseColorLocation,
        baseColor.R,
        baseColor.G,
        baseColor.B,
        baseColor.A
      );
      this.gl.uniform4f(
        shaderSet.uniformMultiplyColorLocation,
        multiplyColor.R,
        multiplyColor.G,
        multiplyColor.B,
        multiplyColor.A
      );
      this.gl.uniform4f(
        shaderSet.uniformScreenColorLocation,
        screenColor.R,
        screenColor.G,
        screenColor.B,
        screenColor.A
      );
    }
    if (bufferData.index == null) {
      bufferData.index = this.gl.createBuffer();
    }
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, bufferData.index);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      indexArray,
      this.gl.DYNAMIC_DRAW
    );
    this.gl.blendFuncSeparate(SRC_COLOR, DST_COLOR, SRC_ALPHA, DST_ALPHA);
  }
  /**
   * シェーダープログラムを解放する
   */
  releaseShaderProgram() {
    for (let i = 0; i < this._shaderSets.length; i++) {
      this.gl.deleteProgram(this._shaderSets[i].shaderProgram);
      this._shaderSets[i].shaderProgram = 0;
    }
    this._shaderSets = [];
  }
  /**
   * シェーダープログラムを初期化する
   * @param vertShaderSrc 頂点シェーダのソース
   * @param fragShaderSrc フラグメントシェーダのソース
   */
  generateShaders() {
    for (let i = 0; i < ShaderCount; i++) {
      this._shaderSets.push({});
    }
    this._shaderSets[0].shaderProgram = this.loadShaderProgram(
      vertexShaderSrcSetupMask,
      fragmentShaderSrcsetupMask
    );
    this._shaderSets[1].shaderProgram = this.loadShaderProgram(
      vertexShaderSrc,
      fragmentShaderSrcPremultipliedAlpha
    );
    this._shaderSets[2].shaderProgram = this.loadShaderProgram(
      vertexShaderSrcMasked,
      fragmentShaderSrcMaskPremultipliedAlpha
    );
    this._shaderSets[3].shaderProgram = this.loadShaderProgram(
      vertexShaderSrcMasked,
      fragmentShaderSrcMaskInvertedPremultipliedAlpha
    );
    this._shaderSets[4].shaderProgram = this._shaderSets[1].shaderProgram;
    this._shaderSets[5].shaderProgram = this._shaderSets[2].shaderProgram;
    this._shaderSets[6].shaderProgram = this._shaderSets[3].shaderProgram;
    this._shaderSets[7].shaderProgram = this._shaderSets[1].shaderProgram;
    this._shaderSets[8].shaderProgram = this._shaderSets[2].shaderProgram;
    this._shaderSets[9].shaderProgram = this._shaderSets[3].shaderProgram;
    this._shaderSets[0].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[0].shaderProgram,
      "a_position"
    );
    this._shaderSets[0].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[0].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[0].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[0].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[0].uniformClipMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[0].shaderProgram,
      "u_clipMatrix"
    );
    this._shaderSets[0].uniformChannelFlagLocation = this.gl.getUniformLocation(
      this._shaderSets[0].shaderProgram,
      "u_channelFlag"
    );
    this._shaderSets[0].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[0].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[0].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[0].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[0].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[0].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[1].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[1].shaderProgram,
      "a_position"
    );
    this._shaderSets[1].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[1].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[1].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[1].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[1].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[1].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[1].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[1].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[1].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[1].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[1].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[1].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[2].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[2].shaderProgram,
      "a_position"
    );
    this._shaderSets[2].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[2].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[2].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[2].samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "s_texture1"
    );
    this._shaderSets[2].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[2].uniformClipMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "u_clipMatrix"
    );
    this._shaderSets[2].uniformChannelFlagLocation = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "u_channelFlag"
    );
    this._shaderSets[2].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[2].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[2].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[2].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[3].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[3].shaderProgram,
      "a_position"
    );
    this._shaderSets[3].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[3].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[3].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[3].samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "s_texture1"
    );
    this._shaderSets[3].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[3].uniformClipMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "u_clipMatrix"
    );
    this._shaderSets[3].uniformChannelFlagLocation = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "u_channelFlag"
    );
    this._shaderSets[3].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[3].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[3].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[3].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[4].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[4].shaderProgram,
      "a_position"
    );
    this._shaderSets[4].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[4].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[4].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[4].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[4].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[4].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[4].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[4].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[4].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[4].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[4].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[4].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[5].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[5].shaderProgram,
      "a_position"
    );
    this._shaderSets[5].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[5].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[5].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[5].samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "s_texture1"
    );
    this._shaderSets[5].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[5].uniformClipMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "u_clipMatrix"
    );
    this._shaderSets[5].uniformChannelFlagLocation = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "u_channelFlag"
    );
    this._shaderSets[5].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[5].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[5].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[5].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[6].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[6].shaderProgram,
      "a_position"
    );
    this._shaderSets[6].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[6].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[6].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[6].samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "s_texture1"
    );
    this._shaderSets[6].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[6].uniformClipMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "u_clipMatrix"
    );
    this._shaderSets[6].uniformChannelFlagLocation = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "u_channelFlag"
    );
    this._shaderSets[6].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[6].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[6].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[6].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[7].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[7].shaderProgram,
      "a_position"
    );
    this._shaderSets[7].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[7].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[7].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[7].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[7].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[7].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[7].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[7].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[7].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[7].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[7].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[7].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[8].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[8].shaderProgram,
      "a_position"
    );
    this._shaderSets[8].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[8].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[8].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[8].samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "s_texture1"
    );
    this._shaderSets[8].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[8].uniformClipMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "u_clipMatrix"
    );
    this._shaderSets[8].uniformChannelFlagLocation = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "u_channelFlag"
    );
    this._shaderSets[8].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[8].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[8].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[8].shaderProgram,
      "u_screenColor"
    );
    this._shaderSets[9].attributePositionLocation = this.gl.getAttribLocation(
      this._shaderSets[9].shaderProgram,
      "a_position"
    );
    this._shaderSets[9].attributeTexCoordLocation = this.gl.getAttribLocation(
      this._shaderSets[9].shaderProgram,
      "a_texCoord"
    );
    this._shaderSets[9].samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "s_texture0"
    );
    this._shaderSets[9].samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "s_texture1"
    );
    this._shaderSets[9].uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "u_matrix"
    );
    this._shaderSets[9].uniformClipMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "u_clipMatrix"
    );
    this._shaderSets[9].uniformChannelFlagLocation = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "u_channelFlag"
    );
    this._shaderSets[9].uniformBaseColorLocation = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "u_baseColor"
    );
    this._shaderSets[9].uniformMultiplyColorLocation = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "u_multiplyColor"
    );
    this._shaderSets[9].uniformScreenColorLocation = this.gl.getUniformLocation(
      this._shaderSets[9].shaderProgram,
      "u_screenColor"
    );
  }
  /**
   * シェーダプログラムをロードしてアドレスを返す
   * @param vertexShaderSource    頂点シェーダのソース
   * @param fragmentShaderSource  フラグメントシェーダのソース
   * @return シェーダプログラムのアドレス
   */
  loadShaderProgram(vertexShaderSource, fragmentShaderSource) {
    const shaderProgram = this.gl.createProgram();
    const vertShader = this.compileShaderSource(
      this.gl.VERTEX_SHADER,
      vertexShaderSource
    );
    if (!vertShader) {
      CubismLogError("Vertex shader compile error!");
      return 0;
    }
    const fragShader = this.compileShaderSource(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );
    if (!fragShader) {
      CubismLogError("Vertex shader compile error!");
      return 0;
    }
    this.gl.attachShader(shaderProgram, vertShader);
    this.gl.attachShader(shaderProgram, fragShader);
    this.gl.linkProgram(shaderProgram);
    const linkStatus = this.gl.getProgramParameter(
      shaderProgram,
      this.gl.LINK_STATUS
    );
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
  /**
   * シェーダープログラムをコンパイルする
   * @param shaderType シェーダタイプ(Vertex/Fragment)
   * @param shaderSource シェーダソースコード
   *
   * @return コンパイルされたシェーダープログラム
   */
  compileShaderSource(shaderType, shaderSource) {
    const source = shaderSource;
    const shader = this.gl.createShader(shaderType);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!shader) {
      const log = this.gl.getShaderInfoLog(shader);
      CubismLogError("Shader compile log: {0} ", log);
    }
    const status = this.gl.getShaderParameter(
      shader,
      this.gl.COMPILE_STATUS
    );
    if (!status) {
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  setGl(gl) {
    this.gl = gl;
  }
  // webglコンテキスト
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
const fragmentShaderSrcPremultipliedAlpha = "precision mediump float;varying vec2       v_texCoord;uniform vec4       u_baseColor;uniform sampler2D  s_texture0;uniform vec4       u_multiplyColor;uniform vec4       u_screenColor;void main(){   vec4 texColor = texture2D(s_texture0, v_texCoord);   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);   vec4 color = texColor * u_baseColor;   gl_FragColor = vec4(color.rgb, color.a);}";
const fragmentShaderSrcMaskPremultipliedAlpha = "precision mediump float;varying vec2       v_texCoord;varying vec4       v_clipPos;uniform vec4       u_baseColor;uniform vec4       u_channelFlag;uniform sampler2D  s_texture0;uniform sampler2D  s_texture1;uniform vec4       u_multiplyColor;uniform vec4       u_screenColor;void main(){   vec4 texColor = texture2D(s_texture0, v_texCoord);   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);   vec4 col_formask = texColor * u_baseColor;   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;   col_formask = col_formask * maskVal;   gl_FragColor = col_formask;}";
const fragmentShaderSrcMaskInvertedPremultipliedAlpha = "precision mediump float;varying vec2      v_texCoord;varying vec4      v_clipPos;uniform sampler2D s_texture0;uniform sampler2D s_texture1;uniform vec4      u_channelFlag;uniform vec4      u_baseColor;uniform vec4      u_multiplyColor;uniform vec4      u_screenColor;void main(){   vec4 texColor = texture2D(s_texture0, v_texCoord);   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);   vec4 col_formask = texColor * u_baseColor;   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;   col_formask = col_formask * (1.0 - maskVal);   gl_FragColor = col_formask;}";
class CubismRenderer_WebGL extends CubismRenderer {
  /**
   * レンダラの初期化処理を実行する
   * 引数に渡したモデルからレンダラの初期化処理に必要な情報を取り出すことができる
   *
   * @param model モデルのインスタンス
   * @param maskBufferCount バッファの生成数
   */
  initialize(model, maskBufferCount = 1) {
    if (model.isUsingMasking()) {
      this._clippingManager = new CubismClippingManager_WebGL();
      this._clippingManager.initialize(
        model,
        model.getDrawableCount(),
        model.getDrawableMasks(),
        model.getDrawableMaskCounts(),
        maskBufferCount
      );
    }
    for (let i = model.getDrawableCount() - 1; i >= 0; i--) {
      this._sortedDrawableIndexList[i] = 0;
    }
    super.initialize(model);
  }
  /**
   * WebGLテクスチャのバインド処理
   * CubismRendererにテクスチャを設定し、CubismRenderer内でその画像を参照するためのIndex値を戻り値とする
   * @param modelTextureNo セットするモデルテクスチャの番号
   * @param glTextureNo WebGLテクスチャの番号
   */
  bindTexture(modelTextureNo, glTexture) {
    this._textures[modelTextureNo] = glTexture;
  }
  /**
   * WebGLにバインドされたテクスチャのリストを取得する
   * @return テクスチャのリスト
   */
  getBindedTextures() {
    return this._textures;
  }
  /**
   * クリッピングマスクバッファのサイズを設定する
   * マスク用のFrameBufferを破棄、再作成する為処理コストは高い
   * @param size クリッピングマスクバッファのサイズ
   */
  setClippingMaskBufferSize(size) {
    if (!this._model.isUsingMasking()) {
      return;
    }
    const renderTextureCount = this._clippingManager.getRenderTextureCount();
    this._clippingManager.release();
    this._clippingManager = new CubismClippingManager_WebGL();
    this._clippingManager.setClippingMaskBufferSize(size);
    this._clippingManager.initialize(
      this.getModel(),
      this.getModel().getDrawableCount(),
      this.getModel().getDrawableMasks(),
      this.getModel().getDrawableMaskCounts(),
      renderTextureCount
      // インスタンス破棄前に保存したレンダーテクスチャの数
    );
  }
  /**
   * クリッピングマスクバッファのサイズを取得する
   * @return クリッピングマスクバッファのサイズ
   */
  getClippingMaskBufferSize() {
    return this._model.isUsingMasking() ? this._clippingManager.getClippingMaskBufferSize() : -1;
  }
  /**
   * レンダーテクスチャの枚数を取得する
   * @return レンダーテクスチャの枚数
   */
  getRenderTextureCount() {
    return this._model.isUsingMasking() ? this._clippingManager.getRenderTextureCount() : -1;
  }
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this._clippingContextBufferForMask = null;
    this._clippingContextBufferForDraw = null;
    this._rendererProfile = new CubismRendererProfile_WebGL();
    this.firstDraw = true;
    this._textures = {};
    this._sortedDrawableIndexList = [];
    this._bufferData = {
      vertex: null,
      uv: null,
      index: null
    };
  }
  /**
   * デストラクタ相当の処理
   */
  release() {
    var _a, _b, _c;
    const self2 = this;
    if (this._clippingManager)
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
  /**
   * モデルを描画する実際の処理
   */
  doDrawModel() {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }
    if (this._clippingManager != null) {
      this.preDraw();
      this._clippingManager.setupClippingContext(this.getModel(), this);
    }
    this.preDraw();
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
      const clipContext = this._clippingManager != null ? this._clippingManager.getClippingContextListForDraw()[drawableIndex] : null;
      if (clipContext != null && this.isUsingHighPrecisionMask()) {
        if (clipContext._isUsing) {
          this.gl.viewport(
            0,
            0,
            this._clippingManager.getClippingMaskBufferSize(),
            this._clippingManager.getClippingMaskBufferSize()
          );
          this.preDraw();
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            clipContext.getClippingManager().getMaskRenderTexture()[clipContext._bufferIndex]
          );
          this.gl.clearColor(1, 1, 1, 1);
          this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }
        {
          const clipDrawCount = clipContext._clippingIdCount;
          for (let index = 0; index < clipDrawCount; index++) {
            const clipDrawIndex = clipContext._clippingIdList[index];
            if (!this._model.getDrawableDynamicFlagVertexPositionsDidChange(
              clipDrawIndex
            )) {
              continue;
            }
            this.setIsCulling(
              this._model.getDrawableCulling(clipDrawIndex) != false
            );
            this.setClippingContextBufferForMask(clipContext);
            this.drawMesh(
              this.getModel().getDrawableTextureIndex(clipDrawIndex),
              this.getModel().getDrawableVertexIndexCount(clipDrawIndex),
              this.getModel().getDrawableVertexCount(clipDrawIndex),
              this.getModel().getDrawableVertexIndices(clipDrawIndex),
              this.getModel().getDrawableVertices(clipDrawIndex),
              this.getModel().getDrawableVertexUvs(clipDrawIndex),
              this.getModel().getMultiplyColor(clipDrawIndex),
              this.getModel().getScreenColor(clipDrawIndex),
              this.getModel().getDrawableOpacity(clipDrawIndex),
              CubismBlendMode.CubismBlendMode_Normal,
              // クリッピングは通常描画を強制
              false
              // マスク生成時はクリッピングの反転使用は全く関係がない
            );
          }
        }
        {
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo);
          this.setClippingContextBufferForMask(null);
          this.gl.viewport(
            s_viewport[0],
            s_viewport[1],
            s_viewport[2],
            s_viewport[3]
          );
          this.preDraw();
        }
      }
      this.setClippingContextBufferForDraw(clipContext);
      this.setIsCulling(this.getModel().getDrawableCulling(drawableIndex));
      this.drawMesh(
        this.getModel().getDrawableTextureIndex(drawableIndex),
        this.getModel().getDrawableVertexIndexCount(drawableIndex),
        this.getModel().getDrawableVertexCount(drawableIndex),
        this.getModel().getDrawableVertexIndices(drawableIndex),
        this.getModel().getDrawableVertices(drawableIndex),
        this.getModel().getDrawableVertexUvs(drawableIndex),
        this.getModel().getMultiplyColor(drawableIndex),
        this.getModel().getScreenColor(drawableIndex),
        this.getModel().getDrawableOpacity(drawableIndex),
        this.getModel().getDrawableBlendMode(drawableIndex),
        this.getModel().getDrawableInvertedMaskBit(drawableIndex)
      );
    }
  }
  /**
   * [オーバーライド]
   * 描画オブジェクト（アートメッシュ）を描画する。
   * ポリゴンメッシュとテクスチャ番号をセットで渡す。
   * @param textureNo 描画するテクスチャ番号
   * @param indexCount 描画オブジェクトのインデックス値
   * @param vertexCount ポリゴンメッシュの頂点数
   * @param indexArray ポリゴンメッシュのインデックス配列
   * @param vertexArray ポリゴンメッシュの頂点配列
   * @param uvArray uv配列
   * @param opacity 不透明度
   * @param colorBlendMode カラー合成タイプ
   * @param invertedMask マスク使用時のマスクの反転使用
   */
  drawMesh(textureNo, indexCount, vertexCount, indexArray, vertexArray, uvArray, multiplyColor, screenColor, opacity, colorBlendMode, invertedMask) {
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
    CubismShader_WebGL.getInstance().setupShaderProgram(
      this,
      drawtexture,
      vertexCount,
      vertexArray,
      indexArray,
      uvArray,
      this._bufferData,
      opacity,
      colorBlendMode,
      modelColorRGBA,
      multiplyColor,
      screenColor,
      this.isPremultipliedAlpha(),
      this.getMvpMatrix(),
      invertedMask
    );
    this.gl.drawElements(
      this.gl.TRIANGLES,
      indexCount,
      this.gl.UNSIGNED_SHORT,
      0
    );
    this.gl.useProgram(null);
    this.setClippingContextBufferForDraw(null);
    this.setClippingContextBufferForMask(null);
  }
  saveProfile() {
    this._rendererProfile.save();
  }
  restoreProfile() {
    this._rendererProfile.restore();
  }
  /**
   * レンダラが保持する静的なリソースを解放する
   * WebGLの静的なシェーダープログラムを解放する
   */
  static doStaticRelease() {
    CubismShader_WebGL.deleteInstance();
  }
  /**
   * レンダーステートを設定する
   * @param fbo アプリケーション側で指定しているフレームバッファ
   * @param viewport ビューポート
   */
  setRenderState(fbo, viewport) {
    s_fbo = fbo;
    s_viewport = viewport;
  }
  /**
   * 描画開始時の追加処理
   * モデルを描画する前にクリッピングマスクに必要な処理を実装している
   */
  preDraw() {
    if (this.firstDraw) {
      this.firstDraw = false;
    }
    this.gl.disable(this.gl.SCISSOR_TEST);
    this.gl.disable(this.gl.STENCIL_TEST);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.frontFace(this.gl.CW);
    this.gl.enable(this.gl.BLEND);
    this.gl.colorMask(true, true, true, true);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    if (this.getAnisotropy() > 0 && this._extension) {
      for (const tex of Object.entries(this._textures)) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texParameterf(
          this.gl.TEXTURE_2D,
          this._extension.TEXTURE_MAX_ANISOTROPY_EXT,
          this.getAnisotropy()
        );
      }
    }
  }
  /**
   * マスクテクスチャに描画するクリッピングコンテキストをセットする
   */
  setClippingContextBufferForMask(clip) {
    this._clippingContextBufferForMask = clip;
  }
  /**
   * マスクテクスチャに描画するクリッピングコンテキストを取得する
   * @return マスクテクスチャに描画するクリッピングコンテキスト
   */
  getClippingContextBufferForMask() {
    return this._clippingContextBufferForMask;
  }
  /**
   * 画面上に描画するクリッピングコンテキストをセットする
   */
  setClippingContextBufferForDraw(clip) {
    this._clippingContextBufferForDraw = clip;
  }
  /**
   * 画面上に描画するクリッピングコンテキストを取得する
   * @return 画面上に描画するクリッピングコンテキスト
   */
  getClippingContextBufferForDraw() {
    return this._clippingContextBufferForDraw;
  }
  /**
   * glの設定
   */
  startUp(gl) {
    this.gl = gl;
    if (this._clippingManager) {
      this._clippingManager.setGL(gl);
    }
    CubismShader_WebGL.getInstance().setGl(gl);
    this._rendererProfile.setGl(gl);
    this._extension = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
  }
  // webglコンテキスト
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
class ExpressionManager extends utils.EventEmitter {
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
    return utils.url.resolve(this.url, path);
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
var freeExports$1 = typeof exports == "object" && exports && !exports.nodeType && exports;
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
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
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
class MotionManager extends utils.EventEmitter {
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
class InternalModel extends utils.EventEmitter {
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
    __publicField(this, "localTransform", new Matrix());
    /**
     * The final matrix to draw the model.
     */
    __publicField(this, "drawingMatrix", new Matrix());
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
  if (Texture.fromURL) {
    return Texture.fromURL(url, textureOptions).catch((e) => {
      if (e instanceof Error) {
        throw e;
      }
      const err = new Error("Texture loading error");
      err.event = e;
      throw err;
    });
  }
  textureOptions.resourceOptions.autoLoad = false;
  const texture = Texture.from(url, textureOptions);
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
const setupEssentials = (context, next) => __async(void 0, null, function* () {
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
const _ZipLoader = class _ZipLoader {
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
        const actualPath = decodeURI(utils.url.resolve(settings.url, definedFile));
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
class Live2DTransform extends Transform {
}
const tempPoint = new Point();
const tempMatrix$1 = new Matrix();
class Live2DModel extends Container {
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
    __publicField(this, "anchor", new ObservablePoint(this.onAnchorChange, this, 0, 0));
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
    const internalTransform = tempMatrix$1.copyFrom(renderer.globalUniforms.uniforms.projectionMatrix).append(this.worldTransform);
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
if (!window.Live2DCubismCore) {
  throw new Error(
    "Could not find Cubism 4 runtime. This plugin requires live2dcubismcore.js to be loaded."
  );
}
class Cubism4ExpressionManager extends ExpressionManager {
  constructor(settings, options) {
    var _a;
    super(settings, options);
    __publicField(this, "queueManager", new CubismMotionQueueManager());
    __publicField(this, "definitions");
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
class Cubism4MotionManager extends MotionManager {
  constructor(settings, options) {
    var _a;
    super(settings, options);
    __publicField(this, "definitions");
    __publicField(this, "groups", { idle: "Idle" });
    __publicField(this, "motionDataType", "json");
    __publicField(this, "queueManager", new CubismMotionQueueManager());
    __publicField(this, "expressionManager");
    __publicField(this, "eyeBlinkIds");
    __publicField(this, "lipSyncIds", ["ParamMouthOpenY"]);
    this.definitions = (_a = settings.motions) != null ? _a : {};
    this.eyeBlinkIds = settings.getEyeBlinkParameters() || [];
    const lipSyncIds = settings.getLipSyncParameters();
    if (lipSyncIds == null ? void 0 : lipSyncIds.length) {
      this.lipSyncIds = lipSyncIds;
    }
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
    const defaultFadingDuration = (group === this.groups.idle ? config.idleMotionFadingDuration : config.motionFadingDuration) / 1e3;
    if (json.getMotionFadeInTime() === void 0) {
      motion.setFadeInTime(
        definition.FadeInTime > 0 ? definition.FadeInTime : defaultFadingDuration
      );
    }
    if (json.getMotionFadeOutTime() === void 0) {
      motion.setFadeOutTime(
        definition.FadeOutTime > 0 ? definition.FadeOutTime : defaultFadingDuration
      );
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
    __publicField(this, "settings");
    __publicField(this, "coreModel");
    __publicField(this, "motionManager");
    __publicField(this, "lipSync", true);
    __publicField(this, "breath", CubismBreath.create());
    __publicField(this, "eyeBlink");
    // what's this for?
    __publicField(this, "userData");
    __publicField(this, "renderer", new CubismRenderer_WebGL());
    __publicField(this, "idParamAngleX", ParamAngleX);
    __publicField(this, "idParamAngleY", ParamAngleY);
    __publicField(this, "idParamAngleZ", ParamAngleZ);
    __publicField(this, "idParamEyeBallX", ParamEyeBallX);
    __publicField(this, "idParamEyeBallY", ParamEyeBallY);
    __publicField(this, "idParamBodyAngleX", ParamBodyAngleX);
    __publicField(this, "idParamBreath", ParamBreath);
    __publicField(this, "idParamMouthForm", ParamMouthForm);
    /**
     * The model's internal scale, defined in the moc3 file.
     */
    __publicField(this, "pixelsPerUnit", 1);
    /**
     * Matrix that scales by {@link pixelsPerUnit}, and moves the origin from top-left to center.
     *
     * FIXME: This shouldn't be named as "centering"...
     */
    __publicField(this, "centeringTransform", new Matrix());
    this.coreModel = coreModel;
    this.settings = settings;
    this.motionManager = new Cubism4MotionManager(settings, options);
    this.init();
  }
  init() {
    var _a;
    super.init();
    if ((_a = this.settings.getEyeBlinkParameters()) == null ? void 0 : _a.length) {
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
    return [
      this.coreModel.getModel().canvasinfo.CanvasWidth,
      this.coreModel.getModel().canvasinfo.CanvasHeight
    ];
  }
  getLayout() {
    const layout = {};
    if (this.settings.layout) {
      for (const [key, value] of Object.entries(this.settings.layout)) {
        const commonKey = key.charAt(0).toLowerCase() + key.slice(1);
        layout[commonKey] = value;
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
    if (!this.renderer._clippingManager) {
      return;
    }
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
      const max_ = 1;
      const weight = 1.2;
      if (value > 0) {
        min_ = 0.4;
      }
      value = clamp(value * weight, min_, max_);
      for (let i = 0; i < this.motionManager.lipSyncIds.length; ++i) {
        model.addParameterValueById(this.motionManager.lipSyncIds[i], value, 0.8);
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
    this.coreModel.addParameterValueById(
      this.idParamAngleZ,
      this.focusController.x * this.focusController.y * -30
    );
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
class Cubism4ModelSettings extends ModelSettings {
  constructor(json) {
    super(json);
    __publicField(this, "moc");
    __publicField(this, "textures");
    if (!Cubism4ModelSettings.isValidJSON(json)) {
      throw new TypeError("Invalid JSON.");
    }
    Object.assign(this, new CubismModelSettingsJson(json));
  }
  static isValidJSON(json) {
    var _a;
    return !!(json == null ? void 0 : json.FileReferences) && typeof json.FileReferences.Moc === "string" && ((_a = json.FileReferences.Textures) == null ? void 0 : _a.length) > 0 && // textures must be an array of strings
    json.FileReferences.Textures.every((item) => typeof item === "string");
  }
  replaceFiles(replace) {
    super.replaceFiles(replace);
    if (this.motions) {
      for (const [group, motions] of Object.entries(this.motions)) {
        for (let i = 0; i < motions.length; i++) {
          motions[i].File = replace(motions[i].File, `motions.${group}[${i}].File`);
          if (motions[i].Sound !== void 0) {
            motions[i].Sound = replace(
              motions[i].Sound,
              `motions.${group}[${i}].Sound`
            );
          }
        }
      }
    }
    if (this.expressions) {
      for (let i = 0; i < this.expressions.length; i++) {
        this.expressions[i].File = replace(
          this.expressions[i].File,
          `expressions[${i}].File`
        );
      }
    }
  }
}
applyMixins(Cubism4ModelSettings, [CubismModelSettingsJson]);
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
  options = Object.assign(
    {
      logFunction: console.log,
      loggingLevel: LogLevel.LogLevel_Verbose
    },
    options
  );
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
  createCoreModel(data, options) {
    const moc = CubismMoc.create(data, !!(options == null ? void 0 : options.checkMocConsistency));
    try {
      const model = moc.createModel();
      model.__moc = moc;
      return model;
    } catch (e) {
      try {
        moc.release();
      } catch (e2) {
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
export {
  ACubismMotion,
  BreathParameterData,
  CSM_ASSERT,
  Constant,
  Cubism4ExpressionManager,
  Cubism4InternalModel,
  Cubism4ModelSettings,
  Cubism4MotionManager,
  CubismBlendMode,
  CubismBreath,
  CubismClippingContext,
  CubismClippingManager_WebGL,
  CubismConfig,
  CubismDebug,
  CubismExpressionMotion,
  CubismEyeBlink,
  CubismFramework,
  CubismLogDebug,
  CubismLogError,
  CubismLogInfo,
  CubismLogVerbose,
  CubismLogWarning,
  CubismMath,
  CubismMatrix44,
  CubismMoc,
  CubismModel,
  CubismModelSettingsJson,
  CubismModelUserData,
  CubismModelUserDataJson,
  CubismMotion,
  CubismMotionCurve,
  CubismMotionCurveTarget,
  CubismMotionData,
  CubismMotionEvent,
  CubismMotionJson,
  CubismMotionManager,
  CubismMotionPoint,
  CubismMotionQueueEntry,
  CubismMotionQueueManager,
  CubismMotionSegment,
  CubismMotionSegmentType,
  CubismPhysics,
  CubismPhysicsInput,
  CubismPhysicsJson,
  CubismPhysicsOutput,
  CubismPhysicsParticle,
  CubismPhysicsRig,
  CubismPhysicsSource,
  CubismPhysicsSubRig,
  CubismPhysicsTargetType,
  CubismPose,
  CubismRenderTextureResource,
  CubismRenderer,
  CubismRendererProfile_WebGL,
  CubismRenderer_WebGL,
  CubismShader_WebGL,
  CubismTextureColor,
  CubismVector2,
  DrawableColorData,
  DrawableCullingData,
  EvaluationOptionFlag,
  ExpressionBlendType,
  ExpressionManager,
  EyeState,
  FileLoader,
  FocusController,
  HitAreaBody,
  HitAreaHead,
  HitAreaPrefix,
  InternalModel,
  InvalidMotionQueueEntryHandleValue,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  Live2DFactory,
  Live2DLoader,
  Live2DModel,
  Live2DTransform,
  LogLevel,
  ModelSettings,
  MotionManager,
  MotionPreloadStrategy,
  MotionPriority,
  MotionState,
  Options,
  ParamAngleX,
  ParamAngleY,
  ParamAngleZ,
  ParamArmLA,
  ParamArmLB,
  ParamArmRA,
  ParamArmRB,
  ParamBaseX,
  ParamBaseY,
  ParamBodyAngleX,
  ParamBodyAngleY,
  ParamBodyAngleZ,
  ParamBreath,
  ParamBrowLAngle,
  ParamBrowLForm,
  ParamBrowLX,
  ParamBrowLY,
  ParamBrowRAngle,
  ParamBrowRForm,
  ParamBrowRX,
  ParamBrowRY,
  ParamBustX,
  ParamBustY,
  ParamCheek,
  ParamEyeBallForm,
  ParamEyeBallX,
  ParamEyeBallY,
  ParamEyeLOpen,
  ParamEyeLSmile,
  ParamEyeROpen,
  ParamEyeRSmile,
  ParamHairBack,
  ParamHairFluffy,
  ParamHairFront,
  ParamHairSide,
  ParamHandL,
  ParamHandR,
  ParamMouthForm,
  ParamMouthOpenY,
  ParamNONE,
  ParamShoulderY,
  PartColorData,
  PartData,
  PartsArmLPrefix,
  PartsArmPrefix,
  PartsArmRPrefix,
  PartsIdCore,
  PhysicsJsonEffectiveForces,
  PhysicsOutput,
  ShaderNames,
  SoundManager,
  VERSION,
  VOLUME,
  XHRLoader,
  ZipLoader,
  applyMixins,
  clamp,
  config,
  copyArray,
  copyProperty,
  csmRect,
  cubism4Ready,
  folderName,
  fragmentShaderSrcMaskInvertedPremultipliedAlpha,
  fragmentShaderSrcMaskPremultipliedAlpha,
  fragmentShaderSrcPremultipliedAlpha,
  fragmentShaderSrcsetupMask,
  logger,
  rand,
  remove,
  startUpCubism4,
  vertexShaderSrc,
  vertexShaderSrcMasked,
  vertexShaderSrcSetupMask
};
