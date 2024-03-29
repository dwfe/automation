import {IClassConstructor, IRunMode} from '@do-while-for-each/common'
import {BrowserContextOptions, LaunchOptions} from 'playwright'
import {PageScreenshotOptions} from 'playwright-core'
import {PixelmatchOptions} from 'pixelmatch'
import {TaskFactoryAbstract} from '../task';
import {IStorage} from '../storage'

export interface IEnvOpt {
  browserType: 'chromium' | 'webkit' | 'firefox';
  launchOpt: LaunchOptions;
  browserContext: BrowserContextOptions;
  screenshot: NonNullable<PageScreenshotOptions>;
  pixelmatch: PixelmatchOptions;
  taskFactory: {
    variant: IClassConstructor<TaskFactoryAbstract>;
  }
  storage: {
    variant: IClassConstructor<IStorage>;
    dir: string;    // главная папка хранилища
  },
  urlOrigin?: string; // используется там, где надо собрать url из относительного пути. Например, TaskExecutor при выполнении команды 'goto'
  isDebug?: boolean;
  leaveOpen?: {
    env?: boolean;           // флаг, надо ли закрыть окружение, когда у него будет вызван метод .close()
    pageOnTaskEnd?: boolean; // флаг, надо ли оставить страницу открытой после выполнения всех команд задачи
  },
  runMode?: IRunMode,
}

export type TEnvArgs = [IEnvOpt, string]; // [opt, id]
