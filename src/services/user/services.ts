import { post } from "@/utils/request";
import type { IAuthSessionResponseDto, IWebAuthSessionResponseDto, IWebLoginDto, IWebRegisterDto } from "./types";

//登录接口
export const login = async (data: IWebLoginDto): Promise<IWebAuthSessionResponseDto> => {
  return await post("/api/login", data);
};

//注册接口
export const register = async (data: IWebRegisterDto): Promise<IAuthSessionResponseDto> => {
  return await post("/api/register", data);
};
