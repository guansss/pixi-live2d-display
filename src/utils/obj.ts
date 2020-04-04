import camelCase from 'lodash/camelCase';

/**
 * Deep clones a JSON object, converting all the property names to camel case.
 * @param value - JSON object.
 * @returns Cloned object.
 */
export function cloneWithCamelCase(value: any): any {
    if (Array.isArray(value)) {
        return value.map(cloneWithCamelCase);
    }

    if (value && typeof value === 'object') {
        const clone: any = {};

        for (const key of Object.keys(value)) {
            clone[camelCase(key)] = cloneWithCamelCase(value[key]);
        }

        return clone;
    }

    return value;
}

/**
 * Copies a property at `path` only if it matches the `type`.
 */
export function copyProperty(dest: any, src: any, path: string, type: string) {
    const value = src[path];

    if (typeof value === type) {
        dest[path] = value;
    }
}

/**
 * Copies a array at `path`, filtering the items that match the `type`.
 */
export function copyArray(dest: any, src: any, path: string, type: string) {
    const array = src[path];

    if (Array.isArray(array)) {
        dest[path] = array.filter(item => typeof item === type);
    }
}

/**
 * Copies a array at `path`, filtering the items whose properties match the type in given `types` map.
 */
export function copyArrayDeep(dest: any, src: any, path: string, types: Record<string, string>) {
    const array = src[path];

    const matchers = Object.entries(types);

    if (Array.isArray(array)) {
        dest[path] = array.filter(item => matchers.every(([key, type]) => typeof item[key] === type));
    }
}
