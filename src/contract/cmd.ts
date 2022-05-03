import {TPoint} from '@do-while-for-each/math'
import {Mouse, Page} from 'playwright'

export class Command {

  static screenshot(data: IScreenshotCommand['data'] = {}): IScreenshotCommand {
    return {cmd: 'screenshot', data};
  }

  static get compareScreenshot(): ICompareScreenshotCommand {
    return {cmd: 'compareScreenshot'};
  }

  static get newPage(): INewPageCommand {
    return {cmd: 'newPage'};
  }

  static get closePage(): IClosePageCommand {
    return {cmd: 'closePage'};
  }

  static goto(data: IGotoCommand['data']): IGotoCommand {
    return {cmd: 'goto', data};
  }

  static wait(data: IWaitCommand['data']): IWaitCommand {
    return {cmd: 'wait', data};
  }

  static get waitForAllDataReceived(): IWaitForAllDataReceivedCommand {
    return {cmd: 'waitForAllDataReceived'};
  }

  static click(data: IClickElementCommand['data']): IClickElementCommand {
    return {cmd: 'click', data};
  }

  static fill(data: IFillCommand['data']): IFillCommand {
    return {cmd: 'fill', data};
  }

  static mouseClick(data: IMouseClickCommand['data']): IMouseClickCommand {
    return {cmd: 'mouseClick', data};
  }

  static get login(): ILoginCommand {
    return {cmd: 'login'};
  }

}


export type TCommand =
  IScreenshotCommand |
  ICompareScreenshotCommand |
  INewPageCommand |
  IClosePageCommand |
  IGotoCommand |
  IWaitCommand |
  IWaitForAllDataReceivedCommand |
  IClickElementCommand |
  IFillCommand |
  IMouseClickCommand |
  ILoginCommand;

export interface IScreenshotCommand {
  cmd: 'screenshot';
  data: { save?: boolean; }
}

export interface ICompareScreenshotCommand {
  cmd: 'compareScreenshot';
}

export interface IGotoCommand {
  cmd: 'goto';
  data: string;
}

export interface INewPageCommand {
  cmd: 'newPage';
}

export interface IClosePageCommand {
  cmd: 'closePage';
}

export interface IWaitCommand {
  cmd: 'wait';
  data?: number;
}

export interface IWaitForAllDataReceivedCommand {
  cmd: 'waitForAllDataReceived';
}

export interface IClickElementCommand {
  cmd: 'click';
  data: {
    selector: string;
    options?: Parameters<Page['click']>[1];
    useFullSelector?: boolean;
  };
}

export interface IFillCommand {
  cmd: 'fill';
  data: {
    selector: string;
    value: string;
    options?: Parameters<Page['fill']>[2];
    useFullSelector?: boolean;
  }
}

export interface IMouseClickCommand {
  cmd: 'mouseClick';
  data: {
    point: TPoint;
    options?: Parameters<Mouse['click']>[2];
  };
}

export interface ILoginCommand {
  cmd: 'login';
}
