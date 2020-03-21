import { cloneWithCamelCase } from '@/core/utils/misc';
import { LIVE2D_DIRECTORY } from '@/defaults';
import get from 'lodash/get';
import set from 'lodash/set';
import { basename, dirname } from 'path';
import { resolve as urlResolve } from 'url';

export interface Layout {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    centerX?: number;
    centerY?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

export interface MotionDefinition {
    readonly name?: string;

    /** `*.mtn` file. */
    readonly file: string;

    /** Sound file. */
    readonly sound?: string;

    /** Subtitle name. */
    readonly subtitle?: string;

    /** Motion fade-in timeout. */
    readonly fadeIn?: number;

    /** Motion fade-out timeout. */
    readonly fadeOut?: number;

    /** Start time in hours (for start-up motions only). */
    readonly time?: number;

    /** Used by greeting. */
    readonly season?: string;
}

export interface ExpressionDefinition {
    readonly name: string;

    /** `*.json` file. */
    readonly file: string;
}

export default class ModelSettings {
    readonly name?: string;

    // files
    readonly model: string = '';
    readonly preview?: string;
    readonly pose?: string;
    readonly physics?: string;
    readonly subtitle?: string;
    readonly textures: string[] = [];

    // metadata
    readonly layout?: Layout;
    readonly hitAreas?: { name: string; id: string }[];
    readonly initParams?: [{ id: string; value: number }];
    readonly initOpacities?: [{ id: string; value: number }];

    // motions
    readonly expressions?: ExpressionDefinition[];
    readonly motions: { [group: string]: MotionDefinition[] } = {};

    /**
     * Creates a simple ModelSettings by files of a folder. This is useful for models that has no model settings file.
     */
    static fromFolder(files: string[]) {
        const mocFile = files.find(f => f.endsWith('.moc'));

        if (!mocFile) {
            throw new TypeError('Cannot find moc file from files');
        }

        const fileName = basename(mocFile, '.moc');

        // A Neptunia series model is named like "blanc_m_model_c007.moc", we can get its proper name, "blanc" in this case
        const neptuniaModelName = fileName.substring(0, fileName.indexOf('_m_'));
        const modelName = neptuniaModelName || fileName;

        return new ModelSettings(
            {
                name: modelName,
                model: mocFile,
                textures: files.filter(f => f.endsWith('.jpg') || f.endsWith('.png')),
                physics: files.find(f => f.includes('physics')),
                hit_areas: neptuniaModelName
                    ? [
                        // use the name trick to bind these parts with compatible hit events
                        { name: 'body', id: 'D_REF.PT_HEAD' },
                        { name: 'head', id: 'D_REF.PT_MOUTH' },
                    ]
                    : undefined,
                expressions: files.filter(f => f.includes('exp/')).map(f => ({ name: f, file: f })),
                motions: {
                    idle: [
                        { file: LIVE2D_DIRECTORY + '/general/mtn/idle_00.mtn', fade_in: 2000, fade_out: 2000 },
                        { file: LIVE2D_DIRECTORY + '/general/mtn/idle_01.mtn', fade_in: 2000, fade_out: 2000 },
                        { file: LIVE2D_DIRECTORY + '/general/mtn/idle_02.mtn', fade_in: 2000, fade_out: 2000 },
                    ],
                    tap_body: files
                        .filter(f => f.includes('mtn/'))
                        .map(f => {
                            const name = basename(f, '.mtn');
                            const soundRegex = new RegExp(name + '\\.(ogg|mp3)$');

                            return {
                                file: f,
                                sound: files.find(f => soundRegex.test(f)),
                            };
                        }),
                },
            },
            dirname(mocFile),
            false,
        );
    }

    /**
     * @param json - The model settings JSON
     * @param basePath - Base path of the model.
     * @param convertPaths - True to convert each file from relative path to absolute path.
     */
    constructor(readonly json: any, readonly basePath: string, convertPaths = true) {
        if (!(json && typeof json === 'object')) {
            throw new TypeError('Invalid JSON.');
        }

        // set default name to folder's name
        this.name = basename(basePath);

        this.copy(cloneWithCamelCase(json));
        this.adaptLegacy();

        convertPaths && this.convertPaths(basePath);
    }

