import { setLocalStorage,getLocalStorage,removeLocalStorage } from "./StorageValue";
import { message } from "antd";

const ACCESS_TOKEN_KEY = "liang_access_token";

//把token存储本地缓存
export const setAccessToken = (token: string): void => {
  if (!token) {
    message.open({ type: "warning", content: "token不能为空" });
    return;
  }
  setLocalStorage(ACCESS_TOKEN_KEY, token);
};

//获取token
export const getAccessToken = (): string => {
  return getLocalStorage(ACCESS_TOKEN_KEY) as string
};

//清除token
export const clearAccessToken = (): void => {
  removeLocalStorage(ACCESS_TOKEN_KEY);
};
