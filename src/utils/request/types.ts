import type { AxiosProgressEvent, AxiosRequestConfig } from "axios";

import { REQUEST_EVENT_KEYS } from "@/common/request-key";

/**
 * 后端统一响应结构。
 *
 * 当请求配置里传入 `returnRawResponse: true` 时，`request/get/post...`
 * 返回的就是这个结构；否则默认只返回 `data`。
 */
export interface ApiResponse<TData = unknown> {
  /** 业务状态码，例如 `200`、`401` */
  code: number;
  /** 业务数据 */
  data: TData;
  /** 后端返回的提示信息 */
  message: string;
}

/**
 * 请求基础配置。
 *
 * 这个类型继承了 `AxiosRequestConfig`，所以除了这里额外定义的字段，
 * 你还可以继续传 axios 原生配置，例如：
 * - `headers`
 * - `timeout`
 * - `params`
 * - `signal`
 */
export interface BaseRequestConfig<TData = unknown> extends Omit<
  AxiosRequestConfig<TData>,
  "onDownloadProgress" | "onUploadProgress"
> {
  /**
   * 是否返回后端统一响应体。
   *
   * - `false` / 不传：只返回 `data`
   * - `true`：返回 `{ code, data, message }`
   */
  returnRawResponse?: boolean;

  /** 请求失败后的最大重试次数 */
  retry?: number;

  /** 每次重试的基础间隔时间，单位毫秒 */
  retryDelay?: number;

  /**
   * 请求进度配置。
   *
   * 适合上传文件、下载文件这类需要展示进度条的场景。
   */
  progress?: RequestProgressConfig;
}

/**
 * 默认请求配置。
 *
 * 返回值只会是后端响应里的 `data`。
 */
export interface DataRequestConfig<TData = unknown> extends BaseRequestConfig<TData> {
  returnRawResponse?: false;
}

/**
 * 原始响应配置。
 *
 * 返回值会是完整的后端响应体：`{ code, data, message }`。
 */
export interface RawRequestConfig<TData = unknown> extends BaseRequestConfig<TData> {
  returnRawResponse: true;
}

/** 完整请求配置，内部会根据 `returnRawResponse` 推导返回类型。 */
export type RequestConfig<TData = unknown> = DataRequestConfig<TData> | RawRequestConfig<TData>;

/**
 * 请求内部使用的配置。
 *
 * 这个类型主要给 request 核心层自己使用，业务代码一般不用直接声明它。
 */
export interface InternalRequestConfig<TData = unknown> extends BaseRequestConfig<TData> {
  /** 当前已经重试了多少次 */
  _retryCount?: number;
}

/**
 * 不带 `method` / `url` 的请求配置。
 *
 * 适合这种调用方式：
 * `get("/users", { headers: { Authorization: "xxx" }, timeout: 5000 })`
 */
export type RequestMethodConfig<TData = unknown> = Omit<DataRequestConfig<TData>, "method" | "url">;

/**
 * 返回完整响应体时使用的请求配置。
 *
 * 适合这种调用方式：
 * `post("/users/login", data, { returnRawResponse: true, headers: { "X-Trace-Id": "123" } })`
 */
export type RawRequestMethodConfig<TData = unknown> = Omit<RawRequestConfig<TData>, "method" | "url">;

/** 方法级请求配置，兼容默认返回 `data` 和返回完整响应体两种模式。 */
export type AnyRequestMethodConfig<TData = unknown> = RequestMethodConfig<TData> | RawRequestMethodConfig<TData>;

/** 手动取消请求时返回的控制器对象。 */
export interface RequestController {
  /** 主动取消请求 */
  cancel: (reason?: string) => void;
  /** 原生 AbortController */
  controller: AbortController;
  /** 可直接传给 axios 的 `signal` */
  signal: AbortSignal;
}

/** 请求进度类型。 */
export type RequestProgressType = "download" | "upload";

