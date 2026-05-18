import request from "@/utils/request/request";
import { setAccessToken } from "@/lib/auth-token";

export type WebLoginPayload = {
  username: string;
  password: string;
  rememberMe?: boolean;
};

export type WebRegisterPayload = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type WebLoginResponse = {
  accessToken: string;
};

type WebRegisterResponse = {
  token: string;
};

export const loginWebUser = async (payload: WebLoginPayload): Promise<void> => {
  const data = await request<WebLoginResponse>({
    method: "POST",
    url: "/web/users/login",
    data: payload,
    skipAuth: true,
  });

  setAccessToken(data.accessToken);
};

export const registerWebUser = async (payload: WebRegisterPayload): Promise<void> => {
  const data = await request<WebRegisterResponse>({
    method: "POST",
    url: "/web/users/register",
    data: payload,
    skipAuth: true,
  });

  setAccessToken(data.token);
};
