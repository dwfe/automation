import {EnvList} from '../../env';

export async function simplePrepare(envList: EnvList, taskIds: any[], stage: any = 'prepare') {
  await envList.init();
  for (const env of envList.get())
    await env.run([
      ...env.taskFactory.getAll(taskIds, stage),
    ]);
  envList.dispose();
}
