import { config } from "@/config";
import { copyArray, copyProperty, folderName, logger } from "@/utils";
import { runMiddlewares } from "@/utils/middleware";
import { expect, test, vi } from "vitest";

test("middlewares", async () => {
    const numbers: number[] = [];

    await runMiddlewares(
        [
            async (ctx, next) => {
                expect(ctx.foo).to.equal(1);

                numbers.push(1);
                await next();
                numbers.push(4);
            },
            (ctx, next) => {
                numbers.push(2);
                return next();
            },
            () => {
                numbers.push(3);
            },
        ],
        { foo: 1 },
    );

    expect(numbers).to.eql([1, 2, 3, 4]);

    const err = new Error("wtf");
    await expect(
        runMiddlewares(
            [
                async () => {
                    throw err;
                },
            ],
            {},
        ),
    ).rejects.toThrow(err);
    await expect(
        runMiddlewares(
            [
                () => {
                    throw err;
                },
            ],
            {},
        ),
    ).rejects.toThrow(err);
    expect(runMiddlewares([(ctx, next) => next(err)], {})).rejects.toThrow(err);
});

test("logger", () => {
    const consoleLog = vi.spyOn(console, "log");
    const consoleWarn = vi.spyOn(console, "warn");
    const consoleError = vi.spyOn(console, "error");

    config.logLevel = config.LOG_LEVEL_ERROR;
    logger.error("foo", "bar");
    expect(consoleError).toHaveBeenCalledWith("[foo]", "bar");

    config.logLevel = config.LOG_LEVEL_WARNING;
    logger.warn("foo", "bar");
    expect(consoleWarn).toHaveBeenCalledWith("[foo]", "bar");

    config.logLevel = config.LOG_LEVEL_VERBOSE;
    logger.log("foo", "bar");
    expect(consoleLog).toHaveBeenCalledWith("[foo]", "bar");

    consoleLog.mockReset();
    config.logLevel = config.LOG_LEVEL_NONE;
    logger.log("foo", "bar");
    expect(console.log).not.toHaveBeenCalled();
});

test("copyProperty", () => {
    const clone = {};

    copyProperty("number", { n: 1 }, clone, "n", "num");

    expect(clone).to.have.property("num", 1);
});

test("copyArray", () => {
    const clone = {};

    copyArray("number", { a: [1] }, clone, "a", "arr");

    expect(clone).to.have.nested.property("arr[0]", 1);
});

test("string", () => {
    expect(folderName("foo/bar/baz.js")).to.equal("bar");
    expect(folderName("bar/baz.js")).to.equal("bar");
    expect(folderName("bar/")).to.equal("bar");
    expect(folderName("/bar/")).to.equal("bar");
    expect(folderName("baz.js")).to.equal("baz.js");
});
