import { post } from "@/utils/request";
import type { IAuthSessionResponseDto, IWebAuthSessionResponseDto, IWebLoginDto, IWebRegisterDto } from "./types";

export const login = (data: IWebLoginDto): Promise<IWebAuthSessionResponseDto> => {
  return post("/web/users/login", data);
};

export const register = (data: IWebRegisterDto): Promise<IAuthSessionResponseDto> => {
  return post("/web/users/register", data);
};
