var __defProp = Object.defineProperty;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Rectangle } from "@pixi/core";
import { Graphics } from "@pixi/graphics";
import { TextStyle, Text } from "@pixi/text";
const tempBounds = new Rectangle();
class HitAreaFrames extends Graphics {
  constructor() {
    super();
    __publicField(this, "initialized", false);
    __publicField(this, "texts", []);
    __publicField(this, "strokeWidth", 4);
    __publicField(this, "normalColor", 14883354);
    __publicField(this, "activeColor", 2017330);
    this.eventMode = "static";
    this.on("added", this.init).on("globalpointermove", this.onPointerMove);
  }
  init() {
    const internalModel = this.parent.internalModel;
    const textStyle = new TextStyle({
      fontSize: 24,
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    });
    this.texts = Object.keys(internalModel.hitAreas).map((hitAreaName) => {
      const text = new Text(hitAreaName, textStyle);
      text.visible = false;
      this.addChild(text);
      return text;
    });
  }
  onPointerMove(e) {
    const hitAreaNames = this.parent.hitTest(e.data.global.x, e.data.global.y);
    this.texts.forEach((text) => {
      text.visible = hitAreaNames.includes(text.text);
    });
  }
  /** @override */
  _render(renderer) {
    const internalModel = this.parent.internalModel;
    const scale = 1 / Math.sqrt(__pow(this.transform.worldTransform.a, 2) + __pow(this.transform.worldTransform.b, 2));
    this.texts.forEach((text) => {
      this.lineStyle({
        width: this.strokeWidth * scale,
        color: text.visible ? this.activeColor : this.normalColor
      });
      const bounds = internalModel.getDrawableBounds(
        internalModel.hitAreas[text.text].index,
        tempBounds
      );
      const transform = internalModel.localTransform;
      bounds.x = bounds.x * transform.a + transform.tx;
      bounds.y = bounds.y * transform.d + transform.ty;
      bounds.width = bounds.width * transform.a;
      bounds.height = bounds.height * transform.d;
      this.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
      text.x = bounds.x + this.strokeWidth * scale;
      text.y = bounds.y + this.strokeWidth * scale;
      text.scale.set(scale);
    });
    super._render(renderer);
    this.clear();
  }
}
export {
  HitAreaFrames
};
