import axios from "axios";

import { handleUnauthorized } from "@/lib/auth-session";
import { getAccessToken } from "@/lib/auth-token";
import request from "@/utils/request/request";
import type { ChatStreamRequestBody, WebAiUploadedFile } from "@/types/ai-chat";

export type WebAiApiKeyConfig = {
  requestUrl: string;
  model: string;
  hasApiKeyToken: boolean;
  apiKeyTokenMasked: string;
  updatedAt: string | null;
};

const API_BASE_URL = (import.meta.env.PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

export const fetchApiKeyConfig = async (): Promise<WebAiApiKeyConfig> => {
  return request<WebAiApiKeyConfig>({
    method: "GET",
    url: "/web/ai/api-key-config",
  });
};

export const saveApiKeyConfig = async (
  requestUrl: string,
  model: string,
  apiKeyToken?: string,
): Promise<WebAiApiKeyConfig> => {
  return request<WebAiApiKeyConfig>({
    method: "PUT",
    url: "/web/ai/api-key-config",
    data: {
      requestUrl: requestUrl.trim(),
      model: model.trim(),
      ...(apiKeyToken?.trim() ? { apiKeyToken: apiKeyToken.trim() } : {}),
    },
  });
};

export const deleteApiKeyConfig = async (): Promise<WebAiApiKeyConfig> => {
  return request<WebAiApiKeyConfig>({
    method: "DELETE",
    url: "/web/ai/api-key-config",
  });
};

export const uploadChatImage = async (file: File): Promise<WebAiUploadedFile> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAccessToken();

  const response = await axios.post(`${API_BASE_URL}/web/ai/files`, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 60_000,
  });

  const payload = response.data as { code: number; data: WebAiUploadedFile; message: string };

  if (payload.code !== 0) {
    throw new Error(payload.message || "图片上传失败");
  }

  return payload.data;
};

export const postChatStream = async (
  body: ChatStreamRequestBody,
  signal?: AbortSignal,
): Promise<Response> => {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/web/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (response.status === 401) {
    const unauthorizedError = Object.assign(new Error("未授权"), {
      status: 401,
      code: 1003,
    });
    handleUnauthorized("登录已过期，请重新登录");
    throw unauthorizedError;
  }

  if (!response.ok) {
    let message = `AI 对话接口请求失败（${response.status}）`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      if (errorPayload.message) {
        message = errorPayload.message;
      }
    } catch {
      // ignore parse error
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("AI 对话接口未返回流式响应");
  }

  return response;
};