    /**
     * Validates and copies properties from JSON.
     */
    private copy(json: any) {
        // begin essential properties

        copyProperty(this, json, 'model', 'string');

        if (!this.model) {
            throw new TypeError('Missing model file.');
        }

        if (json.textures) {
            this.textures.push(...json.textures.filter((file: any) => typeof file === 'string'));
        }

        if (this.textures.length === 0) {
            throw new TypeError('Missing textures.');
        }

        // end essential properties

        copyProperty(this, json, 'name', 'string');
        copyProperty(this, json, 'pose', 'string');
        copyProperty(this, json, 'preview', 'string');
        copyProperty(this, json, 'physics', 'string');
        copyProperty(this, json, 'subtitle', 'string');

        if (json.layout && typeof json.layout === 'object') {
            // @ts-ignore
            this.layout = {};

            // copy only the number properties
            for (const [key, value] of Object.entries(json.layout)) {
                if (!isNaN(value as number)) {
                    (this.layout as any)[key] = value;
                }
            }
        }

        if (Array.isArray(json.hitAreas)) {
            const filter = (hitArea: any) => typeof hitArea.name === 'string' && typeof hitArea.id === 'string';
            // @ts-ignore
            this.hitAreas = json.hitAreas.filter(filter);
        }

        if (Array.isArray(json.expressions)) {
            const filter = (exp: any) => typeof exp.name === 'string' && typeof exp.file === 'string';
            // @ts-ignore
            this.expressions = json.expressions.filter(filter);
        }

        if (Array.isArray(json.initParam)) {
            const filter = (param: any) => typeof param.id === 'string' && typeof param.value === 'string';
            // @ts-ignore
            this.initParams = json.initParam.filter(filter);
        }

        if (Array.isArray(json.initPartsVisible)) {
            const filter = (param: any) => typeof param.id === 'string' && typeof param.value === 'string';
            // @ts-ignore
            this.initOpacities = json.initPartsVisible.filter(filter);
        }

        if (json.motions && typeof json.motions === 'object') {
            for (const [group, motionGroup] of Object.entries(json.motions)) {
                if (Array.isArray(motionGroup)) {
                    this.motions[group] = motionGroup

                    // filter out the motions without `file` defined
                        .filter(motion => motion && typeof motion.file === 'string')

                        // copy only the valid properties
                        .map((motion: any) => {
                            const copy: MotionDefinition = {
                                file: motion.file,
                            };

                            copyProperty(copy, motion, 'sound', 'string');
                            copyProperty(copy, motion, 'subtitle', 'string');
                            copyProperty(copy, motion, 'season', 'string');
                            copyProperty(copy, motion, 'fadeIn', 'number');
                            copyProperty(copy, motion, 'fadeOut', 'number');
                            copyProperty(copy, motion, 'time', 'number');

                            return copy;
                        });
                }
            }
        }
    }

    /**
     * Adapt legacy models for version 1.x.
     */
    private adaptLegacy() {
        if (this.pose) {
            // @ts-ignore
            this.pose = this.pose.replace(/^\.\/general/, '../general').replace(/^\.\/neptune/, '../neptune');
        }

        if (this.motions['start_up']) {
            this.motions['greet'] = this.motions['start_up'];
            this.motions['greet'].forEach(motionDef => {
                switch (motionDef.time) {
                    case -1:
                        // @ts-ignore
                        motionDef.season = 'Halloween';
                        break;
                    case -2:
                        // @ts-ignore
                        motionDef.season = 'Christmas';
                        break;
                    case -3:
                        // @ts-ignore
                        motionDef.season = 'NewYear';
                        break;
                }
            });
        }
    }

    /**
     * Converts each file from relative path to absolute path.
     */
    private convertPaths(basePath: string) {
        const convertProperty = (obj: object, propertyPath: string | number) => {
            const path: string = get(obj, propertyPath);

            if (path) {
                set(obj, propertyPath, urlResolve(basePath, path));
            }
        };
        const convertArray = (obj: object, arrayPath: string, propertyPath: string) => {
            const array: [] = get(obj, arrayPath);

            if (Array.isArray(array)) {
                array.forEach(obj => convertProperty(obj, propertyPath));
            }
        };

        convertProperty(this, 'model');
        convertProperty(this, 'preview');
        convertProperty(this, 'pose');
        convertProperty(this, 'physics');
        convertProperty(this, 'subtitle');

        convertArray(this, 'textures', 'file');
        convertArray(this, 'expressions', 'file');

        Object.keys(this.motions).forEach(group => {
            convertArray(this.motions, group, 'file');
            convertArray(this.motions, group, 'sound');
        });

        if (Array.isArray(this.textures)) {
            this.textures.forEach((texture, i) => convertProperty(this.textures, i));
        }
    }
}

/**
 * Copies a property at `path` only if it matches the `type`.
 */
function copyProperty(dest: object, src: object, path: string, type: string) {
    const value = get(src, path);

    if (typeof value === type) {
        set(dest, path, value);
    }
}
