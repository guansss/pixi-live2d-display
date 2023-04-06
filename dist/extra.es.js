var __pow = Math.pow;
import { Graphics } from "@pixi/graphics";
import { TextStyle, Text } from "@pixi/text";
import { Rectangle } from "@pixi/math";
const tempBounds = new Rectangle();
class HitAreaFrames extends Graphics {
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
  _render(renderer) {
    const internalModel = this.parent.internalModel;
    const scale = 1 / Math.sqrt(__pow(this.transform.worldTransform.a, 2) + __pow(this.transform.worldTransform.b, 2));
    this.texts.forEach((text) => {
      this.lineStyle({
        width: this.strokeWidth * scale,
        color: text.visible ? this.activeColor : this.normalColor
      });
      const bounds = internalModel.getDrawableBounds(internalModel.hitAreas[text.text].index, tempBounds);
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
export { HitAreaFrames };
