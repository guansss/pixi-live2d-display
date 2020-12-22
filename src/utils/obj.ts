/**
 * Copies a property at only if it matches the `type`.
 * @param type - Type expected to match `typeof` on the property.
 * @param from - Source object.
 * @param to - Destination object.
 * @param fromKey - Key of the property in source object.
 * @param toKey - Key of the property in destination object.
 */
// TODO: lint and fix the formatting!
export function copyProperty<From, FromKey extends keyof From, ToKey extends keyof any, To extends Partial<Record<ToKey, From[FromKey]>>>(type: string, from: From, to: To, fromKey: FromKey, toKey: ToKey) {
    const value = from[fromKey];

    if (value !== null && typeof value === type) {
        // a type error will occur here, have no idea
        to[toKey] = value as any;
    }
}

/**
 * Copies an array at `key`, filtering the items that match the `type`.
 * @param type - Type expected to match `typeof` on the items.
 * @param from - Source object.
 * @param to - Destination object.
 * @param fromKey - Key of the array property in source object.
 * @param toKey - Key of the array property in destination object.
 */
export function copyArray<FromKey extends keyof any, From extends Partial<Record<FromKey, any[]>>, ToKey extends keyof any, To extends Partial<Record<ToKey, any[]>>>(type: string, from: From, to: To, fromKey: FromKey, toKey: ToKey) {
    const array = from[fromKey];

    if (Array.isArray(array)) {
        to[toKey] = array.filter(item => item !== null && typeof item === type) as any;
    }
}

/**
 * @see {@link https://www.typescriptlang.org/docs/handbook/mixins.html}
 */
export function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            if (name !== 'constructor') {
                Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name)!);
            }
        });
    });
}
