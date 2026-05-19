import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { message } from "antd";

import { REQUEST_EVENT_KEYS, RESPONSE_CODES } from "@/common/request-key";
import { getAccessToken } from "@/utils/auth-token";

import type {
  AnyRequestMethodConfig,
  ApiResponse,
  DataRequestConfig,
  InternalRequestConfig,
  RawRequestConfig,
  RawRequestMethodConfig,
  RequestConfig,
  RequestMethodConfig,
} from "./types.ts";
import {
  attachRequestHeaders,
  createAxiosRequestConfig,
  createRequestError,
  getErrorMessage,
  getResponseMessage,
  getRetryDelay,
  isRequestCanceled,
  normalizeResponse,
  publishRequestEvent,
  shouldRetryRequest,
  shouldReturnRawResponse,
  sleep,
} from "./utils.ts";

/** 项目内统一使用的 axios 实例。 */
const instance = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

/** 通知上层：当前登录态已失效，需要统一处理跳转或清理逻辑。 */
const notifyUnauthorized = (): void => {
  if (!getAccessToken()) {
    return;
  }

  publishRequestEvent(REQUEST_EVENT_KEYS.TOKEN_EXPIRED, {});
};

/** 请求结束时广播生命周期事件，方便外层做 loading 或埋点处理。 */
const notifyRequestEnd = (requestConfig?: InternalRequestConfig): void => {
  publishRequestEvent(REQUEST_EVENT_KEYS.REQUEST_END, {
    method: requestConfig?.method?.toUpperCase(),
    url: requestConfig?.url,
  });
};

/** 请求失败时广播错误事件，方便外层统一监听。 */
const notifyRequestError = (
  requestConfig: InternalRequestConfig | undefined,
  response: ApiResponse<unknown> | null,
  error: unknown,
  messageText: string,
): void => {
  publishRequestEvent(REQUEST_EVENT_KEYS.REQUEST_ERROR, {
    code: response?.code,
    error,
    message: messageText,
    method: requestConfig?.method?.toUpperCase(),
    response,
    url: requestConfig?.url,
  });
};

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在请求发出前统一补齐鉴权头，并抛出开始事件
    config.headers = attachRequestHeaders(config.headers, getAccessToken());

    publishRequestEvent(REQUEST_EVENT_KEYS.REQUEST_START, {
      method: config.method?.toUpperCase(),
      url: config.url,
    });

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 统一处理业务成功返回。
 *
 * 这里的“成功”指的是 HTTP 请求正常拿到了响应；至于业务是否成功，
 * 仍然要看后端返回的 `code`。
 */
const handleSuccessResponse = <TResponse>(
  response: AxiosResponse<ApiResponse<TResponse> | TResponse>,
  requestConfig: InternalRequestConfig,
): TResponse | ApiResponse<TResponse> => {
  notifyRequestEnd(requestConfig);

  // 无论后端是否已经是统一结构，这里都先规整成 `{ code, data, message }`
  const normalizedResponse = normalizeResponse(response);

  if (normalizedResponse.code === RESPONSE_CODES.SUCCESS) {
    return shouldReturnRawResponse(requestConfig) ? normalizedResponse : normalizedResponse.data;
  }

  if (normalizedResponse.code === RESPONSE_CODES.UNAUTHORIZED) {
    notifyUnauthorized();
  }

  const errorMessage = getResponseMessage(normalizedResponse.message);

  notifyRequestError(requestConfig, normalizedResponse, normalizedResponse, errorMessage);

  if (shouldReturnRawResponse(requestConfig)) {
    return normalizedResponse;
  }

  if (normalizedResponse.code !== RESPONSE_CODES.UNAUTHORIZED) {
    message.error(errorMessage);
  }

  throw createRequestError({
    config: requestConfig,
    response: normalizedResponse,
  });
};

/**
 * 统一处理请求异常。
 *
 * 包含三类情况：
 * - 可重试的网络错误
 * - 主动取消请求
 * - 普通请求失败 / 业务异常
 */
