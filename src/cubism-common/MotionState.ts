import { logger } from '@/utils';

/**
 * Indicates the motion priority.
 */
export enum MotionPriority {
    /** States that the model is currently not playing any motion. This priority cannot be applied to a motion. */
    NONE,

    /** Low priority, used when starting idle motions automatically. */
    IDLE,

    /** Medium priority. */
    NORMAL,

    /** High priority. Motions as this priority will always be played regardless of the current priority. */
    FORCE
}

/**
 * Handles the state of a MotionManager.
 */
export class MotionState {
    /**
     * Tag for logging.
     */
    tag!: string;

    /**
     * When enabled, the states will be dumped to the logger when an exception occurs.
     */
    debug = false;

    /**
     * Priority of the current motion. Will be `MotionPriority.NONE` if there's no playing motion.
     */
    currentPriority = MotionPriority.NONE;

    /**
     * Priority of the reserved motion, which is still in loading and will be played once loaded.
     * Will be `MotionPriority.NONE` if there's no reserved motion.
     */
    reservePriority = MotionPriority.NONE;

    /**
     * Group of current motion.
     */
    currentGroup?: string;

    /**
     * Index of current motion in its group.
     */
    currentIndex?: number;

    /**
     * Group of the reserved motion.
     */
    reservedGroup?: string;

    /**
     * Index of the reserved motion in its group.
     */
    reservedIndex?: number;

    /**
     * Group of the reserved idle motion.
     */
    reservedIdleGroup?: string;

    /**
     * Index of the reserved idle motion in its group.
     */
    reservedIdleIndex?: number;

    /**
     * Reserves the playback for a motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @return True if the reserving has succeeded.
     */
    reserve(group: string, index: number, priority: MotionPriority): boolean {
        if (priority <= MotionPriority.NONE) {
            logger.log(this.tag, `Cannot start a motion with MotionPriority.NONE.`);
            return false;
        }

        if (group === this.currentGroup && index === this.currentIndex) {
            logger.log(this.tag, `Motion is already playing.`, this.dump(group, index));
            return false;
        }

        if ((group === this.reservedGroup && index === this.reservedIndex) || (group === this.reservedIdleGroup && index === this.reservedIdleIndex)) {
            logger.log(this.tag, `Motion is already reserved.`, this.dump(group, index));
            return false;
        }

        if (priority === MotionPriority.IDLE) {
            if (this.currentPriority !== MotionPriority.NONE) {
                logger.log(this.tag, `Cannot start idle motion because another motion is playing.`, this.dump(group, index));
                return false;
            }

            if (this.reservedIdleGroup !== undefined) {
                logger.log(this.tag, `Cannot start idle motion because another idle motion has reserved.`, this.dump(group, index));
                return false;
            }

            this.setReservedIdle(group, index);
        } else {
            if (priority < MotionPriority.FORCE) {
                if (priority <= this.currentPriority) {
                    logger.log(this.tag, 'Cannot start motion because another motion is playing as an equivalent or higher priority.', this.dump(group, index));
                    return false;
                }

                if (priority <= this.reservePriority) {
                    logger.log(this.tag, 'Cannot start motion because another motion has reserved as an equivalent or higher priority.', this.dump(group, index));
                    return false;
                }
            }

            this.setReserved(group, index, priority);
        }

        return true;
    }

    /**
     * Requests the playback for a motion.
     * @param motion - The Motion, can be undefined.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @return True if the request has been approved, i.e. the motion is allowed to play.
     */
    start(motion: any, group: string, index: number, priority: MotionPriority): boolean {
        if (priority === MotionPriority.IDLE) {
            this.setReservedIdle(undefined, undefined);

            if (this.currentPriority !== MotionPriority.NONE) {
                logger.log(this.tag, 'Cannot start idle motion because another motion is playing.', this.dump(group, index));
                return false;
            }
        } else {
            if (group !== this.reservedGroup || index !== this.reservedIndex) {
                logger.log(this.tag, 'Cannot start motion because another motion has taken the place.', this.dump(group, index));
                return false;
            }

            this.setReserved(undefined, undefined, MotionPriority.NONE);
        }

        if (!motion) {
            return false;
        }

        this.setCurrent(group, index, priority);

        return true;
    }

    /**
     * Notifies the motion playback has finished.
     */
    complete() {
        this.setCurrent(undefined, undefined, MotionPriority.NONE);
    }

    /**
     * Sets the current motion.
     */
    setCurrent(group: string | undefined, index: number | undefined, priority: MotionPriority) {
        this.currentPriority = priority;
        this.currentGroup = group;
        this.currentIndex = index;
    }

    /**
     * Sets the reserved motion.
     */
    setReserved(group: string | undefined, index: number | undefined, priority: MotionPriority) {
        this.reservePriority = priority;
        this.reservedGroup = group;
        this.reservedIndex = index;
    }

    /**
     * Sets the reserved idle motion.
     */
    setReservedIdle(group: string | undefined, index: number | undefined) {
        this.reservedIdleGroup = group;
        this.reservedIdleIndex = index;
    }

    // TODO: rename to reset
    /**
     * Resets the state.
     */
    clear() {
        this.setCurrent(undefined, undefined, MotionPriority.NONE);

        // make sure the reserved motions (if existing) won't start when they are loaded
        this.setReserved(undefined, undefined, MotionPriority.NONE);
        this.setReservedIdle(undefined, undefined);
    }

    /**
     * Checks if an idle motion should be requests to play.
     */
    shouldRequestIdleMotion(): boolean {
        return this.currentGroup === undefined && this.reservedIdleGroup === undefined;
    }

    /**
     * Checks if the model's expression should be overridden by the motion.
     */
    shouldOverrideExpression(): boolean {
        return this.currentPriority > MotionPriority.IDLE;
    }

    /**
     * Dumps the state for debugging.
     */
    dump(requestedGroup?: string, requestedIndex?: number): string {
        if (this.debug) {
            const keys: (keyof this)[] = [
                'currentPriority',
                'reservePriority',
                'currentGroup',
                'currentIndex',
                'reservedGroup',
                'reservedIndex',
                'reservedIdleGroup',
                'reservedIdleIndex',
            ];
            return `\n<Requested> group = "${requestedGroup}", index = ${requestedIndex}\n` + keys.map(key => '[' + key + '] ' + this[key]).join('\n');
        }
        return '';
    }
}
