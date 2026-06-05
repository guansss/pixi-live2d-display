import type { Live2DModel } from "@/Live2DModel";
import type { ModelSettings } from "@/cubism-common/ModelSettings";
import type { Texture } from "@pixi/core";

export type InspectionSeverity = "info" | "warning" | "error";

export type ResourceKind =
    | "moc"
    | "texture"
    | "pose"
    | "physics"
    | "motion"
    | "expression"
    | "sound"
    | "unknown";

export interface InspectionWarning {
    severity: InspectionSeverity;
    code: string;
    message: string;
    path?: string;
}

export interface ResourceInspection {
    kind: ResourceKind;
    path: string;
    resolvedPath?: string;
    group?: string;
    index?: number;
    optional: boolean;
}

export interface MotionInspection {
    group: string;
    index: number;
    file?: string;
    sound?: string;
    fadeIn?: number;
    fadeOut?: number;
    raw: unknown;
}

export interface ExpressionInspection {
    index: number;
    name?: string;
    file?: string;
    raw: unknown;
}

export interface HitAreaInspection {
    name: string;
    id?: string;
    index?: number;
}

export interface TextureInspection {
    index: number;
    width?: number;
    height?: number;
    valid: boolean;
}

export interface ModelSettingsInspection {
    name: string;
    url: string;
    cubismVersion: "2" | "4" | "unknown";
    resources: ResourceInspection[];
    motions: MotionInspection[];
    expressions: ExpressionInspection[];
    hitAreas: HitAreaInspection[];
    warnings: InspectionWarning[];
    summary: {
        textureCount: number;
        motionCount: number;
        expressionCount: number;
        hitAreaCount: number;
        requiredResourceCount: number;
        optionalResourceCount: number;
    };
}

export interface Live2DModelInspection extends ModelSettingsInspection {
    tag: string;
    loadedTextureCount: number;
    textures: TextureInspection[];
    runtime: {
        elapsedTime: number;
        deltaTime: number;
        playing: boolean;
        destroyed: boolean;
        hasExpressionManager: boolean;
        currentAudio: boolean;
    };
}

interface MotionLike {
    File?: string;
    file?: string;
    Sound?: string;
    sound?: string;
    FadeInTime?: number;
    FadeOutTime?: number;
    fade_in?: number;
    fade_out?: number;
}

interface ExpressionLike {
    Name?: string;
    name?: string;
    File?: string;
    file?: string;
}

interface HitAreaLike {
    Name?: string;
    name?: string;
    Id?: string;
    id?: string;
}

export function inspectLive2DModel(model: Live2DModel): Live2DModelInspection {
    const base = inspectModelSettings(model.internalModel.settings);
    const motionManager = model.internalModel.motionManager as any;

    return {
        ...base,
        tag: model.tag,
        loadedTextureCount: model.textures.length,
        textures: inspectTextures(model.textures),
        runtime: {
            elapsedTime: model.elapsedTime,
            deltaTime: model.deltaTime,
            playing: Boolean(motionManager?.playing),
            destroyed: Boolean(motionManager?.destroyed),
            hasExpressionManager: Boolean(motionManager?.expressionManager),
            currentAudio: Boolean(motionManager?.currentAudio),
        },
        warnings: [
            ...base.warnings,
            ...inspectRuntimeWarnings(model, base),
        ],
    };
}

export function inspectModelSettings(settings: ModelSettings): ModelSettingsInspection {
    const json = settings.json as any;
    const cubismVersion = detectCubismVersion(settings);
    const resources: ResourceInspection[] = [];
    const warnings: InspectionWarning[] = [];

    addResource(resources, settings, "moc", settings.moc, false);
    addResource(resources, settings, "pose", settings.pose, true);
    addResource(resources, settings, "physics", settings.physics, true);

    settings.textures.forEach((texture, index) => {
        addResource(resources, settings, "texture", texture, false, undefined, index);
    });

    const motions = inspectMotions(settings);
    motions.forEach((motion) => {
        if (motion.file) {
            addResource(resources, settings, "motion", motion.file, false, motion.group, motion.index);
        }
        if (motion.sound) {
            addResource(resources, settings, "sound", motion.sound, true, motion.group, motion.index);
        }
    });

    const expressions = inspectExpressions(settings);
    expressions.forEach((expression) => {
        if (expression.file) {
            addResource(resources, settings, "expression", expression.file, true, undefined, expression.index);
        }
    });

    const hitAreas = inspectHitAreas(settings);

    collectSettingsWarnings(settings, resources, motions, expressions, hitAreas, warnings);
    collectRawJsonWarnings(json, warnings);

    return {
        name: settings.name,
        url: settings.url,
        cubismVersion,
        resources,
        motions,
        expressions,
        hitAreas,
        warnings,
        summary: {
            textureCount: settings.textures.length,
            motionCount: motions.length,
            expressionCount: expressions.length,
            hitAreaCount: hitAreas.length,
            requiredResourceCount: resources.filter((resource) => !resource.optional).length,
            optionalResourceCount: resources.filter((resource) => resource.optional).length,
        },
    };
}

