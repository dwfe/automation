import {IStoppable} from '@do-while-for-each/common'
import {Page} from 'playwright'
import {PNG} from 'pngjs'
import {TCommand} from '../cmd'

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
  afterPageCreation?: () => Promise<void>;
  delayForPageRendering?: number;

  allDataReceived?: () => Promise<any>; // сигнализирует, что пришли все данные, которые ожидалось получить
  setAllDataReceived?: () => void;

  screenshot?: () => Promise<Buffer>;
  setScreenshot?: (buf: Buffer) => void;
  beforeScreenshot?: () => Promise<void>;

  compareScreenshotResult?: () => Promise<IImgCompareResult>;
  setCompareScreenshotResult?: (result: IImgCompareResult) => void;

  saveResponses?: boolean; // флаг, надо ли сохранять ответ сервера (потом может быть использован как mock-данные)
  mockResponses?: boolean; // флаг, надо ли вместо прямого обращения к серверу брать ответ из mock-данных

  login?: () => Promise<boolean>;

  isActive?: boolean; // флаг, задача сейчас в процессе выполнения
  isFinished?: boolean; // флаг, задача выполнена

}

export interface IImgCompareResult {
  isEqual: boolean;
  diffPixelsCount: number;
  diff: IImgPack;      // картинка результат сравнения
  orig: IImgPack;      // картинка оригинал
  toCompare: IImgPack; // картинка, которую надо было сравнить с оригиналом
}

interface IImgPack {
  PNG: PNG;
  buf: Buffer;
}
