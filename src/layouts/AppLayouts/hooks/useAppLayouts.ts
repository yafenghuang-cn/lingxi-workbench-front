import { useMemo } from "react";
import { getAppMenuAntdItems } from "@/routers/menuConfig";
import type { MenuProps } from "antd";

interface IAppLayoutProps {
  menuItems: NonNullable<MenuProps["items"]>;
}

const useAppLayouts = (): IAppLayoutProps => {
  const menuItems = useMemo(() => getAppMenuAntdItems(), []);

  return { menuItems };
};

export default useAppLayouts;
