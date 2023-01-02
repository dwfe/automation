import {IPoint} from '@do-while-for-each/math'
import {Mouse, Page} from 'playwright'

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
    point: IPoint;
    options?: Parameters<Mouse['click']>[2];
  };
}

export interface ILoginCommand {
  cmd: 'login';
}
