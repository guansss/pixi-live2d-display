const EPSILON = 0.01; // Minimum distance to respond

const MAX_SPEED = 40 / 7.5;
const ACCELERATION_TIME = 1 / (0.15 * 1000);

export class FocusController {
    targetX = 0;
    targetY = 0;
    x = 0;
    y = 0;

    vx = 0;
    vy = 0;

    /**
     * Focus in range [-1, 1].
     */
    focus(x: number, y: number) {
        this.targetX = x;
        this.targetY = y;
    }

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

        // so many sqrt's here, it's painful...
        // I tried hard to reduce the amount of them, but finally failed :(
    }
}
