import { logger } from '@/utils';

export enum MotionPriority {
    NONE, IDLE, NORMAL, FORCE
}

export class MotionState {
    tag!: string;

    debug = false;

    /**
     * Priority of currently playing motion.
     */
    currentPriority = MotionPriority.NONE;

    /**
     * Priority of reserved motion, i.e. the motion that will play subsequently.
     */
    reservePriority = MotionPriority.NONE;

    /**
     * ID of currently playing motion.
     */
    currentGroup?: string;
    currentIndex?: number;

    /**
     * ID of motion that is still loading and will be played once loaded.
     */
    reservedGroup?: string;
    reservedIndex?: number;

    reservedIdleGroup?: string;
    reservedIdleIndex?: number;

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

    complete() {
        this.setCurrent(undefined, undefined, MotionPriority.NONE);
    }

    setCurrent(group: string | undefined, index: number | undefined, priority: MotionPriority) {
        this.currentPriority = priority;
        this.currentGroup = group;
        this.currentIndex = index;
    }

    setReserved(group: string | undefined, index: number | undefined, priority: MotionPriority) {
        this.reservePriority = priority;
        this.reservedGroup = group;
        this.reservedIndex = index;
    }

    setReservedIdle(group: string | undefined, index: number | undefined) {
        this.reservedIdleGroup = group;
        this.reservedIdleIndex = index;
    }

    clear() {
        this.setCurrent(undefined, undefined, MotionPriority.NONE);

        // make sure the reserved motions (if existing) won't start when they are loaded
        this.setReserved(undefined, undefined, MotionPriority.NONE);
        this.setReservedIdle(undefined, undefined);
    }

    isClear(): boolean {
        return this.currentGroup === undefined && this.reservedGroup === undefined && this.reservedIdleGroup === undefined;
    }

    shouldOverrideExpression(): boolean {
        return this.currentPriority > MotionPriority.IDLE;
    }

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
