import { clamp } from '../utils';

interface PartsDefinition {
    group: {
        id: string;
        link?: string[];
    }[];
}

class Live2DPartsParam {
    paramIndex = -1;
    partsIndex = -1;
    link: Live2DPartsParam[] = [];

    constructor(readonly id: string) {}

    initIndex(model: Live2DModelWebGL) {
        this.paramIndex = model.getParamIndex('VISIBLE:' + this.id);
        this.partsIndex = model.getPartsDataIndex(PartsDataID.getID(this.id));
        model.setParamFloat(this.paramIndex, 1);
    }
}

export class Live2DPose {
    opacityAnimDuration: DOMHighResTimeStamp = 500;

    partsGroups: Live2DPartsParam[][] = [];

    constructor(readonly coreModel: Live2DModelWebGL, json: any) {
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
                parts.initIndex(this.coreModel);

                if (parts.paramIndex >= 0) {
                    const visible = this.coreModel.getParamFloat(parts.paramIndex) !== 0;
                    this.coreModel.setPartsOpacity(parts.partsIndex, visible ? 1 : 0);
                    this.coreModel.setParamFloat(parts.paramIndex, visible ? 1 : 0);

                    if (parts.link.length > 0) {
                        parts.link.forEach(p => p.initIndex(this.coreModel));
                    }
                }
            });
        });
    }

    normalizePartsOpacityGroup(partsGroup: Live2DPartsParam[], dt: DOMHighResTimeStamp) {
        const model = this.coreModel;
        const phi = 0.5;
        const maxBackOpacity = 0.15;
        let visibleOpacity = 1;

        let visibleIndex = partsGroup.findIndex(
            ({ paramIndex, partsIndex }) => partsIndex >= 0 && model.getParamFloat(paramIndex) !== 0,
        );

        if (visibleIndex >= 0) {
            const parts = partsGroup[visibleIndex];
            const originalOpacity = model.getPartsOpacity(parts.partsIndex);

            visibleOpacity = clamp(originalOpacity + dt / this.opacityAnimDuration, 0, 1);
        } else {
            visibleIndex = 0;
            visibleOpacity = 1;
        }

        partsGroup.forEach(({ partsIndex }, index) => {
            if (partsIndex >= 0) {
                if (visibleIndex == index) {
                    model.setPartsOpacity(partsIndex, visibleOpacity);
                } else {
                    let opacity = model.getPartsOpacity(partsIndex);

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

                    model.setPartsOpacity(partsIndex, opacity);
                }
            }
        });
    }

    copyOpacity(partsGroup: Live2DPartsParam[]) {
        const model = this.coreModel;

        partsGroup.forEach(({ partsIndex, link }) => {
            if (partsIndex >= 0 && link) {
                const opacity = model.getPartsOpacity(partsIndex);

                link.forEach(({ partsIndex }) => {
                    if (partsIndex >= 0) {
                        model.setPartsOpacity(partsIndex, opacity);
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
