import { Matrix, Transform } from '@pixi/math';
import { Live2DInternalModel, LOGICAL_HEIGHT, LOGICAL_WIDTH } from './live2d';

/**
 * Provides the ability to generate a matrix for Live2D model to draw.
 */
export class Live2DTransform extends Transform {

    /**
     * Cached drawing matrix, pretty performant!
     */
    drawingMatrix = new Matrix();

    /**
     * Stored width of GL context, used to check if its size has changed.
     */
    glWidth = -1;

    /**
     * Stored width of GL context, used to check if its size has changed.
     */
    glHeight = -1;

    /**
     * The drawing matrix will be updated only when needed.
     */
    needsUpdate = true;

    constructor(readonly model: Live2DInternalModel) {
        super();
    }

    /** @override */
    updateTransform(parentTransform: Transform): void {
        const lastWorldID = this._worldID;

        super.updateTransform(parentTransform);

        if (this._worldID !== lastWorldID) {
            this.needsUpdate = true;
        }
    }

    /**
     * Gets a drawing matrix for Live2D model.
     * @param gl
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
