import { MotionManagerOptions } from '@/cubism-common';
import { InternalModel, HitAreaDef, LayoutDef } from '@/cubism-common/InternalModel';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { Cubism4MotionManager } from '@/cubism4/Cubism4MotionManager';
import {
    ParamAngleX,
    ParamAngleY,
    ParamAngleZ,
    ParamBodyAngleX,
    ParamBreath,
    ParamEyeBallX,
    ParamEyeBallY,
} from '@cubism/cubismdefaultparameterid';
import { BreathParameterData, CubismBreath } from '@cubism/effect/cubismbreath';
import { CubismEyeBlink } from '@cubism/effect/cubismeyeblink';
import { CubismPose } from '@cubism/effect/cubismpose';
import { CubismMatrix44 } from '@cubism/math/cubismmatrix44';
import { CubismModel } from '@cubism/model/cubismmodel';
import { CubismModelUserData } from '@cubism/model/cubismmodeluserdata';
import { CubismPhysics } from '@cubism/physics/cubismphysics';
import { CubismRenderer_WebGL, CubismShader_WebGL } from '@cubism/rendering/cubismrenderer_webgl';
import { Matrix } from '@pixi/math';

const tempMatrix = new CubismMatrix44();

export class Cubism4InternalModel extends InternalModel<CubismModel, Cubism4ModelSettings, Cubism4MotionManager> {
    lipSync = true;

    breath = CubismBreath.create();
    eyeBlink?: CubismEyeBlink;
    pose?: CubismPose;
    physics?: CubismPhysics;

    // what's this for?
    userData?: CubismModelUserData;

    renderer = new CubismRenderer_WebGL();

    idParamAngleX = ParamAngleX;
    idParamAngleY = ParamAngleY;
    idParamAngleZ = ParamAngleZ;
    idParamEyeBallX = ParamEyeBallX;
    idParamEyeBallY = ParamEyeBallY;
    idParamBodyAngleX = ParamBodyAngleX;
    idParamBreath = ParamBreath;

    constructor(model: CubismModel, modelSettings: Cubism4ModelSettings, options?: MotionManagerOptions) {
        super(model, modelSettings, new Cubism4MotionManager(modelSettings, options));

        this.setup();
    }

    protected setup() {
        const settings = this.settings;

        if (settings.getEyeBlinkParameters()?.length! > 0) {
            this.eyeBlink = CubismEyeBlink.create(settings);
        }

        this.breath.setParameters([
            new BreathParameterData(this.idParamAngleX, 0.0, 15.0, 6.5345, 0.5),
            new BreathParameterData(this.idParamAngleY, 0.0, 8.0, 3.5345, 0.5),
            new BreathParameterData(this.idParamAngleZ, 0.0, 10.0, 5.5345, 0.5),
            new BreathParameterData(this.idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5),
            new BreathParameterData(this.idParamBreath, 0.0, 0.5, 3.2345, 0.5),
        ]);

        this.renderer.initialize(this.coreModel);
        this.renderer.setIsPremultipliedAlpha(true);
    }

    protected getSize(): [width: number, height: number] {
        return [this.coreModel.getCanvasWidth(), this.coreModel.getCanvasHeight()];
    }

    protected getLayout(): LayoutDef {
        const layout = this.settings.layout || {};

        return {
            centerX: layout.CenterX,
            centerY: layout.CenterY,
            x: layout.X,
            y: layout.Y,
            width: layout.Width,
            height: layout.Height,
        };
    }

    updateWebGLContext(gl: WebGLRenderingContext, glContextID: number): void {
        this.renderer._clippingManager.setGL(gl);
        CubismShader_WebGL.getInstance().setGl(gl);
    }

    /** @override */
    bindTexture(index: number, texture: WebGLTexture): void {
        this.renderer.bindTexture(index, texture);
    }

    protected getHitAreaDefs(): HitAreaDef[] {
        return this.settings.hitAreas?.map(hitArea => ({
            id: hitArea.Id,
            name: hitArea.Name,
            index: this.coreModel.getDrawableIndex(hitArea.Id),
        })) ?? [];
    }

    getHitArea(drawIndex: number): ArrayLike<number> {
        return this.coreModel.getDrawableVertices(drawIndex).slice(0, this.coreModel.getDrawableVertexCount(drawIndex));
    }

    public update(dt: DOMHighResTimeStamp, now: DOMHighResTimeStamp): void {
        const model = this.coreModel;

        model.loadParameters();

        let motionUpdated = this.motionManager.update(this.coreModel, now);

        model.saveParameters();

        if (!motionUpdated) {
            this.eyeBlink?.updateParameters(model, dt);
        }

        model.addParameterValueById(this.idParamAngleX, this.focusController.x * 30); // -30 ~ 30
        model.addParameterValueById(this.idParamAngleY, this.focusController.y * 30);
        model.addParameterValueById(this.idParamAngleZ, this.focusController.x * this.focusController.y * -30);
        model.addParameterValueById(this.idParamBodyAngleX, this.focusController.x * 10); // -10 ~ 10
        model.addParameterValueById(this.idParamEyeBallX, this.focusController.x); // -1 ~ 1
        model.addParameterValueById(this.idParamEyeBallY, this.focusController.y);

        this.breath?.updateParameters(model, dt);
        this.physics?.evaluate(model, dt);

        // TODO: Add lip sync API
        // if (this.lipSync) {
        //     const value = 0; // 0 ~ 1
        //
        //     for (let i = 0; i < this.lipSyncIds.length; ++i) {
        //         model.addParameterValueById(this.lipSyncIds[i], value, 0.8);
        //     }
        // }

        this.pose?.updateParameters(model, dt);

        model.update();
    }

    public draw(matrix: Matrix): void {
        const array = tempMatrix.getArray();

        // set given 3x3 matrix into a 4x4 matrix, with Y inverted
        array[0] = matrix.a;
        array[1] = -matrix.c;
        array[4] = matrix.b;
        array[5] = -matrix.d;
        array[12] = matrix.tx;
        array[13] = -matrix.ty;

        this.renderer.setMvpMatrix(tempMatrix);

        // TODO: figure out if null is really a valid argument
        this.renderer.setRenderState(null as any, [0, 0, innerWidth, innerHeight]);
        this.renderer.drawModel();
    }
}
