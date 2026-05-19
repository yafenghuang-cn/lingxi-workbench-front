# request 封装使用说明

本文档说明项目内 `@/utils/request` 的使用方式，适合直接同步到飞书文档。

## 1. 引入方式

```ts
import {
  del,
  get,
  patch,
  post,
  put,
  request,
  createRequestController,
  isRequestCanceled,
  subscribeRequestEvent,
  type ApiResponse,
  type RequestError,
  type RequestProgressEvent,
} from "@/utils/request";
```

常用方法说明：

- `get(url, config?)`
- `del(url, config?)`
- `post(url, data?, config?)`
- `put(url, data?, config?)`
- `patch(url, data?, config?)`
- `request(config)` 适合少量需要完全手动控制请求配置的场景

## 2. 默认返回值

默认情况下，请求方法返回的是后端响应体里的 `data`，不是完整响应结构。

例如后端返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "xxx"
  }
}
```

那么下面这段代码拿到的就是 `data`：

```ts
interface IWebLoginDto {
  email: string;
  password: string;
}

interface IWebAuthSessionResponseDto {
  accessToken: string;
}

export const login = (data: IWebLoginDto): Promise<IWebAuthSessionResponseDto> => {
  return post<IWebAuthSessionResponseDto, IWebLoginDto>("/web/users/login", data);
};
```

调用方式：

```ts
const result = await login({
  email: "demo@test.com",
  password: "123456",
});

console.log(result.accessToken);
```

## 3. 返回完整响应体

如果需要拿到 `code`、`message`、`data` 整个结构，可以传：

```ts
returnRawResponse: true;
```

示例：

```ts
interface IWebAuthSessionResponseDto {
  accessToken: string;
}

export const loginWithRawResponse = (data: IWebLoginDto): Promise<ApiResponse<IWebAuthSessionResponseDto>> => {
  return post<IWebAuthSessionResponseDto, IWebLoginDto>("/web/users/login", data, {
    returnRawResponse: true,
  });
};
```

调用方式：

```ts
const response = await loginWithRawResponse({
  email: "demo@test.com",
  password: "123456",
});

console.log(response.code);
console.log(response.message);
console.log(response.data.accessToken);
```

注意：

- `IWebAuthSessionResponseDto` 只描述 `data` 里的结构
- 不要在 DTO 里声明 `code`、`message`、`data`
- 完整响应体类型要写成 `ApiResponse<IWebAuthSessionResponseDto>`

## 4. 常用配置项

除了 request 封装扩展的字段外，第三个参数仍然支持 axios 常用配置。

常见可传字段：

- `headers`
- `timeout`
- `params`
- `signal`
- `retry`
- `retryDelay`
- `returnRawResponse`
- `progress`

示例：

```ts
const result = await post<UserInfo, UpdateUserDto>("/web/users/update", payload, {
  headers: {
    "X-Trace-Id": "trace-id-001",
  },
  timeout: 10000,
  retry: 2,
  retryDelay: 500,
});
```

## 5. GET / POST / PUT / PATCH / DELETE 示例

### GET

```ts
const profile = await get<UserProfile>("/web/users/profile", {
  params: {
    includeRole: true,
  },
});
```

### POST

```ts
const result = await post<CreateOrderResponse, CreateOrderDto>("/web/orders", payload);
```

### PUT

```ts
const result = await put<UserInfo, UpdateUserDto>("/web/users/profile", payload);
```

### PATCH

```ts
const result = await patch<UserInfo, Partial<UpdateUserDto>>("/web/users/profile", {
  nickname: "new-name",
});
```

### DELETE

```ts
await del("/web/users/1");
```

## 6. 上传和下载进度

当前 request 层已经把进度能力单独封装成 `progress` 字段，不需要直接使用 axios 的 `onUploadProgress` / `onDownloadProgress`。

### 上传进度

```ts
const formData = new FormData();
formData.append("file", file);

