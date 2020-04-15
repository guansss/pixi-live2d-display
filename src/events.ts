export interface Live2DModelEvents {
    /**
     * One or more hit areas are hit.
     * @event Live2DModel#hit
     * @param {string[]} hitAreas - The names of hit hit areas.
     */
    hit: [string[]];

    /**
     * A Live2D motion has started.
     * @event Live2DModel#motion
     * @param {string} group - Group of this motion.
     * @param {string} index - Index of this motion in group.
     * @param {HTMLAudioElement?} audio - The audio element used to play sound of this motion.
     */
    motion: [string, number, HTMLAudioElement?];
}
