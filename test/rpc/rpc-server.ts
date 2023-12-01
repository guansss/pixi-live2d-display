import { createBirpc } from "birpc";
import type { Plugin } from "vite";
import { WebSocketServer } from "ws";
import { TEST_RPC_ENDPOINT } from "../constants";
import { handleToMatchImageSnapshot } from "./image-snapshot-server";

const rpcFunctions = {
    hi: () => "Hello my sweetheart!",
    toMatchImageSnapshot: handleToMatchImageSnapshot,
};

export type RpcFunctions = typeof rpcFunctions;

export function testRpcPlugin(): Plugin {
    return {
        name: "test-rpc",
        configureServer(server) {
            const wss = new WebSocketServer({ noServer: true });

            server.httpServer?.on("upgrade", (request, socket, head) => {
                if (!request.url) return;

                const { pathname } = new URL(request.url, `http://${request.headers.host}`);
                if (pathname !== TEST_RPC_ENDPOINT) return;

                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit("connection", ws, request);

                    createBirpc(rpcFunctions, {
                        post: (msg: string) => ws.send(msg),
                        on: (fn) => ws.on("message", fn),
                        serialize: JSON.stringify,
                        deserialize: JSON.parse,
                    });
                });
            });
        },
    };
}
