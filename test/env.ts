/* eslint-disable no-empty-pattern */
import circleImage from "./assets/circle.png?url";
import haruMocUrl from "./assets/haru/haru_greeter_t03.moc3?url";
import haruJson from "./assets/haru/haru_greeter_t03.model3.json";
import haruJsonUrl from "./assets/haru/haru_greeter_t03.model3.json?url";
import shizukuMocUrl from "./assets/shizuku/shizuku.moc?url";
import shizukuJson from "./assets/shizuku/shizuku.model.json";
import shizukuJsonUrl from "./assets/shizuku/shizuku.model.json?url";
import shakeSound from "./assets/shizuku/sounds/shake_00.mp3?url";

import { Application } from "@pixi/app";
import { memoize, pull, pullAll } from "lodash-es";
import type { Awaitable, TestContext } from "vitest";
import { test as baseTest, describe, vi } from "vitest";
import { CubismMoc, XHRLoader } from "../src/csm4";
import { loadAsFiles, normalizeFilter, overrideValue } from "./utils";

if ("layout" in shizukuJson) {
    throw new Error("Test model should not have a layout, but found in shizuku");
}
if ("Layout" in haruJson) {
    throw new Error("Test model should not have a layout, but found in haru");
}

const shizuku = Object.freeze({
    name: "shizuku",
    cubismVersion: 2,
    modelJsonUrl: shizukuJsonUrl,
    modelJson: shizukuJson,
    modelJsonWithUrl: { ...shizukuJson, url: shizukuJsonUrl },
    files: memoize(() => {
        const urlMap = import.meta.glob("./assets/shizuku/**/*", { as: "url" });
        return loadAsFiles(urlMap, (path) => path.replace("./assets", "/test/assets"));
    }),
    width: 1280,
    height: 1380,
    layout: {
        center_x: 0,
        y: 1.2,
        width: 2.4,
    },
    hitTests: [
        { x: 600, y: 550, hitArea: ["head"] },
        { x: 745, y: 670, hitArea: ["head", "mouth"] },
        { x: 780, y: 710, hitArea: ["body"] },
    ],
    interaction: {
        exp: "head",
        motion: {
            body: "tap_body",
        },
    },
    ...(() => {
        const mocData = memoize(() => fetch(shizukuMocUrl).then((res) => res.arrayBuffer()));
        const coreModel = () => mocData().then((moc) => Live2DModelWebGL.loadModel(moc));
        return { mocData, coreModel };
    })(),
});

const haru = Object.freeze({
    name: "haru",
    cubismVersion: 4,
    modelJsonUrl: haruJsonUrl,
    modelJson: haruJson,
    modelJsonWithUrl: { ...haruJson, url: haruJsonUrl },
    files: memoize(() => {
        const urlMap = import.meta.glob("./assets/haru/**/*", { as: "url" });
        return loadAsFiles(urlMap, (path) => path.replace("./assets", "/test/assets"));
    }),
    width: 2400,
    height: 4500,
    layout: {
        Width: 1.8,
        X: 0.9,
    },
    hitTests: [
        { x: 1166, y: 834, hitArea: ["Head"] },
        { x: 910, y: 981, hitArea: ["Body"] },
    ],
    interaction: {
        exp: "Head",
        motion: {
            Body: "Tap",
        },
    },
    ...(() => {
        const mocData = memoize(() => fetch(haruMocUrl).then((res) => res.arrayBuffer()));
        const coreModel = () => mocData().then((moc) => CubismMoc.create(moc, true).createModel());
        return { mocData, coreModel };
    })(),
});

export const TEST_MODEL2 = shizuku;
export const TEST_MODEL4 = haru;
export const ALL_TEST_MODELS = [TEST_MODEL2, TEST_MODEL4];

type TestModel = (typeof ALL_TEST_MODELS)[number];

export function testEachModel(
    name: string,
    fn: (ctx: TestContext & CustomContext & { model: TestModel }) => Awaitable<void>,
) {
    for (const model of ALL_TEST_MODELS) {
        test.extend({ model })(`${name} (${model.name})`, fn as any);
    }
}

export function describeEachModel(
    name: string,
    fn: (ctx: { model: TestModel }) => Awaitable<void>,
) {
    for (const model of ALL_TEST_MODELS) {
        describe(`${name} (${model.name})`, () => fn({ model }));
    }
}

export const TEST_TEXTURE = circleImage;
export const TEST_SOUND = shakeSound;

interface CustomContext {
    loaderMock: {
        getAll: () => { url: string }[];
        rewrite: (fn: (url: string) => string) => void;
        block: (filter: string | RegExp | ((url: string) => boolean)) => void;
        unblock: (
            filter: string | RegExp | ((url: string) => boolean),
            transformData?: (data: any) => any,
        ) => void;
        blockAll: () => void;
        unblockAll: () => void;
        onLoaded: (filter: string | RegExp | ((url: string) => boolean)) => Promise<void>;
    };
    app: Application;
    timer: void;
    objectURLs: string[];
}

