/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { Live2DCubismFramework as cubismvector2 } from './cubismvector2';
import CubismVector2 = cubismvector2.CubismVector2;

export namespace Live2DCubismFramework {
  /**
   * 数値計算などに使用するユーティリティクラス
   */
  export class CubismMath {
    /**
     * 第一引数の値を最小値と最大値の範囲に収めた値を返す
     *
     * @param value 収められる値
     * @param min   範囲の最小値
     * @param max   範囲の最大値
     * @return 最小値と最大値の範囲に収めた値
     */
    static range(value: number, min: number, max: number): number {
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
    static sin(x: number): number {
      return Math.sin(x);
    }

    /**
     * コサイン関数の値を求める
     *
     * @param x 角度値(ラジアン)
     * @return コサイン関数cos(x)の値
     */
    static cos(x: number): number {
      return Math.cos(x);
    }

    /**
     * 値の絶対値を求める
     *
     * @param x 絶対値を求める値
     * @return 値の絶対値
     */
    static abs(x: number): number {
      return Math.abs(x);
    }

    /**
     * 平方根(ルート)を求める
     * @param x -> 平方根を求める値
     * @return 値の平方根
     */
    static sqrt(x: number): number {
      return Math.sqrt(x);
    }

    /**
     * イージング処理されたサインを求める
     * フェードイン・アウト時のイージングに利用できる
     *
     * @param value イージングを行う値
     * @return イージング処理されたサイン値
     */
    static getEasingSine(value: number): number {
      if (value < 0.0) {
        return 0.0;
      } else if (value > 1.0) {
        return 1.0;
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
    static max(left: number, right: number): number {
      return left > right ? left : right;
    }

    /**
     * 小さい方の値を返す
     *
     * @param left  左辺の値
     * @param right 右辺の値
     * @return 小さい方の値
     */
    static min(left: number, right: number): number {
      return left > right ? right : left;
    }

    /**
     * 角度値をラジアン値に変換する
     *
     * @param degrees   角度値
     * @return 角度値から変換したラジアン値
     */
    static degreesToRadian(degrees: number): number {
      return (degrees / 180.0) * Math.PI;
    }

    /**
     * ラジアン値を角度値に変換する
     *
     * @param radian    ラジアン値
     * @return ラジアン値から変換した角度値
     */
    static radianToDegrees(radian: number): number {
      return (radian * 180.0) / Math.PI;
    }

    /**
     * ２つのベクトルからラジアン値を求める
     *
     * @param from  始点ベクトル
     * @param to    終点ベクトル
     * @return ラジアン値から求めた方向ベクトル
     */
    static directionToRadian(from: CubismVector2, to: CubismVector2): number {
      const q1: number = Math.atan2(to.y, to.x);
      const q2: number = Math.atan2(from.y, from.x);

      let ret: number = q1 - q2;

      while (ret < -Math.PI) {
        ret += Math.PI * 2.0;
      }

      while (ret > Math.PI) {
        ret -= Math.PI * 2.0;
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
    static directionToDegrees(from: CubismVector2, to: CubismVector2): number {
      const radian: number = this.directionToRadian(from, to);
      let degree: number = this.radianToDegrees(radian);

      if (to.x - from.x > 0.0) {
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

    static radianToDirection(totalAngle: number): CubismVector2 {
      const ret: CubismVector2 = new CubismVector2();

      ret.x = this.sin(totalAngle);
      ret.y = this.cos(totalAngle);

      return ret;
    }

    /**
     * コンストラクタ
     */
    private constructor() {}
  }
}
