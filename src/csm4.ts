export * from '@cubism/index';
export * from './common';
export * from './cubism4';

// there's a conflict on "config" from both "@cubism" and "common",
// so it needs to be explicitly exported
import { config } from './common';
export { config };
