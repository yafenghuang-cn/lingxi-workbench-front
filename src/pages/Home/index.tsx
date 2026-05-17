import React from "react";
import useWindowSize from "@/hooks/useWindowSize";
const HomePage: React.FC = () => {
  const { width, height } = useWindowSize({debounceMs:0});
  return (
    <div>
      首页
      <p>宽度：{width}</p>
      <p>高度：{height}</p>
    </div>
  );
};

export default HomePage;
