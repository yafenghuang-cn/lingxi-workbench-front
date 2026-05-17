import { useState } from "react";

export interface ISideMenuContentHookResult {
  collapsed: boolean;
  handleCollapse: () => void;
}

const useSideMenuContent = (): ISideMenuContentHookResult => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = (): void => {
    setCollapsed((v) => !v);
  };

  return { collapsed, handleCollapse };
};

export default useSideMenuContent;
