import {filter, first, Subj} from '@do-while-for-each/rxjs';
import {Page} from 'playwright';
import {IImgCompareResult, ITask, TCommand} from './contract';

export abstract class AbstractTask implements ITask {

  private allDataReceivedWrap = new Subj<any>({type: 'shareReplay', bufferSize: 1}, null);
  private screenshotWrap = new Subj<Buffer>({type: 'shareReplay', bufferSize: 1}, null);
  private compareScreenshotWrap = new Subj<IImgCompareResult>({type: 'shareReplay', bufferSize: 1}, null);

  constructor(public readonly id: string) {
  }

  abstract getScript(): TCommand[];

  page?: Page;

  setAllDataReceived() {
    this.allDataReceivedWrap.setValue(true);
  }

  async allDataReceived(): Promise<any> {
    return result(this.allDataReceivedWrap);
  }

  setScreenshot(buf: Buffer) {
    this.screenshotWrap.setValue(buf);
  }

  async screenshot(): Promise<Buffer> {
    return result(this.screenshotWrap);
  }

  setCompareScreenshotResult(result: IImgCompareResult) {
    this.compareScreenshotWrap.setValue(result);
  }

  async compareScreenshotResult(): Promise<IImgCompareResult> {
    return result(this.compareScreenshotWrap);
  }

  stop(): void {
    this.allDataReceivedWrap.stop()
    this.screenshotWrap.stop()
    this.compareScreenshotWrap.stop()
  }

}

const result = async <T>(wrap: Subj<T>): Promise<T> =>
  wrap.lastValue
  || wrap.value$.pipe(
  filter(data => !!data),
  first()
  ).toPromise()
;
