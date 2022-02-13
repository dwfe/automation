import {isNumber} from '@do-while-for-each/common'
import {IAutomationEnvironmentOptions, IStorage, ITask} from './contract'
import {AutomationEnvironment} from './automation.environment'
import {PngUtils} from './png.utils'
import {joinUrl} from './common'

export class TaskExecutor {

  constructor(private env: AutomationEnvironment) {
  }

  async run(tasks: ITask[]) {
    for (const task of tasks)
      await this.runTask(task);
  }

  async runTask(task: ITask) {
    this.startTask(task);
    const script = [
      ...(task.beforeScript || []),
      ...task.getScript(),
      ...(task.afterScript || []),
    ];

    for (const command of script) {
      this.debug(command);
      const page = task.page;
      try {
        switch (command.type) {
          case 'newPage': {
            task.page = await this.env.newPage();
            task.initReqInterceptors?.();
            break;
          }
          case 'closePage': {
            checkFields(task, ['page']);
            page?.close();
            delete task.page;
            break;
          }
          case 'goto': {
            checkFields(task, ['page']);
            await page?.goto(this.getUrl(command.data));
            break;
          }
          case 'screenshot': {
            checkFields(task, ['page', 'actionsBeforeScreenshot']);
            await task.actionsBeforeScreenshot?.();
            const buf = await page?.screenshot() as Buffer;
            task.setScreenshot?.(buf);
            if (command.data.save)
              this.storage.set(task, {type: 'screenshot'}, buf);
            break;
          }
          case 'compareScreenshot': {
            checkFields(task, ['screenshot']);
            if (this.options.screenshot.type !== 'png')
              throw new Error(`Поддерживается только 'png' при сравнении скриншотов`);
            const origImgBuf = this.storage.get(task, {type: 'screenshot'}).buf;
            const screenshot = await task.screenshot?.() as Buffer;
            const compareResult = this.pngUtils.compareBuf(origImgBuf, screenshot);
            task.setCompareScreenshotResult?.(compareResult);
            break;
          }
          case 'wait': {
            checkFields(task, ['page']);
            if (isNumber(command.data))
              await page?.waitForTimeout(command.data as number);
            break;
          }
          case 'waitForAllDataReceived': {
            checkFields(task, ['allDataReceived']);
            await task.allDataReceived?.();
            break;
          }
          case 'click': {
            checkFields(task, ['page']);
            const {selector, options, useFullSelector} = command.data;
            await page?.click(this.getSelector(selector, useFullSelector), options);
            break;
          }
          case 'fill': {
            checkFields(task, ['page']);
            const {selector, value, options, useFullSelector} = command.data;
            await page?.fill(this.getSelector(selector, useFullSelector), value, options);
            break;
          }
          case 'mouseClick': {
            checkFields(task, ['page']);
            const {point, options} = command.data;
            await page?.mouse.click(point[0], point[1], options);
            break;
          }
          case 'login': {
            checkFields(task, ['login']);
            await task.login?.();
            break;
          }
          default:
            throw new Error(`Для команды '${command['type']}' не определен обработчик`)
        }
      } catch (e) {
        this.finishTask(task);
        console.log(`---`,);
        console.log(`Ошибка при выполнении задачи '${task.id}'`);
        console.log(script);
        throw e;
      }
    }
    this.finishTask(task);
  }

  /**
   * Для упрощения поддержки по умолчанию считать, что на целевом элементе
   * определен атрибут 'data-qa' со значением selector, например:
   *  <input data-qa="login-page_username" />
   */
  private getSelector(selector: string, useFullSelector?: boolean): string {
    return useFullSelector ? selector : `[data-qa=${selector}]`;
  }

  private getUrl(path: string): string {
    return joinUrl(path, this.options.baseUrl);
  }


//region Support

  private get options(): IAutomationEnvironmentOptions {
    return this.env.opt;
  }

  private get storage(): IStorage {
    return this.env.storage;
  }

  private get pngUtils(): PngUtils {
    return this.env.pngUtils;
  }

  private debug(...args: any[]) {
    return this.env.debug(...args);
  }


  private startTask(task: ITask) {
    task.isActive = true;

    this.debug(`==================================================`);
    this.debug(`start ${task.id} for '${this.env.id}'`);

    if (this.options.isDebug)
      console.time(task.id);
  }

  private finishTask(task: ITask) {
    task.isActive = false;
    task.isFinished = true;

    if (this.options.isDebug)
      console.timeEnd(task.id);
  }

//endregion

}

function checkFields(task: ITask, fieldNames: Array<keyof ITask>) {
  for (const fieldName of fieldNames) {
    if (!task[fieldName])
      throw new Error(`Отсутствует task.${fieldName}`);
  }
}
