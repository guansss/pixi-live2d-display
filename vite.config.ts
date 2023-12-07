/// <reference types="vitest" />

import { existsSync, readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { BaseSequencer } from "vitest/node";
import packageJson from "./package.json";
import { testRpcPlugin } from "./test/rpc/rpc-server";

const cubism2Core = path.resolve(__dirname, "core/live2d.min.js");
const cubism4Core = path.resolve(__dirname, "core/live2dcubismcore.js");

if (!existsSync(cubism2Core) || !existsSync(cubism4Core)) {
    throw new Error("Cubism Core not found. Please run `npm run setup` to download them.");
}

export default defineConfig(({ command, mode }) => {
    const isDev = command === "serve";
    const isTest = mode === "test";

    return {
        define: {
            __DEV__: isDev,
            __VERSION__: JSON.stringify(packageJson.version),

            // test env
            __HEADLESS__: process.env.CI === "true",
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
                "@cubism": path.resolve(__dirname, "cubism/src"),
            },
        },
        server: {
            open: !isTest && "/playground/index.html",
        },
        build: {
            target: "es6",
            lib: {
                entry: "",
                name: "PIXI.live2d",
            },
            rollupOptions: {
                external(id, parentId, isResolved) {
                    if (id === "pixi.js") {
                        throw new Error("do not import pixi.js, import @pixi/* instead");
                    }

                    return id.startsWith("@pixi/");
                },
                output: {
                    extend: true,
                    globals(id: string) {
                        if (id.startsWith("@pixi/")) {
                            const packageJsonPath = path.resolve(
                                __dirname,
                                `./node_modules/${id}/package.json`,
                            );
                            const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
                            return packageJson.namespace || "PIXI";
                        }
                    },
                },
            },
            minify: false,
        },
        plugins: [
            // pixi.js imports a polyfill package named "url", which breaks Vitest
            // see https://github.com/vitest-dev/vitest/issues/4535
            isTest && nodePolyfills(),

            isTest && testRpcPlugin(),
            isTest && {
                name: "load-cubism-core",
                enforce: "post" as const,
                transform(code, id) {
                    if (id.includes("test/load-cores.ts")) {
                        code = code.replace(
                            "__CUBISM2_CORE_SOURCE__",
                            readFileSync(cubism2Core, "utf-8"),
                        );
                        code = code.replace(
                            "__CUBISM4_CORE_SOURCE__",
                            readFileSync(cubism4Core, "utf-8"),
                        );

                        return { code };
                    }
                },
            },
        ],
        test: {
            include: ["**/*.test.ts", "**/*.test.js"],
            browser: {
                enabled: true,
                name: "chrome",
                slowHijackESM: false,
            },
            setupFiles: ["./test/setup.ts"],
            sequence: {
                sequencer: class MySequencer extends BaseSequencer {
                    // use the default sorting, then put bundle tests at the end
                    // to make sure they will not pollute the environment for other tests
                    override async sort(files: Parameters<BaseSequencer["sort"]>[0]) {
                        files = await super.sort(files);

                        const bundleTestFiles: typeof files = [];

                        files = files.filter(([project, file]) => {
                            if (file.includes("bundle")) {
                                bundleTestFiles.push([project, file]);
                                return false;
                            }
                            return true;
                        });

                        return [...files, ...bundleTestFiles];
                    }
                },
            },
        },
    };
});
