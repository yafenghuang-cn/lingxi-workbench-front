import type React from "react";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CloudOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HomeOutlined,
  InboxOutlined,
  LineChartOutlined,
  ProfileOutlined,
  RobotOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
  TruckOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

export interface IAppMenuItem {
  /** 菜单唯一标识，叶子节点建议与 path 一致 */
  key: string;
  label: string;
  icon?: React.ReactNode;
  /** 可访问路径，仅叶子节点配置 */
  path?: string;
  children?: IAppMenuItem[];
}

type AntdMenuItem = NonNullable<MenuProps["items"]>[number];

export const APP_ROUTE_PATHS = {
  HOME: "/",
  LOGIN: "/login",
  AI_CHAT: "/ai-chat",
  THREE_D_MAP: "/threeDMap",
} as const;

/** 侧边栏树形菜单 Mock 数据 */
export const appMenuTree: IAppMenuItem[] = [
  {
    key: APP_ROUTE_PATHS.HOME,
    label: "工作台",
    icon: <HomeOutlined />,
    path: APP_ROUTE_PATHS.HOME,
  },
  {
    key: APP_ROUTE_PATHS.AI_CHAT,
    label: "AI 对话",
    icon: <RobotOutlined />,
    path: APP_ROUTE_PATHS.AI_CHAT,
  },
  /**
   * 3d地图显示
   */
  {
    key: APP_ROUTE_PATHS.THREE_D_MAP,
    label: "3D地图",
    path: APP_ROUTE_PATHS.THREE_D_MAP,
  },
  {
    key: "order-center",
    label: "订单中心",
    icon: <ShoppingOutlined />,
    children: [
      {
        key: "/orders/list",
        label: "订单列表",
        icon: <ProfileOutlined />,
        path: "/orders/list",
      },
      {
        key: "/orders/pending",
        label: "待处理订单",
        icon: <FileTextOutlined />,
        path: "/orders/pending",
      },
      {
        key: "after-sale",
        label: "售后管理",
        icon: <ToolOutlined />,
        children: [
          {
            key: "/orders/refund",
            label: "退款单",
            path: "/orders/refund",
          },
          {
            key: "/orders/exchange",
            label: "换货单",
            path: "/orders/exchange",
          },
          {
            key: "/orders/complaint",
            label: "客诉工单",
            path: "/orders/complaint",
          },
        ],
      },
    ],
  },
  {
    key: "product-center",
    label: "商品管理",
    icon: <ShopOutlined />,
    children: [
      {
        key: "/products/list",
        label: "商品列表",
        icon: <AppstoreOutlined />,
        path: "/products/list",
      },
      {
        key: "/products/category",
        label: "分类管理",
        path: "/products/category",
      },
      {
        key: "/products/brand",
        label: "品牌管理",
        path: "/products/brand",
      },
      {
        key: "product-tools",
        label: "运营工具",
        children: [
          {
            key: "/products/import",
            label: "批量导入",
            path: "/products/import",
          },
          {
            key: "/products/price",
            label: "调价记录",
            path: "/products/price",
          },
        ],
      },
    ],
  },
  {
    key: "warehouse",
    label: "仓储物流",
    icon: <InboxOutlined />,
    children: [
      {
        key: "/warehouse/stock",
        label: "库存查询",
        icon: <DatabaseOutlined />,
        path: "/warehouse/stock",
      },
      {
        key: "/warehouse/inbound",
        label: "入库管理",
        path: "/warehouse/inbound",
      },
      {
        key: "/warehouse/outbound",
        label: "出库管理",
        path: "/warehouse/outbound",
      },
      {
        key: "logistics",
        label: "物流配送",
        icon: <TruckOutlined />,
        children: [
          {
            key: "/warehouse/shipment",
            label: "发货单",
            path: "/warehouse/shipment",
          },
          {
            key: "/warehouse/tracking",
            label: "物流跟踪",
            path: "/warehouse/tracking",
          },
        ],
      },
    ],
  },
  {
    key: "data-center",
    label: "数据中心",
    icon: <BarChartOutlined />,
    children: [
      {
        key: "/data/sales",
        label: "销售报表",
        icon: <LineChartOutlined />,
        path: "/data/sales",
      },
      {
        key: "/data/operation",
        label: "运营看板",
        path: "/data/operation",
      },
      {
        key: "/data/inventory",
        label: "库存分析",
        path: "/data/inventory",
      },
    ],
  },
  {
    key: "integration",
    label: "开放平台",
    icon: <CloudOutlined />,
    children: [
      {
        key: "/integration/api",
        label: "API 管理",
        path: "/integration/api",
      },
      {
        key: "/integration/webhook",
        label: "Webhook",
        path: "/integration/webhook",
      },
    ],
  },
  {
    key: "system",
    label: "系统设置",
    icon: <SettingOutlined />,
    children: [
      {
        key: "/system/users",
        label: "用户管理",
        icon: <UserOutlined />,
        path: "/system/users",
      },
      {
        key: "/system/roles",
        label: "角色权限",
        icon: <TeamOutlined />,
        path: "/system/roles",
      },
      {
        key: "/system/logs",
        label: "操作日志",
        path: "/system/logs",
      },
      {
        key: "/system/config",
        label: "系统配置",
        path: "/system/config",
      },
    ],
  },
];

