import { cloneDeep, noop } from "lodash-es";
import type { JSONObject, Live2DFactoryOptions, Live2DModelEvents, ModelSettings } from "../src";
import { Live2DModel, MotionPreloadStrategy } from "../src";

export const BASE_PATH = "../../../test/";

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function loadScript(url: string) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
    });
}

export function defaultOptions(options: Live2DFactoryOptions = {}): Live2DFactoryOptions {
    return {
        motionPreload: MotionPreloadStrategy.NONE,
        autoUpdate: false,
        ...cloneDeep(options),
    };
}

export async function loadAsFiles(
    urlMap: Record<string, () => Promise<string>>,
    convertPath: (path: string) => string,
) {
    return Promise.all(
        Object.entries(urlMap).map(async ([path, url]) => {
            const blob = await fetch(await url()).then((res) => res.blob());
            return createFile(blob, convertPath(path));
        }),
    );
}

export function createFile(blob: Blob, relativePath: string) {
    const name = relativePath.slice(relativePath.lastIndexOf("/") + 1);
    const file = new File([blob], name);
    Object.defineProperty(file, "webkitRelativePath", { value: relativePath });
    return file;
}

export function createModel(
    src: string | JSONObject | ModelSettings,
    options: Live2DFactoryOptions & {
        // TODO: make a public API for this
        listeners?: {
            [K in keyof Live2DModelEvents]?: (
                this: Live2DModel,
                ...args: Live2DModelEvents[K]
            ) => void;
        };
    } = {},
): Promise<Live2DModel> {
    options = defaultOptions(options);
    const creation = new Promise<Live2DModel>((resolve, reject) => {
        options.onLoad = () => resolve(model);
        options.onError = reject;
    });

    const model = Live2DModel.fromSync(src, defaultOptions(options));

    if (options.listeners)
        Object.entries(options.listeners).forEach(([key, value]) => {
            console.log("on", key);
            if (typeof value === "function") model.on(key, value);
        });

    return creation;
}

// inspired by Playwright's source code
export class ManualPromise<T> extends Promise<T> {
    resolve!: (value: T) => void;
    reject!: (reason?: any) => void;

