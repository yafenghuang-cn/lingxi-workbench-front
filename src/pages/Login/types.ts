export interface IWebLoginPayload {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface IWebRegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
