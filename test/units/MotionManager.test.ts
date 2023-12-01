/* eslint-disable no-empty-pattern */
import { config } from "@/config";
import type { MotionManagerOptions } from "@/cubism-common";
import { MotionPreloadStrategy, MotionPriority } from "@/cubism-common";
import { SoundManager } from "@/cubism-common/SoundManager";
import { Cubism4ModelSettings } from "@/cubism4/Cubism4ModelSettings";
import { Cubism4MotionManager } from "@/cubism4/Cubism4MotionManager";
import "@/factory";
import { beforeEach, describe, expect, vi } from "vitest";
import type { CubismModel, CubismSpec } from "../../src/csm4";
import { CubismMotion } from "../../src/csm4";
import { TEST_MODEL4, test as baseTest } from "../env";

interface MotionManagerTestContext {
    manager: Cubism4MotionManager;
    createManager: {
        run: (options: MotionManagerOptions) => Cubism4MotionManager;
        get: () => Cubism4MotionManager | undefined;
    };
    coreModel: CubismModel;
    assertStartedMotion: {
        // test.extend() cannot infer the type for a function property, so we have to put it inside an object
        run: (
            group: string,
            indexOrFn: number | (() => unknown),
            fn?: () => unknown,
        ) => Promise<void>;
    };
}

const defaultOptions: MotionManagerOptions = { motionPreload: MotionPreloadStrategy.NONE };

const test = baseTest.extend<MotionManagerTestContext>({
    async manager({}, use) {
        const manager = new Cubism4MotionManager(
            new Cubism4ModelSettings(TEST_MODEL4.modelJsonWithUrl),
            defaultOptions,
        );

        await use(manager);

        manager.destroy();
    },
    async createManager({}, use) {
        let manager: Cubism4MotionManager | undefined;

        const createManager: MotionManagerTestContext["createManager"]["run"] = (options) => {
            if (manager) throw new Error("manager already created");
            manager = new Cubism4MotionManager(
                new Cubism4ModelSettings(TEST_MODEL4.modelJsonWithUrl),
                options,
            );
            return manager;
        };

        await use({
            run: createManager,
            get: () => manager,
        });

        manager?.destroy();
    },
    async coreModel({}, use) {
        const coreModel = await TEST_MODEL4.coreModel();
        await use(coreModel);
        coreModel.release();
    },
    async assertStartedMotion({ manager, createManager }, use) {
        const assertStartedMotion: MotionManagerTestContext["assertStartedMotion"]["run"] = async (
            group,
            indexOrFn,
            fn,
        ) => {
            let index: number | undefined;

            if (typeof indexOrFn === "function") {
                fn = indexOrFn;
            } else {
                index = indexOrFn;
            }

            manager = createManager.get() || manager;

            const startMotion = vi.spyOn(manager.queueManager, "startMotion");

            try {
                const [startedMotion] = await Promise.all([
                    new Promise((resolve) =>
                        startMotion.mockImplementation((m) => (resolve(m), 0)),
                    ),
                    fn!(),
                ]);

                const actualGroup = Object.entries(manager.motionGroups).find(
                    ([group, motions]) => motions?.includes(startedMotion as any),
                )?.[0];

                expect(group).toBe(actualGroup);

                if (index !== undefined) {
                    expect(manager.motionGroups[group]!.indexOf(startedMotion as any)).toBe(index);
                }
            } finally {
                startMotion.mockRestore();
            }
        };

        await use({ run: assertStartedMotion });
    },
});

beforeEach(() => {
    config.logLevel = config.LOG_LEVEL_WARNING;
    config.sound = false;
});

describe("preloads motions", () => {
    test("NONE", async ({ createManager, loaderMock }) => {
        createManager.run({ motionPreload: MotionPreloadStrategy.NONE });
        expect(loaderMock.getAll()).toHaveLength(0);
    });

    test("IDLE", async ({ createManager, loaderMock }) => {
        createManager.run({ motionPreload: MotionPreloadStrategy.IDLE });
        expect(loaderMock.getAll().map((x) => x.url.split("/").at(-1))).toEqual(
            expect.arrayContaining(
                TEST_MODEL4.modelJson.FileReferences.Motions.Idle.map((m) =>
                    m.File.split("/").at(-1),
                ),
            ),
        );
    });

    test("ALL", async ({ createManager, loaderMock }) => {
        createManager.run({ motionPreload: MotionPreloadStrategy.ALL });
        expect(loaderMock.getAll().map((x) => x.url.split("/").at(-1))).toEqual(
            expect.arrayContaining(
                Object.values(TEST_MODEL4.modelJson.FileReferences.Motions).flatMap((M) =>
                    M.map((m) => m.File.split("/").at(-1)),
                ),
            ),
        );
    });
});

