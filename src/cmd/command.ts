import {IClickElementCommand, IClosePageCommand, ICompareScreenshotCommand, IFillCommand, IGotoCommand, ILoginCommand, IMouseClickCommand, INewPageCommand, IScreenshotCommand, IWaitCommand, IWaitForAllDataReceivedCommand} from './command.contract'

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
