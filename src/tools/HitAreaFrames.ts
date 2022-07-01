import { Live2DModel } from '@/Live2DModel';
import { Renderer } from '@pixi/core';
import { Graphics } from '@pixi/graphics';
import { InteractionEvent } from '@pixi/interaction';
import { Text, TextStyle } from '@pixi/text';
import { Rectangle } from '@pixi/math';

const tempBounds = new Rectangle();

export class HitAreaFrames extends Graphics {
    initialized = false;

    texts: Text[] = [];

    strokeWidth = 4;
    normalColor = 0xE31A1A;
    activeColor = 0x1EC832;

    constructor() {
        super();

        this.interactive = true;

        this.on('added', this.init).on('pointermove', this.onPointerMove);
    }

    init() {
        const internalModel = (this.parent as Live2DModel).internalModel;

        const textStyle = new TextStyle({
            fontSize: 24,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        });

        this.texts = Object.keys(internalModel.hitAreas).map(hitAreaName => {
            const text = new Text(hitAreaName, textStyle);

            text.visible = false;

            this.addChild(text);

            return text;
        });
    }

    onPointerMove(e: InteractionEvent) {
        const hitAreaNames = (this.parent as Live2DModel).hitTest(e.data.global.x, e.data.global.y);

        this.texts.forEach(text => {
            text.visible = hitAreaNames.includes(text.text);
        });
    }

    /** @override */
    protected _render(renderer: Renderer): void {
        const internalModel = (this.parent as Live2DModel).internalModel;

        // extract scale from the transform matrix, and invert it to ease following calculation
        // https://math.stackexchange.com/a/13165
        const scale = 1 / Math.sqrt(this.transform.worldTransform.a ** 2 + this.transform.worldTransform.b ** 2);

        this.texts.forEach(text => {
            this.lineStyle({
                width: this.strokeWidth * scale,
                color: text.visible ? this.activeColor : this.normalColor,
            });

            const bounds = internalModel.getDrawableBounds(internalModel.hitAreas[text.text]!.index, tempBounds);
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