test("uses custom idle group", async ({
    loaderMock,
    createManager,
    coreModel,
    assertStartedMotion,
}) => {
    const manager = createManager.run({
        motionPreload: MotionPreloadStrategy.IDLE,
        idleMotionGroup: "Tap",
    });

    expect(loaderMock.getAll().map((x) => x.url.split("/").at(-1))).toEqual(
        expect.arrayContaining(
            TEST_MODEL4.modelJson.FileReferences.Motions.Tap.map((m) => m.File.split("/").at(-1)),
        ),
    );

    await assertStartedMotion.run("Tap", async () => {
        manager.update(coreModel, 0);
    });
});

test("loads motions", async ({ manager }) => {
    expect(manager.loadMotion("Tap", 0)).resolves.toBeInstanceOf(CubismMotion);

    config.logLevel = config.LOG_LEVEL_NONE;

    expect(manager.loadMotion("asdfasdf", 0)).resolves.toBeUndefined();
});

test("starts an idle motion when no motion playing", async ({
    manager,
    coreModel,
    assertStartedMotion,
}) => {
    await assertStartedMotion.run("Idle", async () => {
        manager.update(coreModel, 0);
    });
});

test("starts an idle motion when current motion has finished", async ({
    manager,
    coreModel,
    assertStartedMotion,
}) => {
    await manager.startMotion("Idle", 0, MotionPriority.IDLE);

    manager.update(coreModel, 0);
    manager.update(coreModel, 30 * 1000);

    expect(manager.isFinished()).to.be.true;

    await assertStartedMotion.run("Idle", async () => {
        manager.update(coreModel, 60 * 1000);
    });
});

test("starts a random motion", async ({ manager, assertStartedMotion }) => {
    await assertStartedMotion.run("Tap", async () => {
        expect(manager.startRandomMotion("Tap")).resolves.toBe(true);
    });
});

test("starts an idle motion when the reserved motion has not yet been loaded", async ({
    loaderMock,
    manager,
    coreModel,
    assertStartedMotion,
}) => {
    await assertStartedMotion.run("Idle", async () => {
        manager.update(coreModel, 0);
    });

    manager.update(coreModel, 0);
    manager.update(coreModel, 30 * 1000);

    await assertStartedMotion.run("Tap", async () => {
        loaderMock.block(TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0]!.File);
        void manager.startMotion("Tap", 0, MotionPriority.NORMAL);

        await assertStartedMotion.run("Idle", async () => {
            manager.update(coreModel, 60 * 1000);
        });

        loaderMock.unblockAll();
    });
});

describe("refuses to play the same motion when it's already pending or playing", async () => {
    test("playing", async ({ manager }) => {
        await expect(manager.startMotion("Idle", 0, MotionPriority.IDLE)).resolves.toBe(true);
        await expect(manager.startMotion("Idle", 0, MotionPriority.IDLE)).resolves.toBe(false);
        await expect(manager.startMotion("Idle", 0, MotionPriority.NORMAL)).resolves.toBe(false);
        await expect(manager.startMotion("Idle", 0, MotionPriority.FORCE)).resolves.toBe(false);

        await expect(manager.startMotion("Idle", 1, MotionPriority.NORMAL)).resolves.toBe(true);
        await expect(manager.startMotion("Idle", 1, MotionPriority.NORMAL)).resolves.toBe(false);
        await expect(manager.startMotion("Idle", 2, MotionPriority.FORCE)).resolves.toBe(true);
        await expect(manager.startMotion("Idle", 2, MotionPriority.FORCE)).resolves.toBe(false);
    });

    test("pending as IDLE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const startMotionPromise = manager.startMotion("Idle", 0, MotionPriority.IDLE);

        await expect(manager.startMotion("Idle", 0, MotionPriority.IDLE)).resolves.toBe(false);
        await expect(manager.startMotion("Idle", 0, MotionPriority.NORMAL)).resolves.toBe(false);
        await expect(manager.startMotion("Idle", 0, MotionPriority.FORCE)).resolves.toBe(false);

        loaderMock.unblockAll();
        await expect(startMotionPromise).resolves.toBe(true);
    });

    test("pending as NORMAL", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const startMotionPromise = manager.startMotion("Idle", 1, MotionPriority.NORMAL);

        await expect(manager.startMotion("Idle", 1, MotionPriority.NORMAL)).resolves.toBe(false);

        loaderMock.unblockAll();
        await expect(startMotionPromise).resolves.toBe(true);
    });

    test("pending as FORCE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const startMotionPromise = manager.startMotion("Idle", 2, MotionPriority.FORCE);

        await expect(manager.startMotion("Idle", 2, MotionPriority.FORCE)).resolves.toBe(false);

        loaderMock.unblockAll();
        await expect(startMotionPromise).resolves.toBe(true);
    });
});

