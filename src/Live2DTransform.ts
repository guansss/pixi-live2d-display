import { InternalModel } from '@/cubism-common/InternalModel';
import { Matrix, Transform } from '@pixi/math';

const tempMatrix = new Matrix();

/**
 * Provides the ability to generate a matrix for Live2D model to draw.
 */
export class Live2DTransform extends Transform {
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
     * @param internalModel
     * @param projectionMatrix
     */
    applyTransform(internalModel: InternalModel, projectionMatrix: Matrix): void {
        tempMatrix.copyFrom(projectionMatrix).append(this.worldTransform);

        internalModel.updateTransform(tempMatrix);
    }
}
