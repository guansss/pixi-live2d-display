import { config, Cubism2ModelSettings, Cubism4ModelSettings, Live2DModel, MotionPreloadStrategy } from '@';
import { createTexture } from '@/factory/texture';
import { Application } from '@pixi/app';
import { Texture } from '@pixi/core';
import { merge } from 'lodash-es';
import sinon from 'sinon';
import { hiyori, TEST_MODEL, TEST_MODEL4, TEST_TEXTURE } from '../env';
import { createApp, delay } from '../utils';

describe('Live2DFactory', function() {
    const options = { autoUpdate: false, motionPreload: MotionPreloadStrategy.NONE };
    const originalLogLevel = config.logLevel;
    const fakeXHRs = [];
    let app;

    before(function() {
        app = createApp(Application, false);

        this.fakeXHR = sinon.useFakeXMLHttpRequest();

        const matchesFake = url => url.match(/fake/);

        XMLHttpRequest.useFilters = true;
        XMLHttpRequest.addFilter((method, url) => !matchesFake(url));

        this.fakeXHR.onCreate = xhr => {
            xhr.addEventListener('readystatechange', () => {
                if (xhr.readyState === XMLHttpRequest.OPENED && matchesFake(xhr.url)) {
                    // console.log('XHR faked: ', xhr.url, xhr);
                    fakeXHRs.push(xhr);
                }
            });
        };
    });

    after(function() {
        app.destroy(true, { children: true });
        this.fakeXHR.restore();
    });

    afterEach(function() {
        config.logLevel = originalLogLevel;
        fakeXHRs.length = 0;
    });

    it('should create Texture', async function() {
        await expect(createTexture(TEST_TEXTURE)).to.eventually.be.instanceOf(Texture);
        await expect(createTexture('fakeTexture')).to.be.rejected;
    });

    it('should create Live2DModel', async function() {
        // cubism2
        await expect(Live2DModel.from(TEST_MODEL.file, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(TEST_MODEL.json, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(new Cubism2ModelSettings(TEST_MODEL.json), options))
            .to.eventually.be.instanceOf(Live2DModel);

        // cubism4
        await expect(Live2DModel.from(TEST_MODEL4.file, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(TEST_MODEL4.json, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(new Cubism4ModelSettings(TEST_MODEL4.json), options))
            .to.eventually.be.instanceOf(Live2DModel);
    });

    it('should create derived Live2DModel', async () => {
        class DerivedLive2DModel extends Live2DModel {}

        await expect(DerivedLive2DModel.from(TEST_MODEL.file, options))
            .to.eventually.be.instanceOf(DerivedLive2DModel).and.instanceOf(Live2DModel);
    });

    it('should handle error', async function() {
        config.logLevel = config.LOG_LEVEL_ERROR;

        const creation = Live2DModel.from({ ...TEST_MODEL.json, model: 'fakeModel' }, options);

        // wait for runtime.ready()
        await delay(10);

        expect(fakeXHRs.length).to.equal(1);
        fakeXHRs[0].respond(404);

        try {
            await creation;

            throw new Error('The expected error was not thrown.');
        } catch (e) {
            expect(e).to.have.property('status', 404);
        }

        await expect(Live2DModel.from(merge({}, TEST_MODEL.json, { textures: ['fakeTexture'] }), options)).to.be.rejected;
    });

    it('should not freeze the process when having various cubism4 models at the same time', async function() {
        try {
            const response = await fetch(hiyori.file);
            if (!response.ok) throw new Error('Not OK');
        } catch (e) {
            // skip because missing the model in env
            this.skip();
        }

        const model1 = await Live2DModel.from(TEST_MODEL4.file, options);

        app.stage.addChild(model1);
        app.render();

        const model2 = await Live2DModel.from(hiyori.file, options);

        app.stage.addChild(model2);
        app.render();
    });

    it('should create model from a URL without extension', async function() {
        const fakeURL = TEST_MODEL.file.replace('.model.json', '-fake');

        expect(fakeURL).to.not.include('model.json');

        const modelCreation = Live2DModel.from(fakeURL);

        expect(fakeXHRs.length).to.equal(1);
        expect(fakeXHRs[0].url).to.equal(fakeURL);

        fakeXHRs[0].respond(200, {}, JSON.stringify(TEST_MODEL.json));

        const model = await modelCreation;

        expect(model).to.be.instanceOf(Live2DModel);
    });

    describe('Synchronous creation', function() {
        it('should create Live2DModel', async function() {
            const modelOptions = { ...options };

            const onLoadCalled = new Promise((resolve1, reject1) => {
                modelOptions.onLoad = resolve1;
                modelOptions.onError = reject1;
            });

            const model = Live2DModel.fromSync(TEST_MODEL.file, modelOptions);

            expect(model).to.be.instanceOf(Live2DModel);

            const eventEmitted = new Promise((resolve2, reject2) => {
                model.on('ready', () => {
                    try {
                        app.stage.addChild(model);
                        model.update(100);

                        // expect no errors
                        app.render();
                    } catch (e) {
                        reject2(e);
                    }
                })
                    .on('load', () => {
                        try {
                            app.render();
                            app.stage.removeChild(model);
                            model.destroy();

                            resolve2();
                        } catch (e) {
                            reject2(e);
                        }
                    });
            });

            return Promise.all([onLoadCalled, eventEmitted]);
        });

        it('should emit events', function(done) {
            const events = {
                settingsJSONLoaded: undefined,
                settingsLoaded: undefined,
                textureLoaded: undefined,
                modelLoaded: undefined,
                poseLoaded: undefined,
                physicsLoaded: undefined,
                ready: undefined,
                load: undefined,
            };

            const model = Live2DModel.fromSync(TEST_MODEL.file, { ...options, onLoad, onError: done });

            Object.keys(events).forEach(event => {
                // create a named function for spy to prettify the print message
                events[event] = sinon.spy(new Function('return function ' + event + '(){}')());

                model.on(event, events[event]);
            });

            function onLoad() {
                Object.entries(events).forEach(([event, handler]) => {
                    expect(handler).to.be.calledOnce;
                });

                expect(events.modelLoaded).to.be.calledBefore(events.poseLoaded);
                expect(events.modelLoaded).to.be.calledBefore(events.physicsLoaded);
                expect(events.modelLoaded).to.be.calledBefore(events.ready);
                expect(events.textureLoaded).to.be.calledBefore(events.ready);

                expect(events.poseLoaded).to.be.calledBefore(events.load);
                expect(events.physicsLoaded).to.be.calledBefore(events.load);
                expect(events.ready).to.be.calledBefore(events.load);

                done();
            }
        });

        it('should handle error', async function() {
            config.logLevel = config.LOG_LEVEL_ERROR;

            await new Promise(async (resolve, reject) => {
                Live2DModel.fromSync({
                    ...TEST_MODEL.json,
                    model: 'fakeModel',
                }, {
                    ...options,
                    onLoad: () => reject(new Error('Unexpected onLoad() call.')),
                    onError(e) {
                        try {
                            expect(e).to.be.an('error').with.property('status', 404);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    },
                });

                // wait for runtime.ready()
                await delay(10);

                expect(fakeXHRs.length).to.equal(1);

                fakeXHRs[0].respond(404);
            });

            await new Promise((resolve, reject) => {
                Live2DModel.fromSync(
                    merge({}, TEST_MODEL.json, { textures: ['fakeTexture'] }),
                    {
                        ...options,
                        onLoad: () => reject(new Error('Unexpected onLoad() call.')),
                        onError(e) {
                            try {
                                expect(e).to.be.an('error');
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        },
                    },
                );
            });
        });
    });
});
