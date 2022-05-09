export * from './core';
export * from './simple';

import * as console2 from 'console';

global.console = console2;
jest.setTimeout(30_000); // default timeout for each test

