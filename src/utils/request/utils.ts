import axios, { AxiosHeaders, type AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";

import { RESPONSE_CODES } from "@/common/request-key";

import type {
  ApiResponse,
  InternalRequestConfig,
  RequestConfig,
  RequestController,
  RequestError,
  RequestEventHandler,
  RequestEventKey,
  RequestEventPayloadMap,
  RequestProgressEvent,
  RequestProgressType,
} from "./types.ts";

/** request 模块内部使用的轻量事件总线。 */
const requestEventBus = new Map<RequestEventKey, Set<(payload: unknown) => void>>();

/** 这些状态码默认认为适合自动重试。 */
const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

/** 把 axios 原始进度事件规整成业务层更容易直接消费的结构。 */
export const normalizeRequestProgressEvent = (
  type: RequestProgressType,
  event: RequestProgressEvent["originalEvent"],
): RequestProgressEvent => {
  const progress =
    typeof event.progress === "number"
      ? event.progress
      : typeof event.total === "number" && event.total > 0
        ? event.loaded / event.total
        : undefined;

  return {
    bytes: event.bytes,
    estimated: event.estimated,
    lengthComputable: typeof event.total === "number" && event.total > 0,
    loaded: event.loaded,
    originalEvent: event,
    percent: typeof progress === "number" ? Number((progress * 100).toFixed(2)) : undefined,
    progress,
    rate: event.rate,
    total: event.total,
    type,
  };
};

/**
 * 把后端响应规整成统一结构。
 *
 * - 如果后端已经返回 `{ code, data, message }`，直接兜底补全字段
 * - 如果后端直接返回业务数据，则用 HTTP 状态码和状态文案包装一层
 */
export const normalizeResponse = <TData = unknown>(
  response: AxiosResponse<ApiResponse<TData> | TData>,
): ApiResponse<TData> => {
  const payload = response.data;

  if (
    typeof payload === "object" &&
    payload !== null &&
    ("code" in payload || "data" in payload || "message" in payload)
  ) {
    const normalizedPayload = payload as Partial<ApiResponse<TData>>;

    return {
      code: typeof normalizedPayload.code === "number" ? normalizedPayload.code : response.status,
      data: normalizedPayload.data as TData,
      message: typeof normalizedPayload.message === "string" ? normalizedPayload.message : response.statusText || "",
    };
  }

  return {
    code: response.status,
    data: payload as TData,
    message: response.statusText || "",
  };
};

/** 判断当前请求是否要求返回完整响应体。 */
export const shouldReturnRawResponse = (config?: Pick<RequestConfig, "returnRawResponse">): boolean =>
  config?.returnRawResponse === true;

/** 兼容 axios 不同取消请求写法的统一判断。 */
export const isRequestCanceled = (error: unknown): boolean =>
  axios.isCancel(error) || (axios.isAxiosError(error) && error.code === "ERR_CANCELED");

/** 统一兜底后端消息文案。 */
export const getResponseMessage = (messageText?: string): string => messageText || "请求失败，请稍后重试";

/** 把 axios / JS error 归一成可直接给 UI 展示的错误文案。 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "请求超时，请稍后重试";
    }

    if (error.code === "ERR_CANCELED") {
      return error.message || "请求已取消";
    }

    if (!error.response) {
      return "网络异常，请检查网络连接";
    }

    return getResponseMessage(normalizeResponse(error.response).message || error.message);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

/** 生成 request 层统一抛出的错误对象，方便业务侧按同一结构处理。 */
export const createRequestError = <TData = unknown>({
  config,
  message,
  originalError,
  response,
}: {
  config?: InternalRequestConfig;
  message?: string;
  originalError?: unknown;
  response?: ApiResponse<TData> | null;
}): RequestError<TData> => {
  const requestError = new Error(getResponseMessage(message || response?.message)) as RequestError<TData>;

  requestError.code = response?.code ?? RESPONSE_CODES.SERVER_ERROR;
  requestError.config = config;
  requestError.isRequestError = true;
  requestError.originalError = originalError;
  requestError.response = response ?? null;

  return requestError;
};

/** 统一补齐常用请求头，避免每次手动传 Content-Type 和 Authorization。 */
export const attachRequestHeaders = (headers?: unknown, accessToken?: string): AxiosHeaders => {
  const requestHeaders = AxiosHeaders.from(headers as string | AxiosHeaders | undefined);

  if (!requestHeaders.get("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (accessToken && !requestHeaders.get("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return requestHeaders;
};

/**
 * 把 request 自定义配置转换成 axios 真正消费的配置。
 *
 * 这里会顺手把独立的 `progress` 配置翻译成 axios 的
 * `onUploadProgress` / `onDownloadProgress` 回调。
 */
export const createAxiosRequestConfig = <TData = unknown>(
  config: InternalRequestConfig<TData>,
): AxiosRequestConfig<TData> => {
  const { _retryCount, progress, returnRawResponse, retry, retryDelay, ...axiosConfig } = config;

  return {
    ...axiosConfig,
    onDownloadProgress: progress?.onDownload
      ? (event) => {
          progress.onDownload?.(normalizeRequestProgressEvent("download", event));
        }
      : undefined,
    onUploadProgress: progress?.onUpload
      ? (event) => {
          progress.onUpload?.(normalizeRequestProgressEvent("upload", event));
        }
      : undefined,
  };
};

/**
 * 判断当前错误是否应该自动重试。
 *
 * 规则：
 * - 主动取消的请求不重试
 * - 超过最大重试次数不重试
 * - 无响应的网络错误默认可重试
 * - 命中指定状态码时可重试
 */
export const shouldRetryRequest = (error: AxiosError, config?: InternalRequestConfig): boolean => {
  if (!config || isRequestCanceled(error)) {
    return false;
  }

  const maxRetries = config.retry ?? 0;
  const currentRetryCount = config._retryCount ?? 0;

  if (maxRetries <= 0 || currentRetryCount >= maxRetries) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return RETRY_STATUS_CODES.has(error.response.status);
};

/** 根据当前重试次数计算延迟时间，形成一个简单的递增退避。 */
export const getRetryDelay = (config?: InternalRequestConfig): number => {
  const currentRetryCount = config?._retryCount ?? 0;
  const retryDelay = config?.retryDelay ?? 300;

  return Math.max(retryDelay * currentRetryCount, retryDelay);
};

export const sleep = (delay: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });

/** 订阅 request 事件，并返回对应的取消订阅函数。 */
export const subscribeRequestEvent = <K extends RequestEventKey>(
  key: K,
  handler: RequestEventHandler<K>,
): (() => void) => {
  const handlers = requestEventBus.get(key) ?? new Set<(payload: unknown) => void>();

  handlers.add(handler as (payload: unknown) => void);
  requestEventBus.set(key, handlers);

  return () => {
    handlers.delete(handler as (payload: unknown) => void);

    if (handlers.size === 0) {
      requestEventBus.delete(key);
    }
  };
};

/** 发布 request 事件。 */
export const publishRequestEvent = <K extends RequestEventKey>(key: K, payload: RequestEventPayloadMap[K]): void => {
  requestEventBus.get(key)?.forEach((handler) => {
    handler(payload);
  });
};

/** 创建一个可手动取消的请求控制器。 */
export const createRequestController = (): RequestController => {
  const controller = new AbortController();

  return {
    cancel: (reason?: string) => controller.abort(reason),
    controller,
    signal: controller.signal,
  };
};
