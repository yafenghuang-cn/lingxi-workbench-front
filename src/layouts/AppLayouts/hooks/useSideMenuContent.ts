import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { MenuProps } from "antd";
import { findMenuItemByKey, getOpenMenuKeys, getSelectedMenuKey } from "@/routers/menuConfig";

interface ISideMenuContentHookResult {
  collapsed: boolean;
  handleCollapse: () => void;
  selectedKeys: string[];
  openKeys: string[];
  handleMenuClick: MenuProps["onClick"];
  handleOpenChange: MenuProps["onOpenChange"];
}

// interface ISideMenuContentHookResult {
//   menuItems: NonNullable<MenuProps["items"]>;
// }

const useSideMenuContent = (): ISideMenuContentHookResult => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const selectedKeys = useMemo(() => [getSelectedMenuKey(pathname)], [pathname]);
  const defaultOpenKeys = useMemo(() => getOpenMenuKeys(pathname), [pathname]);

  useEffect(() => {
    if (!collapsed) {
      setOpenKeys((prev) => Array.from(new Set([...prev, ...defaultOpenKeys])));
    }
  }, [collapsed, defaultOpenKeys]);

  const handleCollapse = (): void => {
    setCollapsed((v) => !v);
  };

  const handleMenuClick = useCallback<NonNullable<MenuProps["onClick"]>>(
    async ({ key }) => {
      const item = findMenuItemByKey(key);
      if (item?.path) {
        await navigate({ to: item.path });
      }
    },
    [navigate],
  );

  const handleOpenChange = useCallback<NonNullable<MenuProps["onOpenChange"]>>((keys) => {
    setOpenKeys(keys);
  }, []);

  return {
    collapsed,
    handleCollapse,
    selectedKeys,
    openKeys,
    handleMenuClick,
    handleOpenChange,
  };
};

export default useSideMenuContent;
