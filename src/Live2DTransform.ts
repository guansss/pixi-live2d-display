import { Matrix, Transform } from '@pixi/math';
import { Live2DInternalModel, LOGICAL_HEIGHT, LOGICAL_WIDTH } from './live2d/Live2DInternalModel';

export default class Live2DTransform extends Transform {
    drawingMatrix = new Matrix();

    glWidth = -1;
    glHeight = -1;

    needsUpdate = false;

    constructor(readonly model: Live2DInternalModel) {
        super();
    }

    /** @override */
    updateTransform(parentTransform: Transform) {
        const lastWorldID = this._worldID;

        super.updateTransform(parentTransform);

        if (this._worldID !== lastWorldID) {
            this.needsUpdate = true;
        }
    }

    /**
     * Generates a matrix for Live2D model to draw.
     */
    getDrawingMatrix(gl: WebGLRenderingContext): Matrix {
        if (this.needsUpdate || this.glWidth !== gl.drawingBufferWidth || this.glHeight !== gl.drawingBufferHeight) {
            this.needsUpdate = false;

            this.glWidth = gl.drawingBufferWidth;
            this.glHeight = gl.drawingBufferHeight;

            this.drawingMatrix
                .copyFrom(this.worldTransform)

                // convert to Live2D coordinate
                .scale(LOGICAL_WIDTH / this.glWidth, LOGICAL_HEIGHT / this.glHeight)

                // move the Live2D origin from center to top-left
                .translate(-LOGICAL_WIDTH / 2, -LOGICAL_HEIGHT / 2)

                .append(this.model.matrix);
        }

        return this.drawingMatrix;
    }
}
