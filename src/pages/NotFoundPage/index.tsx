import { Button, Result, Space } from "antd";
import { useNavigate } from "@tanstack/react-router";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col items-center justify-center px-4 py-10">
      <Result
        extra={
          <Space wrap className="justify-center" size="middle">
            <Button size="large" type="primary" onClick={() => navigate({ to: "/" })}>
              返回首页
            </Button>
            <Button size="large" onClick={() => navigate({ to: "/login" })}>
              返回上一页
            </Button>
            {/* <Button size="large" onClick={() => window.location.reload()}>
              重新加载
            </Button> */}
          </Space>
        }
        status="404"
        subTitle="抱歉，您访问的页面不存在或已被移动。"
        title="页面未找到"
      />
    </div>
  );
};

export default NotFoundPage;
