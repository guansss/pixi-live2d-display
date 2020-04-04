import { cloneWithCamelCase } from '../utils';

const enum ParamCalcType {
    Set = 'set',
    Add = 'add',
    Mult = 'mult',
}

interface Param {
    id: number;
    value: number;
    type: ParamCalcType;
}

const DEFAULT_FADING_DURATION = 500;

export class Live2DExpression extends AMotion {
    readonly params: Param[] = [];

    constructor(readonly coreModel: Live2DModelWebGL, json: object, readonly name?: string) {
        super();

        this.load(cloneWithCamelCase(json));
    }

    private load(json: any) {
        this.setFadeIn(json.fadeIn > 0 ? json.fadeIn : DEFAULT_FADING_DURATION);
        this.setFadeOut(json.fadeOut > 0 ? json.fadeOut : DEFAULT_FADING_DURATION);

        if (Array.isArray(json.params)) {
            json.params.forEach((paramDef: any) => {
                let value = parseFloat(paramDef.val);

                if (!paramDef.id || !value) {
                    // skip if missing essential properties
                    return;
                }

                const id = this.coreModel.getParamIndex(paramDef.id);
                const type = paramDef.calc || ParamCalcType.Add;

                if (type === ParamCalcType.Add) {
                    const defaultValue = parseFloat(paramDef.def) || 0;
                    value -= defaultValue;
                } else if (type === ParamCalcType.Mult) {
                    const defaultValue = parseFloat(paramDef.def) || 1;
                    value /= defaultValue;
                }

                this.params.push({ id, value, type });
            });
        }
    }

    /** @override */
    updateParamExe(model: Live2DModelWebGL, time: DOMTimeStamp, weight: number, motionQueueEnt: unknown) {
        this.params.forEach(param => {
            // this algorithm seems to be broken for newer Neptunia series models, have no idea
            //
            // switch (param.type) {
            //     case ParamCalcType.Set:
            //         model.setParamFloat(param.id, param.value, weight);
            //         break;
            //     case ParamCalcType.Add:
            //         model.addToParamFloat(param.id, param.value * weight);
            //         break;
            //     case ParamCalcType.Mult:
            //         model.multParamFloat(param.id, param.value, weight);
            //         break;
            // }

            // this works fine for any model
            model.setParamFloat(param.id, param.value * weight);
        });
    }
}
