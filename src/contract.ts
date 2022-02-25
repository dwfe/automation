import {BrowserContextOptions, LaunchOptions, Mouse, Page} from 'playwright'
import {IStoppable, TRunMode, Type} from '@do-while-for-each/common'
import {PageScreenshotOptions} from 'playwright-core'
import {TPoint} from '@do-while-for-each/math'
import {PixelmatchOptions} from 'pixelmatch'
import {PNG} from 'pngjs'

export interface IAutomationEnvironmentOpt {
  browserType: 'chromium' | 'webkit' | 'firefox';
  launchOpt: LaunchOptions;
  browserContext: BrowserContextOptions;
  screenshot: NonNullable<PageScreenshotOptions>;
  pixelmatch: PixelmatchOptions;
  storage: {
    variant: Type<IStorage>;
    dir: string;    // главная папка хранилища
  },
  urlOrigin?: string; // используется там, где надо собрать url из относительного пути. Например, TaskExecutor при выполнении команды 'goto'
  isDebug?: boolean;
  isLeaveOpen?: {
    env?: boolean;           // флаг, надо ли закрыть окружение, когда у него будет вызван метод .close()
    pageOnTaskEnd?: boolean; // флаг, надо ли оставить страницу открытой после выполнения всех команд задачи
  },
  runMode?: TRunMode,
}

// https://www.npmjs.com/package/pixelmatch#pixelmatchimg1-img2-output-width-height-options
export const defaultPixelmatchOptions: PixelmatchOptions = {
  threshold: 0.1,
  includeAA: true, // if 'true', disables detecting and ignoring anti-aliased pixels
  alpha: 0.1,
  diffColor: [0, 0, 255],    // blue  - цвет оригинала
  diffColorAlt: [255, 0, 0], // red   - цвет расхождения с оригиналом
  aaColor: [0, 165, 0],      // green - цвет расхождения anti-aliased pixels с оригиналом
  diffMask: false,
}

/**
 * Задача - это одна или несколько команд, которые надо выполнить, чтобы получить результат.
 * Результатом выполнения задачи могут быть¹:
 *    - response от сервера²
 *    - скриншот
 *    - результат сравнения скриншота с ожидаемой картинкой (берется из хранилища)
 *  ¹ в зависимости от самой задачи;
 *  ² для перехвата запросов к серверу, надо знать url, по которому клиент обращается за данными.
 * На следующие вопросы должна отвечать конкретная задача:
 *    - надо ли сохранить скриншот в файл? -> команда 'screenshot'
 *    - надо ли сохранить response в файл? -> поле 'saveResponses'
 *    - надо ли мокать ответ сервера?      -> поле 'mockResponses'
 */
export interface ITask extends Partial<IStoppable> {

  /**
   * Каждая задача должна:
   *   - иметь Id. Одно из основных использований Id - это хранение файлов (скриншот, response)
   *   - отдавать Список команд.
   */
  id: string;
  getScript: () => TCommand[];
  beforeScript?: TCommand[];
  afterScript?: TCommand[];

  page?: Page; // страница, на которой выполняется задача

  saveResponses?: boolean; // флаг, надо ли сохранять ответ сервера (потом может быть использован как mock-данные)
  mockResponses?: boolean; // флаг, надо ли вместо прямого обращения к серверу брать ответ из mock-данных
  delayForDraw?: number;

  initReqInterceptors?: () => void;
  setAllDataReceived?: () => void;
  allDataReceived?: () => Promise<any>; // сигнализирует, что пришли все данные, которые ожидалось получить

  actionsBeforeScreenshot?: () => Promise<void>;
  setScreenshot?: (buf: Buffer) => void;
  screenshot?: () => Promise<Buffer>;

  setCompareScreenshotResult?: (result: IImgCompareResult) => void;
  compareScreenshotResult?: () => Promise<IImgCompareResult>;

  login?: () => Promise<TToken>;

  isActive?: boolean; // флаг, задача сейчас в процессе выполнения
  isFinished?: boolean; // флаг, задача выполнена

}

export interface IImgCompareResult {
  isEqual: boolean;
  diffPixelsCount: number;
  origImg: PNG;       // картинка оригинал
  imgToCompare: PNG;  // картинка, которую надо было сравнить с оригиналом
  diffImg: PNG;       // картинка результат сравнения
}


export type TToken = string

export interface ILogin {
  username: string;
  password: string;
}


//region Interception

export interface IInterception {
  type: TInterceptionType;
  match: TInterceptionMatch;
}

export type TInterceptionType =
  'single' |  // один запрос - один ответ
  'multiple'; // несколько запросов - несколько ответов

export type TInterceptionMatch = string | RegExp;

export interface IInterceptionInfo {
  type: TInterceptionType;
  timeout?: NodeJS.Timeout;
  completed?: boolean;
}

//endregion


//region Commands

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

//endregion


//region Storage

export interface IStorage {

  get(task: ITask, meta: IFileMetadata): IStorageGet;

  set(task: ITask, meta: IFileMetadata, buf: Buffer): void;

  clean(): void;

}

export interface IFileMetadata {
  type: 'screenshot' | 'response';
  key?: string;         // ключ, по которому в индексе хранятся данные по файлу
  contentType?: string; // MIME тип файла
}

export interface IStorageGet {
  buf: Buffer;
  contentType: string;
}

export interface IFileInfo {
  fileName: string;
  contentType: string;
  filePath: string,
}

/**
 * Индексный файл - index.json - имеет следующую структуру:
 *{
 *  key: {
 *    fileName:
 *    contentType:
 *  },
 *  ...
 *}
 */
export interface IStorageIndex {
  [key: string]: IStorageIndexValue
}

export interface IStorageIndexValue {
  fileName: string;
  contentType: string;
}

//endregion