export function inspectMotions(settings: ModelSettings): MotionInspection[] {
    const definitions = getMotionDefinitions(settings);
    const motions: MotionInspection[] = [];

    Object.keys(definitions).forEach((group) => {
        const groupMotions = definitions[group];
        if (!Array.isArray(groupMotions)) {
            return;
        }

        groupMotions.forEach((motion, index) => {
            const motionLike = motion as MotionLike;
            motions.push({
                group,
                index,
                file: getString(motionLike.File) ?? getString(motionLike.file),
                sound: getString(motionLike.Sound) ?? getString(motionLike.sound),
                fadeIn: getNumber(motionLike.FadeInTime) ?? getNumber(motionLike.fade_in),
                fadeOut: getNumber(motionLike.FadeOutTime) ?? getNumber(motionLike.fade_out),
                raw: motion,
            });
        });
    });

    return motions;
}

export function inspectExpressions(settings: ModelSettings): ExpressionInspection[] {
    const expressions = getExpressionDefinitions(settings);
    if (!Array.isArray(expressions)) {
        return [];
    }

    return expressions.map((expression, index) => {
        const expressionLike = expression as ExpressionLike;
        return {
            index,
            name: getString(expressionLike.Name) ?? getString(expressionLike.name),
            file: getString(expressionLike.File) ?? getString(expressionLike.file),
            raw: expression,
        };
    });
}

export function inspectHitAreas(settings: ModelSettings): HitAreaInspection[] {
    const hitAreas = getHitAreaDefinitions(settings);
    if (!Array.isArray(hitAreas)) {
        return [];
    }

    return hitAreas.map((hitArea, index) => {
        const hitAreaLike = hitArea as HitAreaLike;
        return {
            name: getString(hitAreaLike.Name) ?? getString(hitAreaLike.name) ?? `HitArea${index}`,
            id: getString(hitAreaLike.Id) ?? getString(hitAreaLike.id),
            index,
        };
    });
}

export function collectResourcePaths(inspection: ModelSettingsInspection): string[] {
    return uniqueSorted(
        inspection.resources
            .map((resource) => resource.resolvedPath ?? resource.path)
            .filter((path) => path.length > 0),
    );
}

export function groupResourcesByKind(
    inspection: ModelSettingsInspection,
): Partial<Record<ResourceKind, ResourceInspection[]>> {
    return inspection.resources.reduce<Partial<Record<ResourceKind, ResourceInspection[]>>>(
        (groups, resource) => {
            const list = groups[resource.kind] ?? [];
            list.push(resource);
            groups[resource.kind] = list;
            return groups;
        },
        {},
    );
}

export function summarizeInspectionWarnings(
    inspection: ModelSettingsInspection,
): Record<InspectionSeverity, number> {
    return inspection.warnings.reduce<Record<InspectionSeverity, number>>(
        (summary, warning) => {
            summary[warning.severity] += 1;
            return summary;
        },
        {
            info: 0,
            warning: 0,
            error: 0,
        },
    );
}

function inspectTextures(textures: Texture[]): TextureInspection[] {
    return textures.map((texture, index) => {
        const baseTexture = texture.baseTexture;
        return {
            index,
            width: baseTexture?.width,
            height: baseTexture?.height,
            valid: Boolean(baseTexture?.valid),
        };
    });
}

function inspectRuntimeWarnings(
    model: Live2DModel,
    base: ModelSettingsInspection,
): InspectionWarning[] {
    const warnings: InspectionWarning[] = [];

    if (model.textures.length !== base.summary.textureCount) {
        warnings.push({
            severity: "warning",
            code: "texture-count-mismatch",
            message: `Settings define ${base.summary.textureCount} textures, but the model has ${model.textures.length} loaded textures.`,
        });
    }

    model.textures.forEach((texture, index) => {
        if (!texture.baseTexture?.valid) {
            warnings.push({
                severity: "warning",
                code: "invalid-texture",
                message: `Texture ${index} is not valid.`,
                path: String(index),
            });
        }
    });

    return warnings;
}

