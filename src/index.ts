export * from './cmd';
export * from './env';
export * from './interceptor';
export * from './storage';
export * from './task';
export * from './default';
export * from './png.util';
export * from './ztests';

import * as console2 from 'console';
global.console = console2;
jest.setTimeout(30_000); // default timeout for each test

