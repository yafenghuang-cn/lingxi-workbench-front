import React, { lazy, Suspense } from "react";
import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import type { RouteComponent } from "@tanstack/react-router";
import { getAccessToken } from "@/utils/auth-token";

const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const RootLayout = lazy(() => import("@/layouts"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const ThreeDMap = lazy(() => import("@/pages/ThreeDMapPage"));
const AiChatPage = lazy(() => import("@/pages/Aichat"));

const RoutePendingPage = (): React.JSX.Element => (
  <div className="flex items-center justify-center h-screen">加载中...</div>
);

interface createAppRouteProps {
  path: string;
  component: RouteComponent;
  beforeLoad?: any;
  validateSearch?: any;
}

const createAppRoute = (payload: createAppRouteProps) =>
  createRoute({
    path: payload.path,
    component: () => (
      <Suspense fallback={<RoutePendingPage />}>
        <payload.component />
      </Suspense>
    ),
    beforeLoad: payload.beforeLoad,
    validateSearch: payload.validateSearch,
    getParentRoute: () => appLayoutRoute,
    preload: true,
    caseSensitive: true,
  });

const rootRoute = createRootRoute({
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  pendingComponent: RoutePendingPage,
});

const appLayoutRoute = createRoute({
  beforeLoad(ctx) {
    console.log(ctx, "ctx");
    const token = getAccessToken();
    // 无token → 重定向到登录页
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: RootLayout,
  getParentRoute: () => rootRoute,
  id: "lingxi-workbench-front",
  preload: true,
});

const loginRoute = createAppRoute({
  path: "/login",
  component: Login,
});

const homeRoute = createAppRoute({
  path: "/",
  component: Home,
});

const aiChatRoute = createAppRoute({
  path: "/ai-chat",
  component: AiChatPage,
});

const threeDMapRoute = createAppRoute({
  path: "/threeDMap",
  component: ThreeDMap,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([homeRoute, aiChatRoute, threeDMapRoute]),
]);

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreloadDelay: 200,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface IRegister {
    router: typeof router;
  }
}
