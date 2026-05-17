import React from "react";
import { Outlet } from "@tanstack/react-router";
import classNames from "classnames/bind";
import { Layout } from "antd";
import SideMenuContent from "./SideMenuContent.tsx";
import useAppLayouts from "./hooks/useAppLayouts.ts";
const { Content } = Layout;

import styles from "./app-layout.module.scss";

const cx = classNames.bind(styles);

const AppLayouts: React.FC = () => {
  const { menuItems } = useAppLayouts();
  return (
    <Layout className={cx("app-layout")}>
      <SideMenuContent menuItems={menuItems} />
      <Layout className={cx("app-layout-content")}>
        <Content className={cx("app-layout-content-main")}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayouts;
