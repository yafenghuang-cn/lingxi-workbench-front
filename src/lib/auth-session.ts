import { message } from "antd";

import { clearAccessToken } from "@/lib/auth-token";

const LOGIN_PATH = "/login";
const REDIRECT_DELAY_MS = 800;

let redirecting = false;

const showUnauthorizedMessage = (tip?: string) => {
  message.warning({
    content: tip?.trim() || "登录已过期，请重新登录",
    key: "unauthorized",
  });
};

export const getPostLoginRedirect = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  const redirect = new URLSearchParams(window.location.search).get("redirect");

  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }

  return "/";
};

type RequestErrorLike = {
  status?: number;
  code?: number | string;
  message?: string;
};

export const isUnauthorizedError = (error: RequestErrorLike): boolean => {
  if (error.status === 401) {
    return true;
  }

  const code = error.code;

  if (code === 401 || code === "401" || code === 1003) {
    return true;
  }

  return false;
};

export const getUnauthorizedMessage = (error: RequestErrorLike): string => {
  const text = error.message?.trim();

  if (text && !/^HTTP error:/i.test(text)) {
    return text;
  }

  return "登录已过期，请重新登录";
};

export const handleUnauthorized = (tip?: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  clearAccessToken();

  const currentPath = window.location.pathname;

  if (currentPath === LOGIN_PATH) {
    showUnauthorizedMessage(tip ?? "请先登录");
    return;
  }

  if (redirecting) {
    return;
  }

  redirecting = true;
  showUnauthorizedMessage(tip);

  const redirectUrl = `${LOGIN_PATH}?redirect=${encodeURIComponent(
    `${currentPath}${window.location.search}`,
  )}`;

  window.setTimeout(() => {
    window.location.replace(redirectUrl);
  }, REDIRECT_DELAY_MS);
};