describe("handles race conditions", async () => {
    test("IDLE -> NORMAL", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();

        const idle = manager.startMotion("Idle", 0, MotionPriority.IDLE);
        const normal = manager.startMotion("Tap", 0, MotionPriority.NORMAL);

        loaderMock.unblock(TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0]!.File);
        await expect(normal).resolves.toBe(true);

        loaderMock.unblock(TEST_MODEL4.modelJson.FileReferences.Motions.Idle[0]!.File);
        await expect(idle).resolves.toBe(false);
    });

    test("NORMAL -> FORCE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();

        const normal = manager.startMotion("Tap", 0, MotionPriority.NORMAL);
        const force = manager.startMotion("Tap", 1, MotionPriority.FORCE);

        loaderMock.unblock(TEST_MODEL4.modelJson.FileReferences.Motions.Tap[1]!.File);
        await expect(force).resolves.toBe(true);

        loaderMock.unblock(TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0]!.File);
        await expect(normal).resolves.toBe(false);
    });

    test("FORCE -> FORCE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();

        const force0 = manager.startMotion("Tap", 0, MotionPriority.FORCE);
        const force1 = manager.startMotion("Tap", 1, MotionPriority.FORCE);

        loaderMock.unblock(TEST_MODEL4.modelJson.FileReferences.Motions.Tap[1]!.File);
        await expect(force1).resolves.toBe(true);

        loaderMock.unblock(TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0]!.File);
        await expect(force0).resolves.toBe(false);
    });
});

test("does not break the motion when its sound file fails to play", async ({ manager }) => {
    config.sound = true;
    const play = vi
        .spyOn(SoundManager, "play")
        .mockImplementation(() => Promise.reject(new Error("foo")));

    await expect(manager.startMotion("Tap", 0)).resolves.toBe(true);

    expect(play).toHaveBeenCalled();
});

test("startRandomMotion() does not try to start a motion that already failed to load", async ({
    manager,
    loaderMock,
}) => {
    loaderMock.rewrite((url) => url.replace("Idle", "asdfasdf"));

    for (let i = 0; i < TEST_MODEL4.modelJson.FileReferences.Motions.Idle.length; i++) {
        await manager.startMotion("Idle", i);
    }

    const loadMotion = vi.spyOn(manager, "loadMotion");

    await expect(manager.startRandomMotion("Idle")).resolves.toBe(false);
    expect(loadMotion).not.toHaveBeenCalled();
});

test("handles user events", async ({ manager, coreModel, loaderMock }) => {
    const motionFile = TEST_MODEL4.modelJson.FileReferences.Motions.Idle[0]!.File;
    loaderMock.block(motionFile);

    const emittedEvent = new Promise((resolve) => manager.on("motion:test", resolve));

    await Promise.all([
        manager.startMotion("Idle", 0),
        loaderMock.onLoaded(motionFile).then(() => {
            loaderMock.unblock(motionFile, (data: CubismSpec.MotionJSON) => {
                data.Meta.UserDataCount = 1;
                data.UserData = [{ Time: 0.0, Value: "test" }];
            });
        }),
    ]);

    manager.update(coreModel, 100);

    await emittedEvent;
});

describe("uses fading durations", () => {
    test("falls back to fading durations in the config", async ({ createManager, coreModel }) => {
        config.motionFadingDuration = 1000 * 100;
        config.idleMotionFadingDuration = 1000 * 200;

        const manager = createManager.run({ idleMotionGroup: "non-existent" });

        manager.definitions["Tap"]![0]!.FadeInTime = undefined;
        manager.definitions["Tap"]![0]!.FadeOutTime = undefined;
        manager.definitions["Idle"]![0]!.FadeInTime = undefined;
        manager.definitions["Idle"]![0]!.FadeOutTime = undefined;

        await expect(manager.startMotion("Tap", 0)).resolves.toBe(true);

        manager.update(coreModel, 0);
        manager.update(coreModel, 1000 * 50);
        expect(manager.playing).to.be.true;

        manager.update(coreModel, 1000 * 50 + 100);
        expect(manager.playing).to.be.false;

        await expect(manager.startMotion("Idle", 0)).resolves.toBe(true);

        manager.update(coreModel, 0);
        manager.update(coreModel, 1000 * 100);
        expect(manager.playing).to.be.true;

        manager.update(coreModel, 1000 * 100 + 100);
        expect(manager.playing).to.be.false;
    });

    test("uses fading duration defined in Cubism 4 motion json", async ({
        manager,
        coreModel,
        loaderMock,
    }) => {
        const motionFile = TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0]!.File;
        loaderMock.block(motionFile);

        await Promise.all([
            manager.startMotion("Tap", 0),
            loaderMock.onLoaded(motionFile).then(() => {
                loaderMock.unblock(motionFile, (data: CubismSpec.MotionJSON) => {
                    data.Meta.FadeInTime = 1000 * 100;
                    data.Meta.FadeOutTime = 1000 * 200;
                });
            }),
        ]);

        manager.update(coreModel, 0);
        manager.update(coreModel, 1000 * 100);
        expect(manager.playing).to.be.true;

        manager.update(coreModel, 1000 * 100 + 100);
        expect(manager.playing).to.be.false;
    });
});