function collectSettingsWarnings(
    settings: ModelSettings,
    resources: ResourceInspection[],
    motions: MotionInspection[],
    expressions: ExpressionInspection[],
    hitAreas: HitAreaInspection[],
    warnings: InspectionWarning[],
): void {
    if (!settings.name) {
        warnings.push({
            severity: "warning",
            code: "empty-model-name",
            message: "Model settings have an empty name.",
        });
    }

    if (!settings.url) {
        warnings.push({
            severity: "error",
            code: "empty-settings-url",
            message: "Model settings URL is empty.",
        });
    }

    if (!settings.moc) {
        warnings.push({
            severity: "error",
            code: "missing-moc",
            message: "Model settings do not define a moc file.",
        });
    }

    if (!settings.textures.length) {
        warnings.push({
            severity: "error",
            code: "missing-textures",
            message: "Model settings do not define any textures.",
        });
    }

    resources.forEach((resource) => {
        if (!resource.path) {
            warnings.push({
                severity: resource.optional ? "warning" : "error",
                code: "empty-resource-path",
                message: `${resource.kind} resource has an empty path.`,
            });
        }
    });

    motions.forEach((motion) => {
        if (!motion.file) {
            warnings.push({
                severity: "warning",
                code: "motion-without-file",
                message: `Motion ${motion.group}[${motion.index}] does not define a file.`,
                path: `${motion.group}[${motion.index}]`,
            });
        }
        if (motion.fadeIn !== undefined && motion.fadeIn < 0) {
            warnings.push({
                severity: "warning",
                code: "negative-motion-fade-in",
                message: `Motion ${motion.group}[${motion.index}] has a negative fade-in time.`,
                path: `${motion.group}[${motion.index}]`,
            });
        }
        if (motion.fadeOut !== undefined && motion.fadeOut < 0) {
            warnings.push({
                severity: "warning",
                code: "negative-motion-fade-out",
                message: `Motion ${motion.group}[${motion.index}] has a negative fade-out time.`,
                path: `${motion.group}[${motion.index}]`,
            });
        }
    });

    expressions.forEach((expression) => {
        if (!expression.file) {
            warnings.push({
                severity: "warning",
                code: "expression-without-file",
                message: `Expression ${expression.index} does not define a file.`,
                path: String(expression.index),
            });
        }
    });

    const hitAreaNames = new Set<string>();
    hitAreas.forEach((hitArea) => {
        if (hitAreaNames.has(hitArea.name)) {
            warnings.push({
                severity: "warning",
                code: "duplicate-hit-area-name",
                message: `Hit area "${hitArea.name}" is defined more than once.`,
                path: hitArea.name,
            });
        }
        hitAreaNames.add(hitArea.name);
    });
}

function collectRawJsonWarnings(json: any, warnings: InspectionWarning[]): void {
    if (!json || typeof json !== "object") {
        warnings.push({
            severity: "error",
            code: "invalid-settings-json",
            message: "Settings JSON is not an object.",
        });
        return;
    }

    const version = json.Version ?? json.version;
    if (version !== undefined && typeof version !== "number") {
        warnings.push({
            severity: "info",
            code: "non-numeric-version",
            message: "Settings JSON version is present but not numeric.",
        });
    }

    const groups = json.Motions ?? json.motions;
    if (groups && typeof groups !== "object") {
        warnings.push({
            severity: "warning",
            code: "invalid-motion-groups",
            message: "Motion groups are present but not an object.",
        });
    }
}

function addResource(
    resources: ResourceInspection[],
    settings: ModelSettings,
    kind: ResourceKind,
    path: string | undefined,
    optional: boolean,
    group?: string,
    index?: number,
): void {
    if (path === undefined) {
        return;
    }

    resources.push({
        kind,
        path,
        resolvedPath: path ? settings.resolveURL(path) : undefined,
        group,
        index,
        optional,
    });
}

function detectCubismVersion(settings: ModelSettings): "2" | "4" | "unknown" {
    const json = settings.json as any;
    if (json.Version === 3 || json.Version === 4 || json.FileReferences) {
        return "4";
    }
    if (json.model || json.textures || json.motions) {
        return "2";
    }
    if (settings.moc?.endsWith(".moc3")) {
        return "4";
    }
    if (settings.moc?.endsWith(".moc")) {
        return "2";
    }
    return "unknown";
}

function getMotionDefinitions(settings: ModelSettings): Record<string, unknown[]> {
    const anySettings = settings as any;
    const json = settings.json as any;
    return (
        anySettings.definitions ??
        anySettings.motions ??
        json.FileReferences?.Motions ??
        json.Motions ??
        json.motions ??
        {}
    );
}

function getExpressionDefinitions(settings: ModelSettings): unknown[] {
    const anySettings = settings as any;
    const json = settings.json as any;
    return (
        anySettings.expressions ??
        json.FileReferences?.Expressions ??
        json.Expressions ??
        json.expressions ??
        []
    );
}

function getHitAreaDefinitions(settings: ModelSettings): unknown[] {
    const anySettings = settings as any;
    const json = settings.json as any;
    return (
        anySettings.hitAreas ??
        json.HitAreas ??
        json.hit_areas ??
        json.hitAreas ??
        []
    );
}

function getString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
