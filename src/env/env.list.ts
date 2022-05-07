import {TEnvArgs} from './env.contract';
import {Env} from './env';

export class EnvList {

  constructor(public readonly args: TEnvArgs[]) {
  }

  readonly list: Env[] = []; // массив проинициализированных окружений

  get() {
    return this.list;
  }

  async init() {
    this.dispose();
    const list = await Promise.all(
      this.args.map(args => Env.of(...args))
    );
    this.list.push(...list);
  }

  dispose() {
    while (this.list.length > 0)
      this.list.pop()?.close();
  }

  /**
   * Передача параметров в describe.each происходит синхронно и туда надо сразу же передать все учавствующие в тестировании окружения.
   * Но заполнение списка окружений - this.list - происходит асинхронно в beforeAll (вызовом this.init()).
   * А так как на момент инициализации теста this.list пуст, то получение экземпляра окружения делаю через функцию,
   * ведь изначально по this.args известно какие окружения и в каком порядке будут участвовать в тестировании.
   */
  future(): (() => Env)[] {
    return this.args.map(([_, id], index) => {
      const getEnv = () => this.list[index];
      getEnv.toString = () => id; // чтобы конкретный describe при печати выводился как id окружения
      return getEnv;
    });
  }

}
