import type React from "react";
import { memo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, Layout, Menu, Typography } from "antd";
import classNames from "classnames/bind";
import type { MenuProps } from "antd";
import { clearAccessToken } from "@/lib/auth-token";
import useSideMenuContent from "./hooks/useSideMenuContent.ts";
import styles from "./styles/SideMenuContent.module.scss";

const cx = classNames.bind(styles);
const { Sider } = Layout;
const { Text } = Typography;

interface IMenuProps {
  menuItems: NonNullable<MenuProps["items"]>;
}

const userActionItems: NonNullable<MenuProps["items"]> = [
  {
    key: "settings",
    icon: <SettingOutlined />,
    label: "设置",
  },
  {
    type: "divider",
  },
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "退出登录",
    danger: true,
  },
];

const SideMenuContent: React.FC<IMenuProps> = (props) => {
  const { menuItems } = props;
  const navigate = useNavigate();
  const { collapsed, handleCollapse, selectedKeys, openKeys, handleMenuClick, handleOpenChange } = useSideMenuContent();

  const handleUserActionClick: NonNullable<MenuProps["onClick"]> = ({ key }) => {
    if (key === "logout") {
      clearAccessToken();
      void navigate({ to: "/login" });
      return;
    }

    if (key === "settings") {
    }
  };

  const userInfo = { name: "admin", role: "超级管理员" };

  return (
    <Sider
      className={cx("sider")}
      collapsed={collapsed}
      collapsedWidth={80}
      collapsible
      theme="dark"
      trigger={null}
      width={256}
    >
      <div className={cx("siderInner")}>
        <div className={cx("siderLogo", { siderLogoCollapsed: collapsed })}>
          <span className={cx("siderLogoMark")}>LX</span>
          {!collapsed && <span className={cx("siderLogoTitle")}>灵犀工作台</span>}
        </div>

        <div className={cx("siderMenuWrap")}>
          <Menu
            className={cx("siderMenu")}
            inlineCollapsed={collapsed}
            items={menuItems}
            mode="inline"
            openKeys={collapsed ? [] : openKeys}
            selectedKeys={selectedKeys}
            theme="dark"
            onClick={handleMenuClick}
            onOpenChange={handleOpenChange}
          />
        </div>

        <div className={cx("siderFooter", { siderFooterCollapsed: collapsed })}>
          <Dropdown
            menu={{
              items: userActionItems,
              onClick: handleUserActionClick,
            }}
            placement="topRight"
            trigger={["click"]}
          >
            <button aria-label="用户菜单" className={cx("siderUser", { siderUserCollapsed: collapsed })} type="button">
              <Avatar className={cx("siderUserAvatar")} icon={<UserOutlined />} size={collapsed ? 32 : 36} />
              {!collapsed && (
                <div className={cx("siderUserMeta")}>
                  <Text className={cx("siderUserName")} ellipsis>
                    {userInfo.name}
                  </Text>
                  <Text className={cx("siderUserRole")} ellipsis type="secondary">
                    {userInfo.role}
                  </Text>
                </div>
              )}
              {!collapsed && <SettingOutlined className={cx("siderUserSetting")} />}
            </button>
          </Dropdown>

          <Button
            block
            className={cx("siderCollapseBtn")}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            type="text"
            onClick={handleCollapse}
          >
            {!collapsed && "收起菜单"}
          </Button>
        </div>
      </div>
    </Sider>
  );
};

export default memo(SideMenuContent);
