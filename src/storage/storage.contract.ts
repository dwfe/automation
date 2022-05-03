import {ITask} from '../task'

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
