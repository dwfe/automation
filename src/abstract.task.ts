import {filter, firstValueFrom, Subj} from '@do-while-for-each/rxjs';
import {Page} from 'playwright';
import {IImgCompareResult, ITask, TCommand} from './contract';

export abstract class AbstractTask implements ITask {

  private allDataReceivedWrap = new Subj<any>({type: 'shareReplay', bufferSize: 1, initValue: null});
  private screenshotWrap = new Subj<Buffer | null>({type: 'shareReplay', bufferSize: 1, initValue: null});
  private compareScreenshotWrap = new Subj<IImgCompareResult | null>({type: 'shareReplay', bufferSize: 1, initValue: null});

  constructor(public readonly id: string) {
  }

  abstract getScript(): TCommand[];

  page!: Page;

  setAllDataReceived() {
    this.allDataReceivedWrap.setValue(true);
  }

  allDataReceived(): Promise<any> {
    return result(this.allDataReceivedWrap);
  }

  setScreenshot(buf: Buffer) {
    this.screenshotWrap.setValue(buf);
  }

  screenshot(): Promise<Buffer> {
    return result(this.screenshotWrap) as Promise<Buffer>;
  }

  setCompareScreenshotResult(result: IImgCompareResult) {
    this.compareScreenshotWrap.setValue(result);
  }

  compareScreenshotResult(): Promise<IImgCompareResult> {
    return result(this.compareScreenshotWrap) as Promise<IImgCompareResult>;
  }

  stop(): void {
    this.allDataReceivedWrap.stop()
    this.screenshotWrap.stop()
    this.compareScreenshotWrap.stop()
  }

}

const result = async <T>({lastValue, value$}: Subj<T>): Promise<T> =>
    lastValue
    || firstValueFrom(value$.pipe(
      filter(data => !!data),
    ))
;