const result = await post<UploadResponse, FormData>("/web/files/upload", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
  progress: {
    onUpload: (event) => {
      console.log(event.type);
      console.log(event.loaded);
      console.log(event.total);
      console.log(event.progress);
      console.log(event.percent);
    },
  },
});
```

### 下载进度

```ts
const result = await get<Blob>("/web/files/export", {
  responseType: "blob",
  progress: {
    onDownload: (event) => {
      console.log(event.percent);
    },
  },
});
```

`RequestProgressEvent` 常用字段：

- `type`: `"upload"` 或 `"download"`
- `loaded`: 当前已传输字节数
- `total`: 总字节数
- `progress`: 0 ~ 1
- `percent`: 0 ~ 100
- `originalEvent`: axios 原始进度事件

## 7. 请求取消

如果页面切换、弹窗关闭、重复点击等场景需要主动取消请求，可以使用 `createRequestController`。

```ts
const controller = createRequestController();

const requestPromise = get<UserProfile>("/web/users/profile", {
  signal: controller.signal,
});

controller.cancel("user canceled");
```

捕获取消请求：

```ts
try {
  await get<UserProfile>("/web/users/profile", {
    signal: controller.signal,
  });
} catch (error) {
  if (isRequestCanceled(error)) {
    return;
  }

  throw error;
}
```

## 8. 自动重试

request 支持简单的自动重试。

```ts
const result = await get<UserProfile>("/web/users/profile", {
  retry: 2,
  retryDelay: 500,
});
```

说明：

- `retry`: 最多重试次数
- `retryDelay`: 每次重试的基础等待时间，单位毫秒

默认会参与重试的情况：

- 无响应的网络错误
- HTTP 状态码为 `408`、`429`、`500`、`502`、`503`、`504`

以下情况不会重试：

- 主动取消请求
- 已经超过最大重试次数

## 9. 错误处理

request 层抛出的错误会被统一包装成 `RequestError`。

```ts
try {
  await post<IWebAuthSessionResponseDto, IWebLoginDto>("/web/users/login", payload);
} catch (error) {
  const requestError = error as RequestError<IWebAuthSessionResponseDto>;

  console.log(requestError.isRequestError);
  console.log(requestError.code);
  console.log(requestError.message);
  console.log(requestError.response);
}
```

补充说明：

- 默认模式下，业务失败会弹出错误提示并抛错
- `returnRawResponse: true` 且后端返回了统一响应体时，业务失败会直接返回完整响应体，不会抛错

## 10. request 事件

request 内部带了一套轻量事件机制，用于处理全局导航、Token 失效、请求生命周期等场景。

当前内置事件包括：

- `REQUEST_START`
- `REQUEST_END`
- `REQUEST_ERROR`
- `TOKEN_EXPIRED`
- `ROUTER_PUSH`
- `ROUTER_REPLACE`

订阅示例：

```ts
import { REQUEST_EVENT_KEYS } from "@/common/request-key";
import { subscribeRequestEvent } from "@/utils/request";

const unsubscribe = subscribeRequestEvent(REQUEST_EVENT_KEYS.REQUEST_ERROR, (payload) => {
  console.log(payload.message);
  console.log(payload.url);
});

