import {EnvList, TEnvArgs} from '../../env';

export async function simplePrepare(envArgs: TEnvArgs[], taskIds: any[], stage: any = 'prepare') {
  const envList = new EnvList(envArgs);
  await envList.init();
  for (const env of envList.get())
    await env.run([
      ...env.taskFactory.getAll(taskIds, stage),
    ]);
  envList.dispose();
}
