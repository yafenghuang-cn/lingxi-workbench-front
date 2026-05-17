import type React from "react";
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Dropdown, Layout, Menu } from "antd";
import classNames from "classnames/bind";
import type { MenuProps } from "antd";
import useSideMenuContent from "./hooks/useSideMenuContent.ts";
import styles from "./styles/SideMenuContent.module.scss";
const cx = classNames.bind(styles);

const SideMenuContent: React.FC = () => {
  const { collapsed, handleCollapse } = useSideMenuContent();

  const userActionItems: NonNullable<MenuProps["items"]> = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "设置",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出",
    },
  ];

  const handleUserActionClick: NonNullable<MenuProps["onClick"]> = ({ key }) => {
    if (key === "logout") {
      return;
    }

    if (key === "settings") {
    }
  };

  const userInfo = { name: "admin", role: "超级管理员" };
  return (
    <Layout.Sider
      collapsible
      breakpoint="md"
      className={cx("side-menu-content")}
      collapsed={collapsed}
      collapsedWidth={72}
      trigger={null}
      width={248}
      onBreakpoint={handleCollapse}
    >
      <div className={cx("appLayoutSideMenu")}>
        <div className={cx("sideMenuContent")}>
          <Menu />
        </div>
        <div className={cx("sideMenuFooter", { sideMenuFooterCollapsed: collapsed })}>
          <div className={cx("userCard", { userCardCollapsed: collapsed })} role="button" tabIndex={0}>
            <div aria-hidden className={cx("userAvatar")}>
              <UserOutlined />
            </div>
            {!collapsed && (
              <>
                <div className={cx("userMeta")}>
                  <div className={cx("userName")}>{userInfo.name}</div>
                  <div className={cx("userRole")}>{userInfo.role ?? ""}</div>
                </div>
                <div className={cx("userActions")}>
                  <Dropdown
                    menu={{
                      items: userActionItems,
                      onClick: handleUserActionClick,
                    }}
                    placement="topRight"
                    trigger={["click"]}
                  >
                    <button aria-label="用户操作" className={cx("userActionTrigger")} type="button">
                      <SettingOutlined />
                    </button>
                  </Dropdown>
                </div>
              </>
            )}
          </div>

          <button
            aria-label={collapsed ? "展开" : "收起"}
            className={cx("collapseBtn", { collapseBtnCollapsed: collapsed })}
            type="button"
            onClick={handleCollapse}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            {!collapsed && <span className={cx("collapseBtnText")}>收起</span>}
          </button>
        </div>
      </div>
    </Layout.Sider>
  );
};

export default SideMenuContent;
