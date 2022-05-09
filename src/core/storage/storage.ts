import {ensureDirExists, FileJson, isDirectory, removeForce} from '@do-while-for-each/fs';
import {readdirSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {IFileInfo, IFileMetadata, IStorage, IStorageGet, IStorageIndex, IStorageIndexValue} from './storage.contract'
import {Env, IEnvOpt} from '../env';
import {ITask} from '../task'

/**
 * Хранилище реализует структуру вида:
 *
 *  [environment]
 *     |---[screenshot]
 *            |--- task-1.png
 *            |--- task-2.png
 *            |--- ...
 *     |---[response]
 *            |--- [task-1]
 *                    |--- index.json  - индексный файл содержимого директории
 *                    |--- file1
 *                    |--- file2
 *                    |--- ...
 *                    |--- fileN
 *            |--- [task-2]
 *                    |--- index.json
 *                    |--- file1
 *                    |--- file2
 *                    |--- ...
 *                    |--- fileN
 *            |--- ...
 */
export class Storage implements IStorage {

  constructor(private env: Env) {
    this.initDirs();
    this.clean();
  }

  get(task: ITask, meta: IFileMetadata): IStorageGet {
    this.updatePosition(task, meta);
    const {filePath, contentType} = this.file('get', task, meta);
    const buf = readFileSync(filePath);
    this.log(`read ${meta.type} from '${filePath}', size`, buf.length);
    return {buf, contentType};
  }

  set(task: ITask, meta: IFileMetadata, buf: Buffer): void {
    this.updatePosition(task, meta);
    const {filePath, fileName, contentType} = this.file('set', task, meta);
    writeFileSync(filePath, buf);
    this.updateIndex(meta, {fileName, contentType});
    this.log(`write ${meta.type} to '${filePath}', size`, buf.length);
  }

//region Структура хранилища

  private initDirs() {
    ensureDirExists(this.dir);
    ensureDirExists(this.environmentDir);
  }

  /**
   * Перед тем, как выполнить операцию в хранилище, надо спозиционироваться в нужное место:
   *  - убедиться, что нужные папки созданы;
   *  - обновить соответствующие переменные.
   */
  private updatePosition(task: ITask, meta: IFileMetadata) {
    ensureDirExists(this.getStorageFileTypeDir(meta));
    if (meta.type === 'response') {
      ensureDirExists(this.getTaskDir(task));
    }
  }

  private get dir() {
    return this.opt.storage.dir;
  }

  private get environmentDir() {
    return join(this.dir, this.env.id);
  }

  private storageFileTypeDir!: string;

  private getStorageFileTypeDir(meta: IFileMetadata) {
    return this.storageFileTypeDir = join(this.environmentDir, meta.type);
  }

  private taskDir!: string;
  private taskIndexFilePath!: string;
  private indexFileName = 'index.json';

  private getTaskDir(task: ITask) {
    this.taskDir = join(this.storageFileTypeDir, task.id);
    this.taskIndexFilePath = join(this.taskDir, this.indexFileName);
    return this.taskDir;
  }

  private file(action: 'get' | 'set', task: ITask, meta: IFileMetadata): IFileInfo {
    let fileName, contentType, filePath;
    switch (meta.type) {
      case 'screenshot': {
        const fileType = this.opt.screenshot.type;
        fileName = task.id + '.' + fileType;
        contentType = `image/${fileType}`;
        filePath = join(this.storageFileTypeDir, fileName);
        break;
      }
      case 'response': {
        if (action === 'set') {
          contentType = meta.contentType as string;
          fileName = `${Math.random().toString(36).substr(2, 8)}${getFileExt(contentType)}`;
        } else if (meta.key) {
          const index = this.currentIndex[meta.key];
          if (index === undefined)
            throw new Error(`Storage#file: в индексе нет такого ключа '${meta.key}'`);
          fileName = index.fileName;
          contentType = index.contentType;
        } else
          throw new Error(`Storage#file: не смог определить fileName`);
        filePath = join(this.taskDir, fileName);
        break;
      }
      default:
        throw new Error(`Storage#file: неизвестный тип файла '${meta.type}'`);
    }
    return {fileName, contentType, filePath};
  }


  private get currentIndex() {
    return this.getIndex(this.taskIndexFilePath);
  }

  private getIndex(path: string) {
    return FileJson.read<IStorageIndex>(path);
  }

  private updateIndex(meta: IFileMetadata, value: IStorageIndexValue) {
    if (!meta.key)
      return;
    const index = this.currentIndex;
    index[meta.key] = value;
    FileJson.write(index, this.taskIndexFilePath, true);
  }

//endregion Структура хранилища


//region Clean

  clean() {
    this.log(' ')
    this.log(`clean storage for env "${this.env}"`)
    this.log('==================================================');
    this.cleanDir(this.dir);
  }

  private cleanDir(path: string) {
    if (!isDirectory(path))
      return;
    const fileNames = readdirSync(path);
    if (fileNames.find(fileName => fileName === this.indexFileName)) { // ЕСЛИ в директории есть индексный файл
      const index = this.getIndex(join(path, this.indexFileName));
      this.removeFiles(path, index, fileNames);
    } else
      fileNames.forEach(file => this.cleanDir(join(path, file)));
  }

  private removeFiles(dir: string, index: IStorageIndex, allDirFileNames: string[]) {
    this.log(dir);
    const indexFileNames = Object.values(index).map(value => value.fileName);
    allDirFileNames
      .filter(fileName => !indexFileNames.includes(fileName) && fileName !== this.indexFileName)
      .forEach(fileName => {
        this.log(` - remove file '${fileName}'`)
        removeForce(join(dir, fileName))
      });
  }

//endregion Clean


//region Support

  private get opt(): IEnvOpt {
    return this.env.opt;
  }

  private log(...args: any[]) {
    return this.env.log(...args);
  }

//endregion Support

}

const getFileExt = (contentType: string): string => {
  if (!contentType)
    return '';

  if (contentType.includes('application/json'))
    return '.json';

  if (contentType.includes('image/')) {
    if (contentType.includes('png'))
      return '.png';
    if (contentType.includes('jpg'))
      return '.jpg';
    if (contentType.includes('jpeg'))
      return '.jpeg';
  }
  return '';
}