    constructor() {
        super((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    // return a native Promise for then/catch/finally
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/@@species
    static get [Symbol.species]() {
        return Promise;
    }
}

export function overrideDescriptor<T extends object, K extends keyof T>(
    obj: T,
    prop: K,
    getDescriptor: (
        original: {
            value: T[K];
            descriptor: PropertyDescriptor | undefined;
        },
        restore: () => void,
    ) => PropertyDescriptor,
): () => void {
    const value = obj[prop];
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

    const restore = () => {
        if (descriptor) {
            Object.defineProperty(obj, prop, descriptor);
        } else {
            // we may have defined a new own property, then we need to delete it
            // so that the prototype's property descriptor will take effect
            delete obj[prop];

            obj[prop] = value;
        }
    };

    const newDescriptor = getDescriptor({ value, descriptor }, restore);

    // if not configurable, we just let it throw
    Object.defineProperty(obj, prop, newDescriptor);

    return restore;
}

export function overrideValue<T extends object, K extends keyof T>(
    obj: T,
    prop: K,
    getValue: (original: T[K], restore: () => void) => T[K],
): () => void {
    return overrideDescriptor(obj, prop, ({ value, descriptor }, restore) => ({
        configurable: true,
        enumerable: descriptor?.enumerable ?? true,
        writable: descriptor?.writable ?? true,
        value: getValue(value, restore),
    }));
}

export function asDisposable(dispose: () => void): Disposable {
    return { [Symbol.dispose]: dispose };
}

export function normalizeFilter(filter: string | RegExp | ((src: string) => boolean)) {
    if (typeof filter === "string") {
        return (src: string) => src.includes(filter);
    } else if (filter instanceof RegExp) {
        return (src: string) => filter.test(src);
    } else {
        return filter;
    }
}

export interface MessageQueue<T> {
    produce: (item: T) => void;
    consumer: AsyncGenerator<T, void, void> & { ended: boolean };
    waitFor: (check: (item: T) => boolean) => Promise<T>;
    stop: () => void;
}

export function messageQueue<T>(waitTimeoutMS: number = 1000): MessageQueue<T> {
    // usually a test will finish or timeout in a few seconds, but we still set a lifetime limit in case something goes wrong
    const maxLifetime = 1000 * 60;

    const messages: T[] = [];
    let produce: (item: T) => void = (item) => messages.push(item);
    let abort: (reason: string) => void = noop;

    const consumer = (async function* () {
        const lifetimeTimerId = setTimeout(() => {
            abort(`lifetime exceeded (${maxLifetime}ms)`);
        }, maxLifetime);

        let timerId: NodeJS.Timeout | undefined;

        const resetControllers = () => {
            clearTimeout(timerId);
            abort = noop;
            produce = (item) => messages.push(item);
        };

        try {
            while (true) {
                while (messages.length > 0) {
                    yield messages.shift()!;
                }

                yield await new Promise<T>((resolve, reject) => {
                    timerId = setTimeout(() => {
                        abort(`timeout reached waiting for next message (${waitTimeoutMS}ms)`);
                    }, waitTimeoutMS);

                    produce = (item) => {
                        resetControllers();
                        resolve(item);
                    };
                    abort = (reason) => {
                        resetControllers();
                        reject(new Error("Message queue aborted: " + reason));
                    };
                });
            }
        } finally {
            resetControllers();
            clearTimeout(lifetimeTimerId);
            consumer!.ended = true;
        }
    })() as AsyncGenerator<T, void, void> & { ended: boolean };

    consumer.ended = false;

    const waitFor: MessageQueue<T>["waitFor"] = async (check) => {
        for await (const request of consumer) {
            if (check(request)) {
                return request;
            }
        }

        // the queue is not supposed to end while waiting for a particular message
        throw new Error("Unexpected end of waitFor(), the message queue must be broken");
    };

    const stop = () => {
        abort("stop() called");
        consumer.return();
    };

    return {
        produce: (item) => produce(item),
        consumer,
        waitFor,
        stop,
    };
}

export interface BoxOptions<T> {
    waitTimeoutMS?: number;
    onPut?: (item: T) => void;
}

export interface Box<T> {
    put: (item: T) => Promise<void>;
    take: (check: (item: T) => boolean) => Promise<T>;
    peek: () => IterableIterator<T>;
}

export function createBox<T>({ onPut, waitTimeoutMS = 1000 }: BoxOptions<T> = {}): Box<T> {
    const items = new Map<T, () => void>();
    const deferredTakers = new Set<(item: T) => boolean>();

    const put: Box<T>["put"] = (item) => {
        if (items.has(item)) {
            throw new Error("Cannot put the same item twice");
        }

        onPut?.(item);

        for (const deferredTaker of deferredTakers) {
            if (deferredTaker(item)) {
                return Promise.resolve();
            }
        }

        return new Promise<void>((resolve) => {
            items.set(item, resolve);
        });
    };

    const take: Box<T>["take"] = async (check) => {
        for (const [item] of items) {
            if (check(item)) {
                items.delete(item);
                return item;
            }
        }

        return new Promise<T>((resolve, reject) => {
            let rejected = false;

            const deferredTaker = (item: T) => {
                if (!rejected && check(item)) {
                    items.delete(item);
                    deferredTakers.delete(deferredTaker);
                    resolve(item);
                    return true;
                }
                return false;
            };

            deferredTakers.add(deferredTaker);

            delay(waitTimeoutMS).then(() => {
                rejected = true;
                deferredTakers.delete(deferredTaker);
                reject(new Error(`timed out waiting for item (${waitTimeoutMS}ms)`));
            });
        });
    };

    const peek: Box<T>["peek"] = () => items.keys();

    return { put, take, peek };
}
