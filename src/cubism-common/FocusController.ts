import { clamp } from '@/utils';

// Minimum distance to respond
const EPSILON = 0.01;

const MAX_SPEED = 40 / 7.5;

// the time to accelerate to max speed
const ACCELERATION_TIME = 1 / (0.15 * 1000);

/**
 * Interpolates the transition of focus position.
 */
export class FocusController {
    /** The focus position. */
    targetX = 0;

    /** The focus position. */
    targetY = 0;

    /** Current position. */
    x = 0;

    /** Current position. */
    y = 0;

    /** Current velocity. */
    vx = 0;

    /** Current velocity. */
    vy = 0;

    // TODO: focus instantly
    /**
     * Sets the focus position with range `[-1, 1]`.
     */
    focus(x: number, y: number) {
        this.targetX = clamp(x, -1, 1);
        this.targetY = clamp(y, -1, 1);
    }

    /**
     * Updates the interpolation.
     * @param dt - Delta time in milliseconds.
     */
    update(dt: DOMHighResTimeStamp) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) return;

        const d = Math.sqrt(dx ** 2 + dy ** 2);
        const maxSpeed = MAX_SPEED / (1000 / dt);

        let ax = maxSpeed * (dx / d) - this.vx;
        let ay = maxSpeed * (dy / d) - this.vy;

        const a = Math.sqrt(ax ** 2 + ay ** 2);
        const maxA = maxSpeed * ACCELERATION_TIME * dt;

        if (a > maxA) {
            ax *= maxA / a;
            ay *= maxA / a;
        }

        this.vx += ax;
        this.vy += ay;

        const v = Math.sqrt(this.vx ** 2 + this.vy ** 2);
        const maxV = 0.5 * (Math.sqrt(maxA ** 2 + 8 * maxA * d) - maxA);

        if (v > maxV) {
            this.vx *= maxV / v;
            this.vy *= maxV / v;
        }

        this.x += this.vx;
        this.y += this.vy;
    }
}