const handleErrorResponse = async <TResponse>(
  error: unknown,
  requestConfig: InternalRequestConfig,
): Promise<TResponse | ApiResponse<TResponse>> => {
  if (axios.isAxiosError(error) && shouldRetryRequest(error, requestConfig)) {
    requestConfig._retryCount = (requestConfig._retryCount ?? 0) + 1;
    await sleep(getRetryDelay(requestConfig));

    return executeRequest<TResponse>(requestConfig);
  }

  notifyRequestEnd(requestConfig);

  if (isRequestCanceled(error)) {
    throw error;
  }

  const normalizedResponse = axios.isAxiosError(error) && error.response ? normalizeResponse(error.response) : null;
  const isUnauthorized =
    normalizedResponse?.code === RESPONSE_CODES.UNAUTHORIZED ||
    (axios.isAxiosError(error) && error.response?.status === RESPONSE_CODES.UNAUTHORIZED);

  if (isUnauthorized) {
    notifyUnauthorized();
  }

  if (shouldReturnRawResponse(requestConfig) && normalizedResponse) {
    notifyRequestError(requestConfig, normalizedResponse, error, normalizedResponse.message);
    return normalizedResponse;
  }

  const errorMessage = normalizedResponse?.message || getErrorMessage(error);

  if (!shouldReturnRawResponse(requestConfig) && !isUnauthorized) {
    message.error(errorMessage);
  }

  notifyRequestError(requestConfig, normalizedResponse, error, errorMessage);

  throw createRequestError({
    config: requestConfig,
    message: errorMessage,
    originalError: error,
    response: normalizedResponse,
  });
};

/** 真正执行请求的底层入口，所有 `get/post/...` 最终都会走到这里。 */
const executeRequest = async <TResponse = unknown, TData = unknown>(
  config: InternalRequestConfig<TData>,
): Promise<TResponse | ApiResponse<TResponse>> => {
  try {
    const response = await instance.request<
      ApiResponse<TResponse> | TResponse,
      AxiosResponse<ApiResponse<TResponse> | TResponse>,
      TData
    >(createAxiosRequestConfig(config));

    return handleSuccessResponse(response, config);
  } catch (error) {
    return handleErrorResponse<TResponse>(error, config);
  }
};

function request<TResponse = unknown>(config: RawRequestConfig): Promise<ApiResponse<TResponse>>;
function request<TResponse = unknown>(config: DataRequestConfig): Promise<TResponse>;
function request<TResponse = unknown>(config: RequestConfig): Promise<TResponse | ApiResponse<TResponse>>;
function request<TResponse = unknown>(config: RequestConfig): Promise<TResponse | ApiResponse<TResponse>> {
  return executeRequest<TResponse>(config as InternalRequestConfig);
}

type RequestMethodWithoutBody = "DELETE" | "GET";
type RequestMethodWithBody = "PATCH" | "POST" | "PUT";

/** `get` / `del` 这类无请求体方法的函数签名。 */
interface RequestWithoutBodyHandler {
  <TResponse = unknown>(url: string, config: RawRequestMethodConfig): Promise<ApiResponse<TResponse>>;
  <TResponse = unknown>(url: string, config?: RequestMethodConfig): Promise<TResponse>;
}

/** `post` / `put` / `patch` 这类带请求体方法的函数签名。 */
interface RequestWithBodyHandler {
  <TResponse = unknown, TData = unknown>(
    url: string,
    data: TData | undefined,
    config: RawRequestMethodConfig<TData>,
  ): Promise<ApiResponse<TResponse>>;
  <TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: RequestMethodConfig<TData>,
  ): Promise<TResponse>;
}

/** 把方法、地址、请求体和额外配置拼成 request 能直接消费的完整配置。 */
const createRequestConfig = <TData = unknown>(
  method: RequestMethodWithoutBody | RequestMethodWithBody,
  url: string,
  config?: AnyRequestMethodConfig<TData>,
  data?: TData,
): RequestConfig<TData> =>
  ({
    ...config,
    data,
    method,
    url,
  }) as RequestConfig<TData>;

/** 生成 `get` / `del` 这类无请求体方法。 */
const createRequestWithoutBody = (method: RequestMethodWithoutBody): RequestWithoutBodyHandler =>
  ((url: string, config?: RequestMethodConfig | RawRequestMethodConfig) =>
    request(createRequestConfig(method, url, config))) as RequestWithoutBodyHandler;

/** 生成 `post` / `put` / `patch` 这类带请求体方法。 */
const createRequestWithBody = (method: RequestMethodWithBody): RequestWithBodyHandler =>
  ((url: string, data?: unknown, config?: AnyRequestMethodConfig) =>
    request(createRequestConfig(method, url, config, data))) as RequestWithBodyHandler;

/** 发起 GET 请求，第二个参数传额外配置。 */
const get = createRequestWithoutBody("GET");
/** 发起 DELETE 请求，第二个参数传额外配置。 */
const del = createRequestWithoutBody("DELETE");
/** 发起 POST 请求，第三个参数传额外配置。 */
const post = createRequestWithBody("POST");
/** 发起 PUT 请求，第三个参数传额外配置。 */
const put = createRequestWithBody("PUT");
/** 发起 PATCH 请求，第三个参数传额外配置。 */
const patch = createRequestWithBody("PATCH");

export { del, get, patch, post, put };

export default request;
