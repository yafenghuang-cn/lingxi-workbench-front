/**
 * 登录请求参数
 */
export interface IWebLoginDto {
  /** 密码 */
  password: string;
  /** 用户名 */
  username: string;
  /** 是否记住 */
  rememberMe: boolean;
}

/**
 * 登录响应参数
 */
export interface IWebAuthSessionResponseDto {
  /** 访问令牌 */
  accessToken: string;
}

/**
 * 注册请求参数
 */
export interface IWebRegisterDto {
  /** 确认密码 */
  confirmPassword: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
  /** 用户名 */
  username: string;
}

/**
 * 注册响应参数
 */
export interface IAuthSessionResponseDto {
  /** 过期时间 */
  expiresIn: number;
  /** 手机号 */
  phone: string;
  /** 令牌 */
  token: string;
  /** 用户ID */
  userId: string;
  username: string;
}