unsubscribe();
```

项目入口已经统一处理了：

- Token 失效后的登录态清理
- 通过事件触发的路由跳转

普通业务代码一般不需要重复处理。

## 11. 推荐的 service 层写法

推荐在 `src/services/**` 中只暴露业务方法，不把请求细节散到页面里。

```ts
import { post } from "@/utils/request";

export interface IWebLoginDto {
  email: string;
  password: string;
}

export interface IWebAuthSessionResponseDto {
  accessToken: string;
}

export const login = (data: IWebLoginDto): Promise<IWebAuthSessionResponseDto> => {
  return post<IWebAuthSessionResponseDto, IWebLoginDto>("/web/users/login", data);
};
```

如果某个接口业务上必须读取 `code` 或 `message`，就单独提供一个返回完整响应体的方法：

```ts
export const loginWithRawResponse = (data: IWebLoginDto): Promise<ApiResponse<IWebAuthSessionResponseDto>> => {
  return post<IWebAuthSessionResponseDto, IWebLoginDto>("/web/users/login", data, {
    returnRawResponse: true,
  });
};
```

## 12. 最常见的几个坑

### 1. DTO 类型写错层级

错误写法：

```ts
interface IWebAuthSessionResponseDto {
  code: number;
  data: {
    accessToken: string;
  };
  message: string;
}
```

正确写法：

```ts
interface IWebAuthSessionResponseDto {
  accessToken: string;
}
```

如果要完整响应体，请写：

```ts
Promise<ApiResponse<IWebAuthSessionResponseDto>>;
```

### 2. 开了 `returnRawResponse: true` 却还把返回类型写成 DTO

错误写法：

```ts
export const login = (data: IWebLoginDto): Promise<IWebAuthSessionResponseDto> => {
  return post("/web/users/login", data, {
    returnRawResponse: true,
  });
};
```

正确写法：

```ts
export const login = (data: IWebLoginDto): Promise<ApiResponse<IWebAuthSessionResponseDto>> => {
  return post<IWebAuthSessionResponseDto, IWebLoginDto>("/web/users/login", data, {
    returnRawResponse: true,
  });
};
```

### 3. 需要进度时还在直接找 axios 的 `onUploadProgress`

现在推荐统一改成：

```ts
progress: {
  onUpload: ({ percent }) => {
    console.log(percent);
  },
}
```

## 13. 一句话总结

- 默认返回 `data`
- 开启 `returnRawResponse: true` 后返回 `ApiResponse<T>`
- DTO 只描述 `data`
- 上传下载进度统一走 `progress`
- 取消请求走 `createRequestController`
- 需要全局行为时走 request 事件

## 14. 配置字段总表

说明：

- 下表基于当前项目里的 `RequestConfig` / `RequestMethodConfig` / `RawRequestMethodConfig`
- `get` / `del` 的配置在第 2 个参数
- `post` / `put` / `patch` 的配置在第 3 个参数
- `request(config)` 可以直接传完整配置对象
- 当前封装不直接暴露 axios 原生的 `onUploadProgress`、`onDownloadProgress`，统一改为 `progress.onUpload`、`progress.onDownload`
- 下表里部分字段来自 axios 原生配置；其中少数字段偏 Node 侧或底层传输控制，在当前浏览器项目里通常很少用到

### 14.1 顶层配置字段

| 字段                   | 类型                           | 适用调用               | 说明                                               |
| ---------------------- | ------------------------------ | ---------------------- | -------------------------------------------------- |
| `url`                  | `string`                       | `request(config)`      | 请求地址；`get/post/...` 已通过第 1 个参数传入     |
| `method`               | `string`                       | `request(config)`      | 请求方法；`get/del/post/put/patch` 已固定          |
| `baseURL`              | `string`                       | 全部                   | 覆盖默认的 `/api` 基础路径                         |
| `allowAbsoluteUrls`    | `boolean`                      | 全部                   | 是否允许绝对地址覆盖 `baseURL`                     |
| `transformRequest`     | `function \| function[]`       | 全部                   | 发送前转换请求数据                                 |
| `transformResponse`    | `function \| function[]`       | 全部                   | 响应返回后先做数据转换                             |
| `headers`              | `object`                       | 全部                   | 自定义请求头                                       |
| `params`               | `object`                       | 全部                   | 查询参数                                           |
| `paramsSerializer`     | `function \| object`           | 全部                   | 自定义查询参数序列化方式                           |
| `data`                 | `TData`                        | `request(config)` 为主 | 请求体；`post/put/patch` 更推荐直接用第 2 个参数传 |
| `timeout`              | `number`                       | 全部                   | 超时时间，单位毫秒                                 |
| `timeoutErrorMessage`  | `string`                       | 全部                   | 超时后的自定义错误消息                             |
| `withCredentials`      | `boolean`                      | 全部                   | 是否允许跨域请求带 cookie                          |
| `adapter`              | `function \| function[]`       | 全部                   | 自定义 axios adapter                               |
| `auth`                 | `object`                       | 全部                   | Basic Auth 配置                                    |
| `responseType`         | `string`                       | 全部                   | 响应类型，如 `json`、`blob`、`arraybuffer`         |
| `responseEncoding`     | `string`                       | 全部                   | 响应编码；浏览器场景基本很少用                     |
| `xsrfCookieName`       | `string`                       | 全部                   | XSRF cookie 名称                                   |
| `xsrfHeaderName`       | `string`                       | 全部                   | XSRF header 名称                                   |
| `maxContentLength`     | `number`                       | 全部                   | 允许的最大响应体大小                               |
| `validateStatus`       | `(status) => boolean`          | 全部                   | 自定义状态码是否视为成功                           |
| `maxBodyLength`        | `number`                       | 全部                   | 允许的最大请求体大小                               |
| `maxRedirects`         | `number`                       | 全部                   | 最大重定向次数                                     |
| `maxRate`              | `number \| [upload, download]` | 全部                   | 限制上传/下载速率                                  |
| `beforeRedirect`       | `function`                     | 全部                   | 重定向前执行的钩子                                 |
| `socketPath`           | `string \| null`               | 全部                   | Unix Socket 路径，Node 侧场景使用                  |
| `allowedSocketPaths`   | `string \| string[] \| null`   | 全部                   | 允许的 Socket 路径列表                             |
| `transport`            | `any`                          | 全部                   | 自定义底层传输实现                                 |
| `httpAgent`            | `any`                          | 全部                   | Node HTTP Agent                                    |
| `httpsAgent`           | `any`                          | 全部                   | Node HTTPS Agent                                   |
| `proxy`                | `object \| false`              | 全部                   | 代理配置                                           |
| `cancelToken`          | `object`                       | 全部                   | axios 旧版取消方式；新代码更推荐 `signal`          |
| `decompress`           | `boolean`                      | 全部                   | 是否自动解压响应                                   |
| `transitional`         | `object`                       | 全部                   | axios 兼容行为相关配置                             |
| `signal`               | `AbortSignal`                  | 全部                   | 通过 `AbortController` 取消请求                    |
| `insecureHTTPParser`   | `boolean`                      | 全部                   | 是否启用宽松 HTTP 解析                             |
| `env`                  | `object`                       | 全部                   | axios 运行环境相关配置                             |
| `formSerializer`       | `object`                       | 全部                   | `FormData` 序列化配置                              |
| `family`               | `number`                       | 全部                   | DNS 地址族设置                                     |
| `lookup`               | `function`                     | 全部                   | 自定义 DNS 查询逻辑                                |
| `withXSRFToken`        | `boolean \| function`          | 全部                   | 是否附带 XSRF Token                                |
| `parseReviver`         | `function`                     | 全部                   | JSON 解析 reviver                                  |
| `fetchOptions`         | `object`                       | 全部                   | fetch adapter 附加配置                             |
| `httpVersion`          | `1 \| 2`                       | 全部                   | 指定 HTTP 版本                                     |
| `http2Options`         | `object`                       | 全部                   | HTTP/2 相关配置                                    |
| `formDataHeaderPolicy` | `'legacy' \| 'content-only'`   | 全部                   | `FormData` 头部策略                                |
| `redact`               | `string[]`                     | 全部                   | 日志脱敏字段列表                                   |
| `returnRawResponse`    | `boolean`                      | 全部                   | 是否返回完整响应体；`true` 时返回 `ApiResponse<T>` |
| `retry`                | `number`                       | 全部                   | 失败后的最大重试次数                               |
| `retryDelay`           | `number`                       | 全部                   | 每次重试的基础延迟，单位毫秒                       |
| `progress`             | `RequestProgressConfig`        | 全部                   | 统一的上传/下载进度配置                            |

### 14.2 `progress` 子字段

| 字段         | 类型                                    | 说明         |
| ------------ | --------------------------------------- | ------------ |
| `onUpload`   | `(event: RequestProgressEvent) => void` | 上传进度回调 |
| `onDownload` | `(event: RequestProgressEvent) => void` | 下载进度回调 |

### 14.3 `RequestProgressEvent` 字段

| 字段               | 类型                     | 说明                       |
| ------------------ | ------------------------ | -------------------------- |
| `type`             | `"upload" \| "download"` | 当前是上传进度还是下载进度 |
| `loaded`           | `number`                 | 当前已传输字节数           |
| `total`            | `number \| undefined`    | 总字节数，拿不到时为空     |
| `progress`         | `number \| undefined`    | 0 到 1 的进度值            |
| `percent`          | `number \| undefined`    | 0 到 100 的百分比          |
| `bytes`            | `number \| undefined`    | 当前时间片新增传输字节数   |
| `estimated`        | `number \| undefined`    | 预计剩余时间，单位毫秒     |
| `rate`             | `number \| undefined`    | 当前传输速率，单位 bytes/s |
| `lengthComputable` | `boolean`                | 是否可以计算总进度         |
| `originalEvent`    | `AxiosProgressEvent`     | axios 原始进度事件对象     |
