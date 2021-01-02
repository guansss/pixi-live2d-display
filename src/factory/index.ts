import { Live2DLoader } from '@/factory/Live2DLoader';
import { XHRLoader } from '@/factory/XHRLoader';

Live2DLoader.middlewares.push(XHRLoader.loader);

export * from './Live2DFactory';
export * from './Live2DLoader';
export * from './XHRLoader';
