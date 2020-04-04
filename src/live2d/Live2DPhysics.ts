interface PhysicsHairDefinition {
    label: string;
    setup: {
        length: number;
        regist: number;
        mass: number;
    };
    src: {
        id: string;
        ptype: string;
        scale: number;
        weight: number;
    }[];
    targets: {
        id: string;
        ptype: string;
        scale: number;
        weight: number;
    }[];
}

const SRC_TYPE_MAP = {
    x: PhysicsHair.Src.SRC_TO_X,
    y: PhysicsHair.Src.SRC_TO_Y,
    angle: PhysicsHair.Src.SRC_TO_G_ANGLE,
} as {
    [key: string]: string;
};

const TARGET_TYPE_MAP = {
    x: PhysicsHair.Src.SRC_TO_X,
    y: PhysicsHair.Src.SRC_TO_Y,
    angle: PhysicsHair.Src.SRC_TO_G_ANGLE,
} as {
    [key: string]: string;
};

export class Live2DPhysics {
    physicsHairs: PhysicsHair[] = [];

    constructor(readonly coreModel: Live2DModelWebGL, json: any) {
        if (json['physics_hair']) {
            this.physicsHairs = (json['physics_hair'] as PhysicsHairDefinition[]).map(definition => {
                const physicsHair = new PhysicsHair();

                physicsHair.setup(definition.setup.length, definition.setup.regist, definition.setup.mass);

                definition.src.forEach(({ id, ptype, scale, weight }) => {
                    const type = SRC_TYPE_MAP[ptype];

                    if (type) {
                        physicsHair.addSrcParam(type, id, scale, weight);
                    }
                });

                definition.targets.forEach(({ id, ptype, scale, weight }) => {
                    const type = TARGET_TYPE_MAP[ptype];

                    if (type) {
                        physicsHair.addTargetParam(type, id, scale, weight);
                    }
                });

                return physicsHair;
            });
        }
    }

    update(elapsed: DOMHighResTimeStamp) {
        this.physicsHairs.forEach(physicsHair => physicsHair.update(this.coreModel, elapsed));
    }
}
