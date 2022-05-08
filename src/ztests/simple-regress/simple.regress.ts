import {afterAll, beforeAll, describe, test} from '@jest/globals';
import {analyzeScreenshotComparison} from './analyze-screenshot-comparison';
import {Env, EnvList} from '../../env';

export function simpleRegress(envList: EnvList, taskIds: any[], stage: any = 'test') {

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
