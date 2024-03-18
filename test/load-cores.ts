declare const __CUBISM2_CORE_SOURCE__: string;
declare const __CUBISM4_CORE_SOURCE__: string;

const excludedLogs = [
    `Live2D %s`,
    `profile : Desktop`,
    `[PROFILE_NAME]`,
    `[USE_ADJUST_TRANSLATION]`,
    `[USE_CACHED_POLYGON_IMAGE]`,
    `[EXPAND_W]`,
    `Live2D Cubism SDK Core Version`,
    `[CSM][I]`,
];

const log = console.log;
console.log = function (...args) {
    const firstArg = args[0];

    if (typeof firstArg === "string" && excludedLogs.some((log) => firstArg.includes(log))) {
        return;
    }

    log(...args);
};

(() => {
    __CUBISM2_CORE_SOURCE__;
})();
(() => {
    __CUBISM4_CORE_SOURCE__;
    window.Live2DCubismCore = Live2DCubismCore;
})();

console.log = log;
