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
