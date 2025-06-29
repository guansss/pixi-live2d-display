(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("@pixi/core"), require("@pixi/graphics"), require("@pixi/text")) : typeof define === "function" && define.amd ? define(["exports", "@pixi/core", "@pixi/graphics", "@pixi/text"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.PIXI = global.PIXI || {}, global.PIXI.live2d = global.PIXI.live2d || {}), global.PIXI, global.PIXI, global.PIXI));
})(this, function(exports2, core, graphics, text) {
  "use strict";var __defProp = Object.defineProperty;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

  const tempBounds = new core.Rectangle();
  class HitAreaFrames extends graphics.Graphics {
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
      const textStyle = new text.TextStyle({
        fontSize: 24,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      });
      this.texts = Object.keys(internalModel.hitAreas).map((hitAreaName) => {
        const text$1 = new text.Text(hitAreaName, textStyle);
        text$1.visible = false;
        this.addChild(text$1);
        return text$1;
      });
    }
    onPointerMove(e) {
      const hitAreaNames = this.parent.hitTest(e.data.global.x, e.data.global.y);
      this.texts.forEach((text2) => {
        text2.visible = hitAreaNames.includes(text2.text);
      });
    }
    /** @override */
    _render(renderer) {
      const internalModel = this.parent.internalModel;
      const scale = 1 / Math.sqrt(__pow(this.transform.worldTransform.a, 2) + __pow(this.transform.worldTransform.b, 2));
      this.texts.forEach((text2) => {
        this.lineStyle({
          width: this.strokeWidth * scale,
          color: text2.visible ? this.activeColor : this.normalColor
        });
        const bounds = internalModel.getDrawableBounds(
          internalModel.hitAreas[text2.text].index,
          tempBounds
        );
        const transform = internalModel.localTransform;
        bounds.x = bounds.x * transform.a + transform.tx;
        bounds.y = bounds.y * transform.d + transform.ty;
        bounds.width = bounds.width * transform.a;
        bounds.height = bounds.height * transform.d;
        this.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
        text2.x = bounds.x + this.strokeWidth * scale;
        text2.y = bounds.y + this.strokeWidth * scale;
        text2.scale.set(scale);
      });
      super._render(renderer);
      this.clear();
    }
  }
  exports2.HitAreaFrames = HitAreaFrames;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
