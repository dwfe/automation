import * as playwright from 'playwright';
import {Browser, BrowserContext, Page} from 'playwright';
import {config} from 'dotenv';
import {IAutomationEnvironmentOptions, IStorage, ITask} from './contract';
import {TaskExecutor} from './task.executor';
import {PngUtils} from './png.utils';

export class AutomationEnvironment {

  static async of(options: IAutomationEnvironmentOptions, id: string): Promise<AutomationEnvironment> {
    config(); // перенести переменные окружения в process.env

    const browser = await playwright[options.browserType].launch(options.browser);
    await browser.newContext(options.browserContext);
    return new AutomationEnvironment(id, browser, options)
  }

  readonly taskExecutor: TaskExecutor;
  readonly pngUtils: PngUtils;
  readonly storage: IStorage;

  constructor(public readonly id: string,
              public readonly browser: Browser,
              public readonly options: IAutomationEnvironmentOptions) {
    this.taskExecutor = new TaskExecutor(this);
    this.pngUtils = new PngUtils(this);
    this.storage = new options.storage.variant(this);
  }

  close() {
    if (!this.options.isLeaveOpen?.env)
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

  debug(...args) {
    if (this.options.isDebug) {
      console.log(...args);
    }
  }

}
