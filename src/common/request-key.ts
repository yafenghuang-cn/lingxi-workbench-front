/**
 * 存储 key 统一管理
 */
export const STORAGE_KEYS = {
  /** 用户 token */
  TOKEN: "liang_access_token",
  /** 用户信息 */
  USER_INFO: "user_info",
} as const;

/**
 * 请求相关事件 key 统一管理
 */
export const REQUEST_EVENT_KEYS = {
  /** 路由跳转事件 */
  ROUTER_PUSH: "router:push",
  /** 路由替换事件 */
  ROUTER_REPLACE: "router:replace",
  /** Token 过期事件 */
  TOKEN_EXPIRED: "token:expired",
  /** 请求错误事件 */
  REQUEST_ERROR: "request:error",
  /** 请求开始事件 */
  REQUEST_START: "request:start",
  /** 请求结束事件 */
  REQUEST_END: "request:end",
} as const;

/**
 * 兼容已有命名
 */
export const EVENT_KEYS = REQUEST_EVENT_KEYS;

/**
 * 响应状态码
 */
export const RESPONSE_CODES = {
  /** 成功 */
  SUCCESS: 0,
  /** 未授权 */
  UNAUTHORIZED: 401,
  /** 禁止访问 */
  FORBIDDEN: 403,
  /** 资源不存在 */
  NOT_FOUND: 404,
  /** 服务器错误 */
  SERVER_ERROR: 500,
} as const;
