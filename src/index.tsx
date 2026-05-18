import React from "react";
import { RouterProvider } from "@tanstack/react-router";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createRoot } from "react-dom/client";

// import { clearAccessToken } from "@/utils/auth-token";
// import { REQUEST_EVENT_KEYS, subscribeNavigation } from "@/utils/request";
import { router } from "@/routers";

import "@/styles/global.scss";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error('Root element "#root" not found');
}

// subscribeNavigation(REQUEST_EVENT_KEYS.LOGIN, (payload) => {
//   void clearAccessToken();
//   void router.navigate({
//     to: "/login",
//     replace: payload?.replace === true,
//     search: {
//       redirect: typeof payload?.redirect === "string" ? payload.redirect : router.state.location.pathname,
//     },
//   });
// });

// subscribeNavigation(REQUEST_EVENT_KEYS.FORBIDDEN, () => {
//   void router.navigate({ to: "/" });
// });

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
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
);
