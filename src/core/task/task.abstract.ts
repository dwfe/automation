import {Subj} from '@do-while-for-each/rxjs';
import {Page} from 'playwright';
import {IImgCompareResult, ITask} from './task.contract'
import {TCommand} from '../cmd'

export abstract class TaskAbstract implements ITask {

  private allDataReceivedSubj = new Subj<any>();
  private screenshotSubj = new Subj<Buffer>();
  private compareScreenshotSubj = new Subj<IImgCompareResult>();

  constructor(public readonly id: any) {
  }

  abstract getScript(): TCommand[];

  page!: Page;

  allDataReceived = () => this.allDataReceivedSubj.nonNullableValuePromise();
  setAllDataReceived = (): void => this.allDataReceivedSubj.setValue(true);

  screenshot = () => this.screenshotSubj.nonNullableValuePromise();
  setScreenshot = (buf: Buffer): void => this.screenshotSubj.setValue(buf);

  compareScreenshotResult = () => this.compareScreenshotSubj.nonNullableValuePromise();
  setCompareScreenshotResult = (result: IImgCompareResult): void => this.compareScreenshotSubj.setValue(result);

  stop(): void {
    this.allDataReceivedSubj.stop()
    this.screenshotSubj.stop()
    this.compareScreenshotSubj.stop()
  }

}
