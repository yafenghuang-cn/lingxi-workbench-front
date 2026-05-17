import type React from "react";
import { useRouterState } from "@tanstack/react-router";
import { findMenuItemByPath } from "@/routers/menuConfig.tsx";

const MockPage: React.FC = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const menuItem = findMenuItemByPath(pathname);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{menuItem?.label ?? "页面"}</h2>
      <p style={{ marginTop: 12, color: "rgb(0 0 0 / 0.45)" }}>当前路径：{pathname}</p>
      <p style={{ color: "rgb(0 0 0 / 0.45)" }}>此为 Mock 占位页，后续可替换为真实业务页面。</p>
    </div>
  );
};

export default MockPage;
