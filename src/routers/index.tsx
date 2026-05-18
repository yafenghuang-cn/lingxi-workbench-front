import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import RootLayout from "@/layouts";
import { getAccessToken } from "@/utils/auth-token";
import AiChatPage from "@/pages/AiChat";
import Home from "@/pages/Home";
import LoginPage from "@/pages/Login";
import MockPage from "@/pages/MockPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { appMenuLeaves } from "@/routers/menuConfig.tsx";

const AI_CHAT_PATH = "/ai/chat";

const rootRoute = createRootRoute({
  notFoundComponent: NotFoundPage,
  pendingComponent: () => <div className="flex items-center justify-center h-screen">加载中...</div>,
  errorComponent: NotFoundPage,
});

/**
 * 认证路由守卫
 * 检查用户是否已登录，未登录则重定向到登录页
 */
const authGuard = async ({ location }: { location: { pathname: string } }) => {
  if (!getAccessToken()) {
    throw redirect({
      to: "/login",
      search: { redirect: location.pathname },
    });
  }
};

/**
 * 应用布局路由
 * 包含侧边栏、导航栏等公共布局
 */
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app-layout",
  component: RootLayout,
  beforeLoad: authGuard, // 应用认证守卫
});

/**
 * 首页路由
 */
const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  component: Home,
});

const aiChatRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: AI_CHAT_PATH,
  component: AiChatPage,
});

/** 根据菜单叶子节点自动生成 Mock 路由 */
const mockMenuRoutes = appMenuLeaves
  .filter((item) => item.path && item.path !== "/" && item.path !== AI_CHAT_PATH)
  .map((item) =>
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: item.path!,
      component: MockPage,
    }),
  );

/**
 * 登录页路由
 */
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: search.redirect as string | undefined,
    };
  },
  beforeLoad: () => {
    if (getAccessToken()) {
      throw redirect({ to: "/" });
    }
  },
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([homeRoute, aiChatRoute, ...mockMenuRoutes]),
]);

/**
 * 创建路由器实例
 */
export const router = createRouter({
  routeTree,
  defaultPreload: "intent", // 预加载策略：鼠标悬停时预加载
  defaultPreloadDelay: 200, // 预加载延迟
  scrollRestoration: true, // 启用滚动恢复
});

/**
 * 类型注册
 * 确保整个应用获得完整的类型安全
 */
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
