// src/api/request/keys.ts
/**
 * 存储key统一管理
 */
export const STORAGE_KEYS = {
  /** 用户token */
  TOKEN: 'access_token',
  /** 用户信息 */
  USER_INFO: 'user_info',
};

/**
 * 事件key统一管理
 */
export const EVENT_KEYS = {
  /** 路由跳转事件 */
  ROUTER_PUSH: 'router:push',
  /** 路由替换事件 */
  ROUTER_REPLACE: 'router:replace',
  /** Token过期事件 */
  TOKEN_EXPIRED: 'token:expired',
  /** 请求错误事件 */
  REQUEST_ERROR: 'request:error',
  /** 请求开始事件 */
  REQUEST_START: 'request:start',
  /** 请求结束事件 */
  REQUEST_END: 'request:end',
};

/**
 * 响应状态码
 */
export const RESPONSE_CODES = {
  /** 成功 */
  SUCCESS: 200,
  /** 未授权 */
  UNAUTHORIZED: 401,
  /** 禁止访问 */
  FORBIDDEN: 403,
  /** 资源不存在 */
  NOT_FOUND: 404,
  /** 服务器错误 */
  SERVER_ERROR: 500,
};
