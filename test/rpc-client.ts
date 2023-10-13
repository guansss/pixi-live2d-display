import { createBirpc } from "birpc";
import type { RpcFunctions } from "./rpc-server";
import { TEST_RPC_ENDPOINT } from "./constants";

let _rpc: ReturnType<typeof createRpc> | undefined;

export function rpc() {
    if (!_rpc) _rpc = createRpc();
    return _rpc;
}

function createRpc() {
    const url = new URL(TEST_RPC_ENDPOINT, location.href);
    url.protocol = url.protocol.replace(/^http/, "ws");

    let connectedWebSocket!: Promise<WebSocket>;
    let onMessage!: (ev: MessageEvent) => void;

    function createWebSocket() {
        const maxRetries = 5;
        const retryInterval = 500;
        let retries = 0;

        connectedWebSocket = new Promise((resolve, reject) => {
            const ws = new WebSocket(url);

            ws.addEventListener("open", () => {
                retries = 0;
                resolve(ws);
            });
            ws.addEventListener("message", (v) => {
                onMessage(v.data);
            });
            ws.addEventListener("close", () => {
                if (retries++ < maxRetries) {
                    console.log(`RPC disconnected, retrying in ${retryInterval}ms...`);
                    setTimeout(createWebSocket, retryInterval);
                } else {
                    console.warn(`RPC disconnected, giving up after ${maxRetries} retries`);
                }
            });
            ws.addEventListener("error", reject);
        });
    }

    createWebSocket();

    const dummy = {};

    return createBirpc<RpcFunctions, object>(dummy, {
        post: async (msg) => {
            (await connectedWebSocket).send(msg);
        },
        on: (fn) => (onMessage = fn),
        serialize: JSON.stringify,
        deserialize: JSON.parse,
    });
}
