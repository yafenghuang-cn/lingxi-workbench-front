export const REQUEST_EVENT_KEYS = {
  LOGIN: "request:login",
  FORBIDDEN: "request:forbidden",
  UNAUTHORIZED: "request:unauthorized",
  TOKEN_EXPIRED: "request:token-expired",
  NETWORK_ERROR: "request:network-error",
} as const;

export type RequestEventKey = (typeof REQUEST_EVENT_KEYS)[keyof typeof REQUEST_EVENT_KEYS];
