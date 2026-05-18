import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { getAccessToken } from "@/lib/auth-token";
import {
  getUnauthorizedMessage,
  handleUnauthorized,
  isUnauthorizedError,
} from "@/lib/auth-session";
import type { IResponse } from "@/utils/request/types";

export const DEFAULT_API_PREFIX = "api";
export const SUCCESS_CODES = new Set([0, 200]);
export const EMPTY_SUCCESS_PAYLOADS: readonly unknown[] = [null, undefined];

const API_BASE_URL = (import.meta.env.PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

type RequestConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseApiEnvelope = <T>(payload: unknown): T => {
  if (!isRecord(payload) || typeof payload.code !== "number") {
    throw new Error("接口响应格式异常");
  }

  if (!SUCCESS_CODES.has(payload.code)) {
    const error = new Error(
      typeof payload.message === "string" ? payload.message : "请求失败",
    ) as Error & { code?: number; status?: number };

    error.code = payload.code;
    error.status = payload.code === 1003 ? 401 : undefined;
    throw error;
  }

  return payload.data as T;
};

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use((config: RequestConfig) => {
  if (!config.skipAuth) {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

instance.interceptors.response.use(
  (response) => {
    return parseApiEnvelope(response.data);
  },
  (error: AxiosError<IResponse<unknown>>) => {
    const payload = error.response?.data;

    if (isRecord(payload) && typeof payload.code === "number") {
      const businessError = new Error(
        typeof payload.message === "string" ? payload.message : "请求失败",
      ) as Error & { code?: number; status?: number };

      businessError.code = payload.code;
      businessError.status = error.response?.status;

      if (
        !((error.config as RequestConfig | undefined)?.skipAuth) &&
        isUnauthorizedError(businessError)
      ) {
        handleUnauthorized(getUnauthorizedMessage(businessError));
      }

      return Promise.reject(businessError);
    }

    const networkError = new Error(error.message || "网络请求失败") as Error & {
      status?: number;
    };
    networkError.status = error.response?.status;

    return Promise.reject(networkError);
  },
);

type RequestOptions<TBody = unknown> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  data?: TBody;
  params?: Record<string, unknown>;
  skipAuth?: boolean;
};

const request = async <T>(options: RequestOptions): Promise<T> => {
  return instance.request<unknown, T>({
    method: options.method ?? "GET",
    url: options.url,
    data: options.data,
    params: options.params,
    skipAuth: options.skipAuth,
  });
};

export default request;
