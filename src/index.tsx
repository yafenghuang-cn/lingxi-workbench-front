import React from "react";
import { RouterProvider } from "@tanstack/react-router";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createRoot } from "react-dom/client";
import { REQUEST_EVENT_KEYS } from "@/common/request-key";
import { router } from "@/routers";
import { clearAccessToken } from "@/utils/auth-token";
import { subscribeRequestEvent } from "@/utils/request";
import type { RequestEventPayloadMap } from "@/utils/request";

import "@/styles/global.scss";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error('Root element "#root" not found');
}

type RouteNavigationPayload = RequestEventPayloadMap[typeof REQUEST_EVENT_KEYS.ROUTER_PUSH];

/** 统一处理通过 request 事件触发的路由跳转 */
const navigateByEvent = (payload: RouteNavigationPayload, replace = false): void => {
  void router.navigate({
    hash: payload.hash,
    params: payload.params as never,
    replace,
    search: payload.search as never,
    to: payload.to as never,
  });
};

/** 在应用入口集中接管 request 层抛出的导航类事件 */
const RequestEventBridge = (): React.JSX.Element | null => {
  React.useEffect(() => {
    const cleanups = [
      subscribeRequestEvent(REQUEST_EVENT_KEYS.ROUTER_PUSH, (payload) => {
        navigateByEvent(payload);
      }),
      subscribeRequestEvent(REQUEST_EVENT_KEYS.ROUTER_REPLACE, (payload) => {
        navigateByEvent(payload, true);
      }),
      subscribeRequestEvent(REQUEST_EVENT_KEYS.TOKEN_EXPIRED, (payload) => {
        // token 失效后先清本地登录态，再统一跳回登录页
        clearAccessToken();

        // 当前已经在登录页时不再重复跳转
        if (router.state.location.pathname === "/login") {
          return;
        }

        void router.navigate({
          replace: payload.replace ?? true,
          search: {
            redirect: payload.redirect ?? router.state.location.pathname,
          },
          to: "/login",
        });
      }),
    ];

    return () => {
      cleanups.forEach((cleanup) => {
        cleanup();
      });
    };
  }, []);

  return null;
};

createRoot(rootEl).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
        },
        components: {
          Layout: {
            siderBg: "#001529",
            triggerBg: "#002140",
          },
          Menu: {
            darkItemBg: "#001529",
            darkSubMenuItemBg: "#000c17",
            darkItemSelectedBg: "#1677ff",
          },
        },
      }}
    >
      <RequestEventBridge />
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
);
