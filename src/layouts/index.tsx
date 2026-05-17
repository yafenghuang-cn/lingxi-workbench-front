import React from "react";
import { Outlet } from "@tanstack/react-router";

const Layouts: React.FC = () => {
  return (
    <div>
      布局组件部分
      <Outlet />
    </div>
  );
};

export default Layouts;
