import { Live2DModel } from '@/Live2DModel';
import { Renderer } from '@pixi/core';
import { Graphics } from '@pixi/graphics';
import { InteractionEvent } from '@pixi/interaction';
import { Text, TextStyle } from '@pixi/text';

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

        const scale = 1 / this.transform.worldTransform.a;

        this.texts.forEach(text => {
            this.lineStyle(
                this.strokeWidth * scale,
                text.visible ? this.activeColor : this.normalColor,
                1,
            );

            const bounds = internalModel.getHitArea(text.text);
            const transform = internalModel.localTransform;

            bounds.left = bounds.left * transform.a + transform.tx;
            bounds.right = bounds.right * transform.a + transform.tx;
            bounds.top = bounds.top * transform.d + transform.ty;
            bounds.bottom = bounds.bottom * transform.d + transform.ty;

            this.moveTo(bounds.left, bounds.top);
            this.lineTo(bounds.right, bounds.top);
            this.lineTo(bounds.right, bounds.bottom);
            this.lineTo(bounds.left, bounds.bottom);
            this.lineTo(bounds.left, bounds.top);
            this.closePath();

            text.x = bounds.left + this.strokeWidth;
            text.y = bounds.top + this.strokeWidth;
            text.scale.set(scale);
        });

        super._render(renderer);

        this.clear();
    }
}
