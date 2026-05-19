import request, { del, get, patch, post, put } from "./core.ts";

export { createRequestController, isRequestCanceled, publishRequestEvent, subscribeRequestEvent } from "./utils.ts";
export { del, del as deleteRequest, get, patch, post, put, request };
export type {
  AnyRequestMethodConfig,
  ApiResponse,
  DataRequestConfig,
  RawRequestConfig,
  RawRequestMethodConfig,
  RequestConfig,
  RequestController,
  RequestError,
  RequestEventHandler,
  RequestEventKey,
  RequestEventPayloadMap,
  RequestMethodConfig,
  RequestProgressConfig,
  RequestProgressEvent,
  RequestProgressHandler,
  RequestProgressType,
} from "./types.ts";