const toAntdMenuItem = (item: IAppMenuItem): AntdMenuItem => {
  const { key, label, icon, children } = item;

  if (children?.length) {
    return {
      key,
      label,
      icon,
      children: children.map(toAntdMenuItem),
    };
  }

  return {
    key,
    label,
    icon,
  };
};

interface IMenuTreeMeta {
  ancestorKeysByKey: Map<string, string[]>;
  itemByKey: Map<string, IAppMenuItem>;
  leaves: IAppMenuItem[];
}

const buildMenuTreeMeta = (items: IAppMenuItem[]): IMenuTreeMeta => {
  const ancestorKeysByKey = new Map<string, string[]>();
  const itemByKey = new Map<string, IAppMenuItem>();
  const leaves: IAppMenuItem[] = [];

  const visit = (nodes: IAppMenuItem[], ancestors: string[] = []): void => {
    for (const item of nodes) {
      itemByKey.set(item.key, item);
      ancestorKeysByKey.set(item.key, ancestors);

      if (item.path) {
        leaves.push(item);
      }

      if (item.children?.length) {
        visit(item.children, [...ancestors, item.key]);
      }
    }
  };

  visit(items);

  return {
    ancestorKeysByKey,
    itemByKey,
    leaves,
  };
};

const appMenuAntdItems = appMenuTree.map(toAntdMenuItem);
const { ancestorKeysByKey, itemByKey, leaves: appMenuLeaves } = buildMenuTreeMeta(appMenuTree);

export const getAppMenuAntdItems = (): NonNullable<MenuProps["items"]> => appMenuAntdItems;

/** 所有可导航的叶子菜单 */
export { appMenuLeaves };

const matchPath = (pathname: string, path: string): boolean =>
  pathname === path || (path !== APP_ROUTE_PATHS.HOME && pathname.startsWith(`${path}/`));

export const findMenuItemByPath = (pathname: string): IAppMenuItem | undefined => {
  let matchedItem: IAppMenuItem | undefined;

  for (const item of appMenuLeaves) {
    if (!item.path || !matchPath(pathname, item.path)) {
      continue;
    }

    if (!matchedItem || item.path.length > (matchedItem.path?.length ?? 0)) {
      matchedItem = item;
    }
  }

  return matchedItem;
};

export const findMenuItemByKey = (key: string): IAppMenuItem | undefined => itemByKey.get(key);

export const getSelectedMenuKey = (pathname: string): string =>
  findMenuItemByPath(pathname)?.key ?? APP_ROUTE_PATHS.HOME;

export const getOpenMenuKeys = (pathname: string): string[] => {
  const selectedKey = getSelectedMenuKey(pathname);
  return ancestorKeysByKey.get(selectedKey) ?? [];
};
