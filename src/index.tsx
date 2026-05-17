import React from "react";
import { RouterProvider } from "@tanstack/react-router";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createRoot } from "react-dom/client";

import { router } from "@/routers";

import "@/styles/global.scss";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error('Root element "#root" not found');
}

createRoot(rootEl).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
);
