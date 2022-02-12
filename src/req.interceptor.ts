import {Page, Request, Route} from 'playwright';
import fetch, {Response} from 'node-fetch';
import {IInterception, IInterceptionInfo, IStorage, ITask, TInterceptionMatch} from './contract';
import {AutomationEnvironment} from './automation.environment';
import {getUrlPath} from './common';

/**
 * Каждый из перехватов(match) по умолчанию отработает только один раз(onePass = true).
 * Такой подход позволяет контролировать момент передачи данных браузеру по всем перехватам.
 * Эта возможность используется в команде 'waitForAllDataReceived'.
 *
 * В зависимости от настроек задачи, в результате конкретного перехвата браузеру будет отдан:
 *   .) либо ответ сервера
 *       - и при необходимости сохранен в хранилище
 *   .) либо mock
 */
export class ReqInterceptor {

  private interceptions = new Map<string, IInterceptionInfo>();

  constructor(private task: ITask,
              private env: AutomationEnvironment,
              private onePass = true) {
  }

  register(data: IInterception[]) {
    data?.forEach(({match, type}) => {
      this.interceptions.set(match.toString(), {type});
      this.page.route(match, this.getInterceptor(match));
    });
  }

  private getInterceptor(match: TInterceptionMatch) {
    this.debug(`listen '${match}'`);

    return async (route: Route, req: Request) => {
      const url = req.url();
      const key = getUrlPath(url);
      this.debug(` - перехват '${url}'`);

      const {status, body, contentType} = await this.getResponse(key, req);
      this.saveResponse(key, body, contentType);

      if (!this.page) {
        this.debug(` - ignore interception '${this.task.id}' because the page is closed`);
        return;
      }

      route.fulfill({status, body, contentType});
      this.debug(` - отдал ответ браузеру`);

      if (this.onePass)
        this.setCompleted(match);
    }
  }

  private async getResponse(key: string, req): Promise<IResponse> {
    return this.task.mockResponses
      ? await this.getMock(key)
      : await this.requestToServer(req);
  }

  private async getMock(key: string): Promise<IResponse> {
    const {buf, contentType} = this.storage.get(this.task, {type: 'response', key});
    this.debug(` - считан mock, size`, buf.length);
    return {
      status: 200,
      body: buf,
      contentType,
    };
  }

  private async requestToServer(req: Request): Promise<IResponse> {
    this.debug(` - ${req.method()} ${req.url()}`);
    const res: Response = await fetch(req.url(), {
      method: req.method(),
      headers: req.headers(),
      body: req.postData(),
    });
    const buf = await res.buffer();
    this.debug(` - ответ сервера, size`, buf.length);
    return {
      status: res.status,
      body: buf,
      contentType: res.headers.get('content-type'),
    };
  }

  private saveResponse(key: string, buf: Buffer, contentType: string) {
    if (!this.task.saveResponses)
      return;
    this.storage.set(this.task, {type: 'response', key, contentType}, buf);
  }

  private setCompleted(match: TInterceptionMatch) {
    const info = this.interceptions.get(match.toString());
    if (info.completed) {
      this.checkAllDataReceived();
      return;
    }
    switch (info.type) {
      case 'single': {
        this.completeInterception(match, info);
        break;
      }
      case 'multiple': { // ЕСЛИ ожидается несколько запросов/ответов ТОГДА от последнего ответа надо подождать какое-то время перед завершением
        if (info.timeout)
          clearTimeout(info.timeout); // ЕСЛИ таймаут задан ТОГДА он еще не сработал и его надо сбросить, т.к. ориентируемся относительно последнего ответа
        info.timeout = setTimeout(() => this.completeInterception(match, info), 1000);
        break;
      }
      default:
        throw new Error(`Неизвестный тип '${info.type}' перехвата ${match}`);
    }
  }

  private completeInterception(match: TInterceptionMatch, info: IInterceptionInfo) {
    info.completed = true;
    this.page.unroute(match);
    this.debug(`stop listen '${match}'`);
    this.checkAllDataReceived();
  }

  private checkAllDataReceived() {
    const incomplete = Array.from(this.interceptions.values()).filter(info => !info.completed);
    if (incomplete.length === 0) {
      this.debug(` - все данные получены`);
      this.task.setAllDataReceived();
    }
  }


//region Support

  private get page(): Page {
    return this.task.page;
  }

  private get storage(): IStorage {
    return this.env.storage
  }

  private debug(...args) {
    return this.env.debug(...args);
  }

//endregion

}


interface IResponse {
  status: number;
  body: Buffer; // тело ответа
  contentType: string;
}
