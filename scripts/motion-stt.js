const assert = require('assert');

const STATE_TRANSITION_TABLE = `
                        NONE    IDLE    NORMAL  FORCE
Playing none
Reserved none           none    C       C       C

Playing A as IDLE
Reserved none           A       A       C       C

Playing A as NORMAL
Reserved none           A       A       A       C

Playing A as FORCE
Reserved none           A       A       A       C

Playing A as IDLE
Reserved B as NORMAL    B       B       B       C

Playing A as NORMAL
Reserved B as FORCE     B       B       B       C

Playing A as FORCE
Reserved B as FORCE     B       B       B       C

Playing none
Reserved B as IDLE      B       B       C       C

Playing none
Reserved B as FORCE     B       B       B       C

Playing none
Reserved B as FORCE     B       B       B       C
`;

const inputPriorities = [];
const currentStates = [];
const results = [];

const normalizeMotion = motion => motion === 'none' ? undefined : motion;

STATE_TRANSITION_TABLE.trim().split('\n').forEach((line, lineNumber) => {
    if (lineNumber === 0) {
        inputPriorities.push(...line.split(' ').filter(Boolean));
        return;
    }

    const keywords = line.split(' ').map(s => s.trim().replace(/playing|reserved|as/i, '')).filter(Boolean);

    switch ((lineNumber - 1) % 3) {
        case 0:
            currentStates.push({
                playing: normalizeMotion(keywords[0]),
                playingPriority: keywords[1],
            });
            break;

        case 1:
            Object.assign(currentStates[currentStates.length - 1], {
                reserved: normalizeMotion(keywords[0]),
                reservedPriority: keywords.length === 5 ? undefined : keywords[1],
            });

            results.push(...keywords.slice(-4).map(normalizeMotion));
            break;
    }
});

const isPriority = str => str === undefined || /NONE|IDLE|NORMAL|FORCE/.test(str);
const isMotion = str => str === undefined || /[ABC]/.test(str);

// validate the parsing result
assert(inputPriorities.length * currentStates.length === results.length);
assert(inputPriorities.every(col => isPriority(col)));
assert(currentStates.every(row => isMotion(row.playing) && isMotion(row.reserved) && isPriority(row.playingPriority) && isPriority(row.playingPriority)));
assert(results.every(item => isMotion(item)));

module.exports = {
    STT: {
        inputPriorities,
        currentStates,
        results,
    },
};
