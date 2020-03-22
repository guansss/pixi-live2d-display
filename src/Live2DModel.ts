import { Loader } from '@pixi/loaders';

export class Live2DModel {

    static fromModelSettings(url: string) {
        const loader = new Loader();

        loader.add(url)
            .load((loader, res) => console.log('result', res))
            .on('error', e => console.warn(`Failed to load Live2D model from ${url}:`, e));
    }
}
