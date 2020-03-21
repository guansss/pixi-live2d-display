import clamp from 'lodash/clamp';

interface PartsDefinition {
    group: {
        id: string;
        link?: string[];
    }[];
}

class Live2DPartsParam {
    readonly id: string;

    paramIndex = -1;
    partsIndex = -1;
    link: Live2DPartsParam[] = [];

    constructor(id: string) {
        this.id = id;
    }

    initIndex(internalModel: Live2DModelWebGL) {
        this.paramIndex = internalModel.getParamIndex('VISIBLE:' + this.id);
        this.partsIndex = internalModel.getPartsDataIndex(PartsDataID.getID(this.id));
        internalModel.setParamFloat(this.paramIndex, 1);
    }
}

export default class Live2DPose {
    readonly internalModel: Live2DModelWebGL;

    opacityAnimDuration: DOMHighResTimeStamp = 500;

    partsGroups: Live2DPartsParam[][] = [];

    constructor(internalModel: Live2DModelWebGL, json: any) {
        this.internalModel = internalModel;

        if (json['parts_visible']) {
            this.partsGroups = (json['parts_visible'] as PartsDefinition[]).map(({ group }) =>
                group.map(({ id, link }) => {
                    const parts = new Live2DPartsParam(id);

                    if (link) {
                        parts.link = link.map(l => new Live2DPartsParam(l));
                    }

                    return parts;
                }),
            );

            this.init();
        }
    }

    init() {
        this.partsGroups.forEach(group => {
            group.forEach(parts => {
                parts.initIndex(this.internalModel);

                if (parts.paramIndex >= 0) {
                    const visible = this.internalModel.getParamFloat(parts.paramIndex) !== 0;
                    this.internalModel.setPartsOpacity(parts.partsIndex, visible ? 1 : 0);
                    this.internalModel.setParamFloat(parts.paramIndex, visible ? 1 : 0);

                    if (parts.link.length > 0) {
                        parts.link.forEach(p => p.initIndex(this.internalModel));
                    }
                }
            });
        });
    }

    normalizePartsOpacityGroup(partsGroup: Live2DPartsParam[], dt: DOMHighResTimeStamp) {
        const internalModel = this.internalModel;
        const phi = 0.5;
        const maxBackOpacity = 0.15;
        let visibleOpacity = 1;

        let visibleIndex = partsGroup.findIndex(
            ({ paramIndex, partsIndex }) => partsIndex >= 0 && internalModel.getParamFloat(paramIndex) !== 0,
        );

        if (visibleIndex >= 0) {
            const parts = partsGroup[visibleIndex];
            const originalOpacity = internalModel.getPartsOpacity(parts.partsIndex);

            visibleOpacity = clamp(originalOpacity + dt / this.opacityAnimDuration, 0, 1);
        } else {
            visibleIndex = 0;
            visibleOpacity = 1;
        }

        partsGroup.forEach(({ partsIndex }, index) => {
            if (partsIndex >= 0) {
                if (visibleIndex == index) {
                    internalModel.setPartsOpacity(partsIndex, visibleOpacity);
                } else {
                    let opacity = internalModel.getPartsOpacity(partsIndex);

                    // I can't understand this part, so just leave it original
                    let a1;
                    if (visibleOpacity < phi) {
                        a1 = (visibleOpacity * (phi - 1)) / phi + 1;
                    } else {
                        a1 = ((1 - visibleOpacity) * phi) / (1 - phi);
                    }
                    let backOp = (1 - a1) * (1 - visibleOpacity);
                    if (backOp > maxBackOpacity) {
                        a1 = 1 - maxBackOpacity / (1 - visibleOpacity);
                    }
                    if (opacity > a1) {
                        opacity = a1;
                    }

                    internalModel.setPartsOpacity(partsIndex, opacity);
                }
            }
        });
    }

    copyOpacity(partsGroup: Live2DPartsParam[]) {
        const internalModel = this.internalModel;

        partsGroup.forEach(({ partsIndex, link }) => {
            if (partsIndex >= 0 && link) {
                const opacity = internalModel.getPartsOpacity(partsIndex);

                link.forEach(({ partsIndex }) => {
                    if (partsIndex >= 0) {
                        internalModel.setPartsOpacity(partsIndex, opacity);
                    }
                });
            }
        });
    }

    update(dt: DOMHighResTimeStamp) {
        this.partsGroups.forEach(partGroup => {
            this.normalizePartsOpacityGroup(partGroup, dt);
            this.copyOpacity(partGroup);
        });
    }
}
