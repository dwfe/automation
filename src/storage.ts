import {lstatSync, readdirSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
import {FileCheck, FileJson} from '../fs';
import {join} from 'path';
import {IAutomationEnvironmentOptions, IFileInfo, IFileMetadata, IStorage, IStorageGet, IStorageIndex, IStorageIndexValue, ITask} from './contract';
import {AutomationEnvironment} from './automation.environment';

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

  constructor(private env: AutomationEnvironment) {
    this.initDirs();
    this.clean();
  }

  get(task: ITask, meta: IFileMetadata): IStorageGet {
    this.updatePosition(task, meta);
    const {filePath, contentType} = this.file('get', task, meta);
    const buf = readFileSync(filePath);
    this.debug(`read ${meta.type} '${filePath}', size`, buf.length);
    return {buf, contentType};
  }

  set(task: ITask, meta: IFileMetadata, buf: Buffer): void {
    this.updatePosition(task, meta);
    const {filePath, fileName, contentType} = this.file('set', task, meta);
    writeFileSync(filePath, buf);
    this.updateIndex(meta, {fileName, contentType});
    this.debug(`write ${meta.type} '${filePath}', size`, buf.length);
  }

//region Структура хранилища

  private initDirs() {
    FileCheck.ensureDir(this.dir);
    FileCheck.ensureDir(this.environmentDir);
  }

  /**
   * Перед тем, как выполнить операцию в хранилище, надо спозиционироваться в нужное место:
   *  - убедиться, что нужные папки созданы;
   *  - обновить соответствующие переменные.
   */
  private updatePosition(task: ITask, meta: IFileMetadata) {
    FileCheck.ensureDir(this.getStorageFileTypeDir(meta));
    if (meta.type === 'response') {
      FileCheck.ensureDir(this.getTaskDir(task));
    }
  }

  private get dir() {
    return this.options.storage.dir;
  }

  private get environmentDir() {
    return join(this.dir, this.env.id);
  }

  private storageFileTypeDir: string;

  private getStorageFileTypeDir(meta: IFileMetadata) {
    return this.storageFileTypeDir = join(this.environmentDir, meta.type);
  }

  private taskDir: string;
  private taskIndexFilePath: string;
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
        const fileType = this.options.screenshot.type;
        fileName = task.id + '.' + fileType;
        contentType = `image/${fileType}`;
        filePath = join(this.storageFileTypeDir, fileName);
        break;
      }
      case 'response': {
        if (action === 'set') {
          contentType = meta.contentType;
          fileName = `${Math.random().toString(36).substr(2, 8)}${getFileExtention(contentType)}`;
        } else {
          const index = this.currentIndex[meta.key];
          if (index === undefined)
            throw new Error(`Storage#file: в индексе нет такого ключа '${meta.key}'`);
          fileName = index.fileName;
          contentType = index.contentType;
        }
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
    if (meta.type !== 'response')
      return;
    const index = this.currentIndex;
    index[meta.key] = value;
    FileJson.write(index, this.taskIndexFilePath, true);
  }

//endregion


//region Clean

  clean() {
    this.debug('==================================================');
    this.debug(`clean storage`)
    this.cleanDir(this.dir);
  }

  private cleanDir(path: string) {
    if (!lstatSync(path).isDirectory())
      return;
    const fileNames = readdirSync(path);
    if (fileNames.find(fileName => fileName === this.indexFileName)) { // ЕСЛИ в директории есть индексный файл
      const index = this.getIndex(join(path, this.indexFileName));
      this.removeFiles(path, index, fileNames);
    } else
      fileNames.forEach(file => this.cleanDir(join(path, file)));
  }

  private removeFiles(dir: string, index: IStorageIndex, allDirFileNames: string[]) {
    this.debug(dir);
    const indexFileNames = Object.values(index).map(value => value.fileName);
    allDirFileNames
      .filter(fileName => !indexFileNames.includes(fileName) && fileName !== this.indexFileName)
      .forEach(fileName => {
        this.debug(` - remove file '${fileName}'`)
        unlinkSync(join(dir, fileName));
      });
  }

//endregion


//region Support

  private get options(): IAutomationEnvironmentOptions {
    return this.env.options;
  }

  private debug(...args) {
    return this.env.debug(...args);
  }

//endregion

}

const getFileExtention = (contentType: string): string => {
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
