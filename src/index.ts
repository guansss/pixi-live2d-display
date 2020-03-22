import { Loader } from '@pixi/loaders';
import { Live2DLoader } from './live2d';

Loader.registerPlugin(Live2DLoader);

export * from './Live2DModel';