export const test = baseTest.extend<CustomContext>({
    async loaderMock({ task }, use) {
        let rewrite: (url: string) => string = (url) => url;
        let blockFilter: (url: string) => boolean = () => false;
        const allXHRs: { url: string; loaded: boolean }[] = [];
        const blockedXHRs: {
            url: string;
            unblock: (transformData?: (data: any) => any) => void;
        }[] = [];
        const waiters: ((xhr: { url: string }) => void)[] = [];

        const restore = overrideValue(XHRLoader, "createXHR", (originalCreateXHR) => {
            return function createXHR(target, url, type, onload, onerror) {
                if (rewrite) {
                    url = rewrite(url);
                }

                const xhr: (typeof allXHRs)[number] = { url, loaded: false };
                allXHRs.push(xhr);

                let blockedXHR: (typeof blockedXHRs)[number] | undefined;

                if (blockFilter(url)) {
                    console.log("[loaderMock] blocked", url);
                    blockedXHR = {
                        url,
                        unblock: (transformData) => {
                            blockedXHR = undefined;
                            if (transformData) throw new Error("XHR is not loaded yet");
                        },
                    };
                    blockedXHRs.push(blockedXHR);
                }

                const originalOnload = onload;

                onload = (data) => {
                    if (blockedXHR) {
                        blockedXHR.unblock = (transformData) => {
                            if (transformData) {
                                const originalData = data;
                                data = transformData(originalData);
                                if (data === undefined) data = originalData;
                            }
                            originalOnload(data);
                        };
                    } else {
                        originalOnload(data);
                    }

                    xhr.loaded = true;
                    waiters.forEach((waiter) => waiter({ url }));
                };

                return originalCreateXHR(
                    target,
                    url + "?test=" + task.name.replaceAll(" ", "-"),
                    type,
                    onload,
                    onerror,
                );
            } as typeof originalCreateXHR;
        });

        const loaderMock: CustomContext["loaderMock"] = {
            getAll: () => allXHRs,
            block: (filter) => {
                if (blockedXHRs.length > 0) {
                    throw new Error(
                        `Some XHRs are still blocked: [${blockedXHRs.map(({ url }) => url)}]`,
                    );
                }

                blockFilter = normalizeFilter(filter);
            },
            unblock: (_filter, data) => {
                const filter = normalizeFilter(_filter);
                const filtered = blockedXHRs.filter(({ url }) => filter(url));

                if (filtered.length === 0) {
                    throw new Error(
                        `No blocked XHRs matched the filter (${_filter}): [${blockedXHRs.map(
                            (x) => x.url,
                        )}]`,
                    );
                }

                console.log(
                    "[loaderMock] unblocked",
                    filtered.map(({ url }) => url),
                );

                filtered.forEach(({ unblock }) => unblock(data));
                pullAll(blockedXHRs, filtered);
            },
            blockAll: () => {
                loaderMock.block(() => true);
            },
            unblockAll: () => {
                loaderMock.unblock(() => true);
            },
            onLoaded: (_filter) => {
                const filter = normalizeFilter(_filter);

                allXHRs.forEach((x) => {
                    if (x.loaded && filter(x.url)) {
                        throw new Error(`XHR ${x.url} is already loaded`);
                    }
                });

                return new Promise((resolve) => {
                    waiters.push((xhr) => {
                        if (filter(xhr.url)) {
                            resolve();
                        }
                    });
                });
            },
            rewrite: (fn) => {
                rewrite = fn;
            },
        };

        await use(loaderMock);

        restore();
    },
    async app({}, use) {
        const app = new Application({
            width: 512,
            height: 512,
            autoStart: false,
            autoDensity: true,
        });

        await use(app);

        app.destroy(true, { children: true });
    },
    async timer({}, use) {
        vi.useFakeTimers({
            // https://github.com/vitest-dev/vitest/issues/3863
            toFake: undefined,
        });
        await use();
        vi.useRealTimers();
    },
    async objectURLs({}, use) {
        const objectURLs: string[] = [];
        const originalCreateObjectUrl = URL.createObjectURL;
        const originalRevokeObjectURL = URL.revokeObjectURL;

        vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
            const url = originalCreateObjectUrl(blob);
            objectURLs.push(url);
            return url;
        });
        vi.spyOn(URL, "revokeObjectURL").mockImplementation((url) => {
            originalRevokeObjectURL(url);
            pull(objectURLs, url);
        });

        await use(objectURLs);
    },
});
