import { EXPRESSION_FADING_DURATION } from '@/cubism-common/constants';

const enum ParamCalcType {
    Set = 'set',
    Add = 'add',
    Mult = 'mult',
}

interface Param {
    id: string;
    value: number;
    type: ParamCalcType;
}

export class Live2DExpression extends AMotion {
    readonly params: Param[] = [];

    constructor(json: JSONObject) {
        super();

        const fadeInTime = json.fade_in as number | undefined;
        const fadeOutTime = json.fade_out as number | undefined;

        this.setFadeIn(fadeInTime! > 0 ? fadeInTime! : EXPRESSION_FADING_DURATION);
        this.setFadeOut(fadeOutTime! > 0 ? fadeOutTime! : EXPRESSION_FADING_DURATION);

        if (Array.isArray(json.params)) {
            (json.params as JSONObject[]).forEach((paramDef: JSONObject) => {
                let value = parseFloat(paramDef.val as string);

                if (!paramDef.id || !value) {
                    // skip if missing essential properties
                    return;
                }

                const type = (paramDef.calc || ParamCalcType.Add) as ParamCalcType;

                if (type === ParamCalcType.Add) {
                    const defaultValue = parseFloat(paramDef.def as string) || 0;
                    value -= defaultValue;
                } else if (type === ParamCalcType.Mult) {
                    const defaultValue = parseFloat(paramDef.def as string) || 1;
                    value /= defaultValue;
                }

                this.params.push({
                    value,
                    type,
                    id: paramDef.id as string,
                });
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
