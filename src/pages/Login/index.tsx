import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input, Tabs, Typography } from "antd";
import classNames from "classnames/bind";
import { useState } from "react";

import type { IWebLoginPayload, IWebRegisterPayload } from "./types";

import styles from "./Login.module.scss";

const cx = classNames.bind(styles);

const LoginPage = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [error, setError] = useState<string>("");

  const handleLogin = async (values: IWebLoginPayload): Promise<void> => {
    console.log(values, "handleLogin");
  };

  const handleRegister = async (values: IWebRegisterPayload): Promise<void> => {
    console.log(values, "handleRegister");
    if (values.password !== values.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
  };

  return (
    <main className={cx("page")}>
      <div className={cx("card")}>
        <div className={cx("header")}>
          <span className={cx("logo")}>LX</span>
          <h1 className={cx("title")}>灵犀工作台</h1>
          <p className={cx("subtitle")}>登录或注册以继续使用</p>
        </div>

        <Tabs
          activeKey={activeTab}
          centered
          items={[
            {
              key: "login",
              label: "登录",
              children: (
                <Form layout="vertical" requiredMark={false} onFinish={handleLogin}>
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: "请输入用户名" },
                      { min: 3, message: "用户名至少 3 个字符" },
                      { max: 20, message: "用户名不能超过 20 个字符" },
                    ]}
                  >
                    <Input autoComplete="username" placeholder="用户名" prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "请输入密码" },
                      { min: 6, message: "密码至少 6 个字符" },
                    ]}
                  >
                    <Input.Password autoComplete="current-password" placeholder="密码" prefix={<LockOutlined />} />
                  </Form.Item>
                  <Button block htmlType="submit" type="primary">
                    登录
                  </Button>
                </Form>
              ),
            },
            {
              key: "register",
              label: "注册",
              children: (
                <Form layout="vertical" requiredMark={false} onFinish={handleRegister}>
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: "请输入用户名" },
                      { min: 3, message: "用户名至少 3 个字符" },
                      { max: 20, message: "用户名不能超过 20 个字符" },
                    ]}
                  >
                    <Input autoComplete="username" placeholder="用户名" prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "请输入邮箱" },
                      { type: "email", message: "邮箱格式不正确" },
                    ]}
                  >
                    <Input autoComplete="email" placeholder="邮箱" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "请输入密码" },
                      { min: 6, message: "密码至少 6 个字符" },
                    ]}
                  >
                    <Input.Password autoComplete="new-password" placeholder="密码" prefix={<LockOutlined />} />
                  </Form.Item>
                  <Form.Item name="confirmPassword" rules={[{ required: true, message: "请确认密码" }]}>
                    <Input.Password autoComplete="new-password" placeholder="确认密码" prefix={<LockOutlined />} />
                  </Form.Item>
                  <Button block htmlType="submit" type="primary">
                    注册
                  </Button>
                </Form>
              ),
            },
          ]}
          onChange={setActiveTab}
        />

        {error && (
          <Typography.Text className={cx("error")} type="danger">
            {error}
          </Typography.Text>
        )}
      </div>
    </main>
  );
};

export default LoginPage;
