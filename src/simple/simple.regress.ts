import {afterAll, beforeAll, describe, test} from '@jest/globals';
import {analyzeScreenshotComparison} from './analyze-screenshot-comparison';
import {Env, EnvList, TEnvArgs} from '../core';

export function simpleRegress(envArgs: TEnvArgs[], taskIds: any[], stage: any = 'test') {
  const envList = new EnvList(envArgs);
  testRun(envList, taskIds, stage);
}

async function testRun(envList: EnvList, taskIds: any[], stage: any) {

  beforeAll(async () => {
    await envList.init();
  });

  describe.each(envList.future())('%#. %s', getEnv => {
    test.each(taskIds)('%#. %s', async taskId => {
        const env = getEnv() as Env;
        const task = env.taskFactory.get(stage, taskId);
        env.run([task]);
        await analyzeScreenshotComparison(task);
      }
    );
  });

  afterAll(() => {
    envList.dispose();
  });

}
