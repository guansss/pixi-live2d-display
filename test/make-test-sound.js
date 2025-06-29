// this code from https://gist.github.com/vanyle/c31dcd43d450543e423f8fa745ae67e2

// This function only generates pure frequencies but you can customize the waveform
// by changing the function at line ~50 (the one with the cos)

export function makeTestSound(freq, volume, duration, fadeout) {
    // Generate a wav binary file, convert it to a blob and play it.
    // https://fr.wikipedia.org/wiki/Waveform_Audio_File_Format#Structure_des_fichiers_WAV

    const sampling = 44100; // in hertz
    duration = duration || 1; // in seconds
    const sampleCount = Math.floor(sampling * duration);

    volume = volume || 0.5;
    if (volume > 1) volume = 1;
    if (volume < 0) volume = 0; // clamp
    volume = Math.floor(volume * 256 * 256); // convert to 16 bit integer

    freq = freq || 440; // nice default freq

    // Helper function to build binary files
    function toBytes(value, bytes) {
        let result = "";
        for (; bytes > 0; bytes--) {
            result += String.fromCharCode(value & 255);
            value >>= 8;
        }
        return result;
    }

    let samples = "";

    // Example of a fade: linear fade.
    // fadeout = fadeout || ((t,max) => (max-t)/max);

    // By default, be use a fancy "fast attack, slow descent" fade
    fadeout =
        fadeout ||
        ((t, max) => {
            const attackRatio = 0.01;
            if (t / max < attackRatio) {
                // fast attack
                return t / max / attackRatio;
            } else {
                // slow descent (linear)
                return (1 - t / max) / (1 - attackRatio);
            }
        });

    for (let i = 0; i < sampleCount; i++) {
        samples += toBytes(
            ((Math.cos((2 * Math.PI * i * freq) / sampling) + 1) / 2) *
                volume *
                fadeout(i, sampleCount),
            2,
        );
    }

    let dataChunk = [
        "fmt ",
        "\x10\x00\x00\x00", // 16: chunk length
        "\x01\x00", // audio format, PCM integer
        "\x01\x00", // mono
        toBytes(sampling, 4),
        toBytes(sampling * 2, 4), // bytes / sec
        "\x02\x00", // bytes per bloc
        "\x10\x00", // bytes per sample
        "data",
        toBytes(sampleCount * 2, 4),
        samples,
    ].join("");

    let wav = ["RIFF", toBytes(20 + dataChunk.length, 4), "WAVE", dataChunk].join("");

    let uint8 = new Uint8Array(wav.length);
    for (let i = 0; i < uint8.length; i++) {
        uint8[i] = wav.charCodeAt(i);
    }

    let blob = new Blob([uint8], { type: "audio/wav" });
    return URL.createObjectURL(blob);
}
