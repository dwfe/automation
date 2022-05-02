import {Subj} from '@do-while-for-each/rxjs';
import {Page} from 'playwright';
import {IImgCompareResult, ITask, TCommand} from './contract';

export abstract class AbstractTask implements ITask {

  private allDataReceivedSubj = new Subj<any>({type: 'share', initValue: null});
  private screenshotSubj = new Subj<Buffer | null>({type: 'share', initValue: null});
  private compareScreenshotSubj = new Subj<IImgCompareResult | null>({type: 'share', initValue: null});

  constructor(public readonly id: string) {
  }

  abstract getScript(): TCommand[];

  page!: Page;

  allDataReceived = () => result(this.allDataReceivedSubj);
  setAllDataReceived = (): void => this.allDataReceivedSubj.setValue(true);

  screenshot = () => result(this.screenshotSubj);
  setScreenshot = (buf: Buffer): void => this.screenshotSubj.setValue(buf);

  compareScreenshotResult = () => result(this.compareScreenshotSubj);
  setCompareScreenshotResult = (result: IImgCompareResult): void => this.compareScreenshotSubj.setValue(result);

  stop(): void {
    this.allDataReceivedSubj.stop()
    this.screenshotSubj.stop()
    this.compareScreenshotSubj.stop()
  }

}

const result = async <T>({lastValue, nonNullableValuePromise}: Subj<T>): Promise<NonNullable<T>> =>
  lastValue ?? nonNullableValuePromise()
;
