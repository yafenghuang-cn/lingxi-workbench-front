export interface IWebLoginDto {
  password: string;
  username: string;
  rememberMe: boolean;
}

export interface IWebAuthSessionResponseDto {
  accessToken: string;
}

export interface IWebRegisterDto {
  confirmPassword: string;
  email: string;
  password: string;
  username: string;
}

export interface IAuthSessionResponseDto {
  expiresIn: number;
  phone: string;
  token: string;
  userId: string;
  username: string;
}
