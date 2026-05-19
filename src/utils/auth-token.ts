import { message } from "antd";

import { STORAGE_KEYS } from "@/common/request-key";

import { getLocalStorage, removeLocalStorage, setLocalStorage } from "./StorageValue";

// 把 token 存储到本地缓存
export const setAccessToken = (token: string): void => {
  if (!token) {
    message.open({ type: "warning", content: "token不能为空" });
    return;
  }

  setLocalStorage(STORAGE_KEYS.TOKEN, token);
};

// 获取 token
export const getAccessToken = (): string => getLocalStorage(STORAGE_KEYS.TOKEN) as string;

// 清除 token
export const clearAccessToken = (): void => removeLocalStorage(STORAGE_KEYS.TOKEN);
