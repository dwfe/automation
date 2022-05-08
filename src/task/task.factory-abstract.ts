import {ITask} from './task.contract';
import {Command} from '../cmd';
import {Env} from '../env';

const {newPage, closePage, screenshot, compareScreenshot, wait} = Command;

export abstract class TaskFactoryAbstract {

  constructor(protected env: Env) {
  }

  abstract get(stage: any, id: any): ITask;

  getAll(stage: any): ITask[] {
    return this.env.taskIds.map(
      id => this.get(stage, id)
    );
  }

  /**
   * Каждая задача через getScript() отдает список своих команд.
   * В зависимости от этапа его может быть необходимо дополнить командами как перед(beforeScript) так и после(afterScript).
   * Причем список команд beforeScript и afterScript в зависимости от этапа повторяется.
   * Также в зависимости от этапа у задачи могут меняться настройки(например, значения полей saveResponses и mockResponses).
   */
  setupTask(stage: any, task: ITask): void {
    if (!task.beforeScript) task.beforeScript = [];
    if (!task.afterScript) task.afterScript = [];
    const {beforeScript, afterScript} = task;

    beforeScript.push(newPage); // каждая задача выполняется на новой странице

    switch (stage) {
      case 'prepare': {
        afterScript.push(...[
          wait(task.delayForPageRendering),
          screenshot({save: true}),
        ]);
        break;
      }
      case 'test': {
        afterScript.push(...[
          wait(task.delayForPageRendering),
          screenshot(),
          compareScreenshot,
        ]);
        break;
      }
    }
    if (!this.env.opt.leaveOpen?.pageOnTaskEnd)
      afterScript.push(closePage);
  }

}
