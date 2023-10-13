/// <reference types="vitest" />

import path from "path";
import { defineConfig } from "vite";
import packageJson from "./package.json";
import { testRpcPlugin } from "./test/rpc-server";

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
        plugins: [testRpcPlugin()],
        test: {
            include: ["**/*.test.ts"],
            browser: {
                enabled: true,
                name: "chrome",
            },
        },
    };
});