/**
 * 统一后的请求进度事件。
 *
 * 相比 axios 原生事件，这里额外补了 `type` 和 `percent`，
 * 业务层可以直接用来驱动进度条。
 */
export interface RequestProgressEvent {
  /** 当前是上传进度还是下载进度 */
  type: RequestProgressType;
  /** 当前已传输字节数 */
  loaded: number;
  /** 总字节数，拿不到时为空 */
  total?: number;
  /** 0 ~ 1 之间的进度值，拿不到时为空 */
  progress?: number;
  /** 0 ~ 100 之间的进度百分比，拿不到时为空 */
  percent?: number;
  /** 当前时间片新增传输的字节数 */
  bytes?: number;
  /** 预计剩余时间，单位毫秒 */
  estimated?: number;
  /** 当前传输速率，单位 bytes/s */
  rate?: number;
  /** 是否可以计算总进度 */
  lengthComputable: boolean;
  /** axios 原始进度事件，必要时可以继续往下取字段 */
  originalEvent: AxiosProgressEvent;
}

/** 请求进度回调。 */
export type RequestProgressHandler = (event: RequestProgressEvent) => void;

/**
 * 请求进度配置。
 *
 * 示例：
 * `post("/upload", formData, {
 *   progress: {
 *     onUpload: ({ percent }) => {
 *       console.log(percent);
 *     },
 *   },
 * })`
 */
export interface RequestProgressConfig {
  /** 上传进度回调 */
  onUpload?: RequestProgressHandler;
  /** 下载进度回调 */
  onDownload?: RequestProgressHandler;
}

/** 路由跳转事件载荷。 */
export interface RouteNavigationPayload {
  hash?: string;
  params?: Record<string, string | number>;
  search?: Record<string, unknown>;
  to: string;
}

/** Token 失效事件载荷。 */
export interface TokenExpiredPayload {
  /** 登录成功后希望跳回的地址 */
  redirect?: string;
  /** 是否替换当前历史记录 */
  replace?: boolean;
}

/** 请求开始/结束时的基础事件信息。 */
export interface RequestLifecyclePayload {
  method?: string;
  url?: string;
}

/** 请求错误事件载荷。 */
export interface RequestErrorPayload {
  code?: number;
  error?: unknown;
  message: string;
  method?: string;
  response?: ApiResponse<unknown> | null;
  url?: string;
}

/** request 事件总线对应的事件和载荷类型映射。 */
export interface RequestEventPayloadMap {
  [REQUEST_EVENT_KEYS.ROUTER_PUSH]: RouteNavigationPayload;
  [REQUEST_EVENT_KEYS.ROUTER_REPLACE]: RouteNavigationPayload;
  [REQUEST_EVENT_KEYS.TOKEN_EXPIRED]: TokenExpiredPayload;
  [REQUEST_EVENT_KEYS.REQUEST_ERROR]: RequestErrorPayload;
  [REQUEST_EVENT_KEYS.REQUEST_START]: RequestLifecyclePayload;
  [REQUEST_EVENT_KEYS.REQUEST_END]: RequestLifecyclePayload;
}

/** 所有可订阅的 request 事件 key。 */
export type RequestEventKey = keyof RequestEventPayloadMap;

/** request 事件处理函数类型。 */
export type RequestEventHandler<K extends RequestEventKey = RequestEventKey> = (
  payload: RequestEventPayloadMap[K],
) => void;

/**
 * request 层统一抛出的错误对象。
 *
 * 可以在 `catch` 里通过 `error.isRequestError === true` 判断是否为请求错误。
 */
export interface RequestError<TData = unknown> extends Error {
  /** 业务状态码或兜底状态码 */
  code: number;
  /** 发起请求时使用的配置 */
  config?: InternalRequestConfig;
  /** 标记这是 request 层封装后的错误 */
  isRequestError: true;
  /** 原始错误对象，通常是 axios error */
  originalError?: unknown;
  /** 后端返回的响应体，没有时为 `null` */
  response: ApiResponse<TData> | null;
}
