import { request } from "@/utils/request";
import type { IAuthSessionResponseDto, IWebAuthSessionResponseDto, IWebLoginDto, IWebRegisterDto } from "./types";

//登录接口
export const login = async (data: IWebLoginDto): Promise<IWebAuthSessionResponseDto> => {
  return await request({
    method: "POST",
    url: "/web/users/login",
    data,
  });
};

//注册接口
export const register = async (data: IWebRegisterDto): Promise<IAuthSessionResponseDto> => {
  return await request({
    method: "POST",
    url: "/web/users/register",
    data,
  });
};
