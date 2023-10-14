/// <reference types="vitest" />

import path from "path";
import { UserConfig, defineConfig } from "vite";
import packageJson from "./package.json";
import { testRpcPlugin } from "./test/rpc/rpc-server";
import { existsSync, readFileSync } from "fs";

const cubism2Core = path.resolve(__dirname, "core/live2d.min.js");
const cubism4Core = path.resolve(__dirname, "core/live2dcubismcore.js");

if (!existsSync(cubism2Core) || !existsSync(cubism4Core)) {
    throw new Error("Cubism Core not found. Please run `npm run setup` to download them.");
}

export default defineConfig(({ command, mode }) => {
    const isDev = command === "serve";

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
            open: "/playground/index.html",
        },
        build: {
            target: "es6",
            lib: {
                entry: "",
                name: "PIXI.live2d",
            },
            rollupOptions: {
                external(id, parentId, isResolved) {
                    return id.startsWith("@pixi/");
                },
                output: {
                    extend: true,
                    globals(id: string) {
                        if (id.startsWith("@pixi/")) {
                            // eslint-disable-next-line @typescript-eslint/no-var-requires
                            return require(`./node_modules/${id}/package.json`).namespace || "PIXI";
                        }
                    },
                },
            },
            minify: false,
        },
        plugins: [
            testRpcPlugin(),
            {
                name: "load-cubism-core",
                enforce: "post",
                transform(code, id) {
                    if (id.includes("test/setup.ts")) {
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
            include: ["**/*.test.ts"],
            browser: {
                enabled: true,
                name: "chrome",
                slowHijackESM: false,
            },
            setupFiles: ["./test/setup.ts"],
        },
    };
});
