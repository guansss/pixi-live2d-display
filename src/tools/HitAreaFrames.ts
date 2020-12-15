import { Live2DModel } from '@/Live2DModel';
import { Renderer } from '@pixi/core';
import { Graphics } from '@pixi/graphics';

export class HitAreaFrames extends Graphics {

    /** @override */
    protected _render(renderer: Renderer): void {
        const internalModel = (this.parent as Live2DModel)?.internalModel;

        if (internalModel) {
            this.lineStyle(8, 0xFF0000, 1);

            Object.keys(internalModel.hitAreas).forEach(name => {
                const bounds = internalModel.getHitArea(name);

                bounds.left = (bounds.left + internalModel.matrix.tx) * internalModel.matrix.a;
                bounds.right = (bounds.right + internalModel.matrix.tx) * internalModel.matrix.a;
                bounds.top = (bounds.top + internalModel.matrix.ty) * internalModel.matrix.d;
                bounds.bottom = (bounds.bottom + internalModel.matrix.ty) * internalModel.matrix.d;

                this.moveTo(bounds.left, bounds.top);
                this.lineTo(bounds.right, bounds.top);
                this.lineTo(bounds.right, bounds.bottom);
                this.lineTo(bounds.left, bounds.bottom);
                this.lineTo(bounds.left, bounds.top);
            });

            super._render(renderer);

            this.clear();
        }
    }
}
