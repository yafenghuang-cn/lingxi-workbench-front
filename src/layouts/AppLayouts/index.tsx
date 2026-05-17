import React from "react";
import classNames from "classnames/bind";
import { Layout, Spin } from "antd";
import SideMenuContent from "./SideMenuContent.tsx";
const { Content } = Layout;

import styles from "./app-layout.module.scss";

const cx = classNames.bind(styles);

const AppLayouts: React.FC = () => {
  return (
    <Layout className={cx("app-layout")}>
      <div className={cx("app-layout-side-menu")}>
        <SideMenuContent />
      </div>
      <Layout className={cx("app-layout-content")}>
        <Content className={cx("app-layout-content-main")}>
          <Spin className={cx("contentSpin")} description="加载中..." spinning={true}></Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayouts;
