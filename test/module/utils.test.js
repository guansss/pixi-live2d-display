import { config } from '@/config';
import { copyArray, copyProperty, folderName, logger } from '@/utils';
import { runMiddlewares } from '@/utils/middleware';

describe('Utils', () => {
    describe('middlewares', function() {
        it('runMiddlewares', async function() {
            const results = [];

            await runMiddlewares([
                async (ctx, next) => {
                    expect(ctx.foo).to.equal(1);

                    results.push(1);
                    await next();
                    results.push(4);
                },
                (ctx, next) => {
                    results.push(2);
                    return next();
                },
                () => results.push(3),
            ], { foo: 1 });

            expect(results).to.eql([1, 2, 3, 4]);

            const err = new Error('wtf');
            expect(runMiddlewares([async () => {throw err;}], {})).to.be.rejectedWith(err);
            expect(runMiddlewares([() => {throw err;}], {})).to.be.rejectedWith(err);
            expect(runMiddlewares([(ctx, next) => next(err)], {})).to.be.rejectedWith(err);
        });
    });

    describe('logger', () => {
        it('should obey log level config', function() {
            sinon.stub(console, 'log');
            sinon.stub(console, 'warn');
            sinon.stub(console, 'error');

            const originalLogLevel = config.logLevel;

            config.logLevel = config.LOG_LEVEL_ERROR;
            logger.error('foo', 'bar');
            expect(console.error).to.be.calledOnceWith('[foo]', 'bar');

            config.logLevel = config.LOG_LEVEL_WARNING;
            logger.warn('foo', 'bar');
            expect(console.warn).to.be.calledOnceWith('[foo]', 'bar');

            config.logLevel = config.LOG_LEVEL_VERBOSE;
            logger.log('foo', 'bar');
            expect(console.log).to.be.calledOnceWith('[foo]', 'bar');

            console.log.resetHistory();
            config.logLevel = config.LOG_LEVEL_NONE;
            logger.log('foo', 'bar');
            expect(console.log).to.not.be.called;

            config.logLevel = originalLogLevel;

            sinon.restore();
        });
    });

    describe('obj', function() {
        it('copyProperty', function() {
            const clone = {};

            copyProperty('number', { n: 1 }, clone, 'n', 'num');

            expect(clone).to.have.property('num', 1);
        });

        it('copyArray', function() {
            const clone = {};

            copyArray('number', { a: [1] }, clone, 'a', 'arr');

            expect(clone).to.have.nested.property('arr[0]', 1);
        });
    });

    describe('string', () => {
        expect(folderName('foo/bar/baz.js')).to.equal('bar');
        expect(folderName('bar/baz.js')).to.equal('bar');
        expect(folderName('bar/')).to.equal('bar');
        expect(folderName('/bar/')).to.equal('bar');
        expect(folderName('baz.js')).to.equal('baz.js');
    });
});
