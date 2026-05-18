import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { login, register } from "@/services/user";
import { setAccessToken } from "@/utils/auth-token";
import type { IWebLoginDto, IWebRegisterDto } from "@/services/user";

const useLogin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [errorText, setErrorText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const handelActiveTab = (values: string) => {
    setActiveTab(values);
  };

  const handleLogin = async (values: IWebLoginDto) => {
    try {
      setLoading(true);
      const response = await login(values);
      console.log(response, "response");
      setAccessToken(response.accessToken);
      await navigate({ to: "/" });
    } catch (error) {
      console.log(error, "报错了");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: IWebRegisterDto) => {
    if (values.password !== values.confirmPassword) {
      setErrorText("两次输入的密码不一致");
      return;
    }

    try {
      setLoading(true);
      const response = await register(values);
      if (response.userId) {
        setActiveTab("login");
      }
    } catch (error) {
      console.log(error, "报错了");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    activeTab,
    errorText,
    handleLogin,
    handleRegister,
    handelActiveTab,
  };
};

export default useLogin;
