import camelCase from 'lodash/camelCase';

/**
 * Deep clones a JSON object, converting all the property names to camel case.
 * @param value - JSON object.
 * @return Cloned object.
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
 * Copies a property at only if it matches the `type`.
 * @param dest - Destination object.
 * @param src - Source object.
 * @param key - Key of the property.
 * @param type - Type expected to match `typeof` on the property.
 */
export function copyProperty(dest: any, src: any, key: string, type: string) {
    const value = src[key];

    if (typeof value === type) {
        dest[key] = value;
    }
}

/**
 * Copies an array at `key`, filtering the items that match the `type`.
 * @param dest - Destination object.
 * @param src - Source object.
 * @param key - Key of the array property.
 * @param type - Type expected to match `typeof` on the items.
 */
export function copyArray(dest: any, src: any, key: string, type: string) {
    const array = src[key];

    if (Array.isArray(array)) {
        dest[key] = array.filter(item => typeof item === type);
    }
}

/**
 * Copies an object array at `key`, filtering the items with properties matching the type in given `types` map.
 *
 * ```js
 * copyArrayDeep(o1, o2, 'users', { name: 'string', id: 'number' });
 * ```
 *
 * @param dest - Destination object.
 * @param src - Source object.
 * @param key - Key of the array property.
 * @param types - Type dictionary to match `typeof` on each property of the items.
 */
export function copyObjectArray(dest: any, src: any, key: string, types: Record<string, string>) {
    const array = src[key];

    const matchers = Object.entries(types);

    if (Array.isArray(array)) {
        dest[key] = array.filter(item => matchers.every(([key, type]) => typeof item[key] === type));
    }
}
