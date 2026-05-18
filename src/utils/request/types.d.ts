export interface IResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface IRequestConfig<T = unknown> {
  url: string;
  data?: T;
  handleRaw?: boolean;
  timeout?: number;
  cancelToken?: AbortController;
  retry?: number;
}
