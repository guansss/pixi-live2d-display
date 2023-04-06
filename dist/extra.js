var __pow = Math.pow;
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("@pixi/graphics"), require("@pixi/text"), require("@pixi/math")) : typeof define === "function" && define.amd ? define(["exports", "@pixi/graphics", "@pixi/text", "@pixi/math"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.PIXI = global.PIXI || {}, global.PIXI.live2d = global.PIXI.live2d || {}), global.PIXI, global.PIXI, global.PIXI));
})(this, function(exports2, graphics, text, math) {
  "use strict";
  const tempBounds = new math.Rectangle();
  class HitAreaFrames extends graphics.Graphics {
    constructor() {
      super();
      this.initialized = false;
      this.texts = [];
      this.strokeWidth = 4;
      this.normalColor = 14883354;
      this.activeColor = 2017330;
      this.interactive = true;
      this.on("added", this.init).on("pointermove", this.onPointerMove);
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
    _render(renderer) {
      const internalModel = this.parent.internalModel;
      const scale = 1 / Math.sqrt(__pow(this.transform.worldTransform.a, 2) + __pow(this.transform.worldTransform.b, 2));
      this.texts.forEach((text2) => {
        this.lineStyle({
          width: this.strokeWidth * scale,
          color: text2.visible ? this.activeColor : this.normalColor
        });
        const bounds = internalModel.getDrawableBounds(internalModel.hitAreas[text2.text].index, tempBounds);
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
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
