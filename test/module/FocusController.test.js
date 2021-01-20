import { FocusController } from '@/cubism-common/FocusController';

describe('FocusController', function() {
    it('should focus on position with interpolation', function() {
        const controller = new FocusController();

        controller.focus(0.5, -0.5);

        expect(controller.x).to.not.equal(0.5);
        expect(controller.y).to.not.equal(-0.5);

        for (let i = 0; i < 100; i++) {
            controller.update(100);
        }

        expect(controller.x).to.be.approximately(0.5, 0.01);
        expect(controller.y).to.be.approximately(-0.5, 0.01);
    });

    it('should focus on position instantly', function() {
        const controller = new FocusController();

        controller.focus(0.5, -0.5, true);

        expect(controller.x).to.equal(0.5);
        expect(controller.y).to.equal(-0.5);
    });
});
