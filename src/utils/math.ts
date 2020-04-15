/**
 * These functions can be slightly faster than the ones in Lodash.
 * @packageDocumentation
 */

export function clamp(num: number, lower: number, upper: number) {
    return num < lower ? lower : num > upper ? upper : num;
}

export function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
