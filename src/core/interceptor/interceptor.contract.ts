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

export interface IResponse {
  status: number;
  body: Buffer; // тело ответа
  contentType: string;
}
