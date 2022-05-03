import * as playwright from 'playwright';
import {Browser, BrowserContext, Page} from 'playwright';
import {prepareEnv} from '@do-while-for-each/env';
import {IAutomationEnvironmentOpt, IStorage, ITask} from './contract'
import {TaskExecutor} from './task.executor';
import {PngUtils} from './png.utils';

export class AutomationEnvironment {

  static async of(opt: IAutomationEnvironmentOpt, id: string): Promise<AutomationEnvironment> {
    const {runMode, browserType, launchOpt, browserContext} = opt;
    prepareEnv(runMode || 'test');
    const browser = await playwright[browserType].launch(launchOpt);
    await browser.newContext(browserContext);
    return new AutomationEnvironment(id, browser, opt)
  }

  readonly taskExecutor: TaskExecutor;
  readonly pngUtils: PngUtils;
  readonly storage: IStorage;

  constructor(public readonly id: string,
              public readonly browser: Browser,
              public readonly opt: IAutomationEnvironmentOpt) {
    this.taskExecutor = new TaskExecutor(this);
    this.pngUtils = new PngUtils(this);
    this.storage = new opt.storage.variant(this);
  }

  close() {
    if (!this.opt.isLeaveOpen?.env)
      this.browser.close();
    this.storage.clean();
  }

  get firstBrowserContext(): BrowserContext {
    return this.browser.contexts()[0];
  }

  /**
   * New Tab.
   * Будут переиспользованы ранее произведенные авторизации на реусрсах, куки и т.п.
   */
  async newPage(): Promise<Page> {
    return await this.firstBrowserContext.newPage();
  }

  async run(tasks: ITask[]) {
    await this.taskExecutor.run(tasks);
  }

  debug(...args: string[]) {
    if (!this.opt.isDebug)
      return;
    console.log(...args);
  }

}
