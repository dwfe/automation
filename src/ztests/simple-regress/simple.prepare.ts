import {EnvList} from '../../env';

export async function simplePrepare(envList: EnvList, stage: any = 'prepare') {
  await envList.init();
  for (const env of envList.get())
    await env.run([
      ...env.taskFactory.getAll(stage),
    ]);
  envList.dispose();
}
