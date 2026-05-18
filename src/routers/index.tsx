import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";

import RootLayout from "@/layouts";
import { getAccessToken } from "@/utils/auth-token";
import Home from "@/pages/Home";
import LoginPage from "@/pages/Login";
import MockPage from "@/pages/MockPage";
import NotFoundPage from "@/pages/NotFoundPage";

import { appMenuLeaves } from "@/routers/menuConfig.tsx";
import React from "react";

const AI_CHAT_PATH = "/ai/chat";

/* eslint-disable react-refresh/only-export-components */
const AiChatPage = (): React.JSX.Element => <MockPage />;

const rootRoute = createRootRoute({
  notFoundComponent: NotFoundPage,
  pendingComponent: (): React.JSX.Element => <div className="flex items-center justify-center h-screen">加载中...</div>,
  errorComponent: NotFoundPage,
});

const authGuard = async ({ location }: { location: { pathname: string } }): Promise<void> => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw redirect({
      search: { redirect: location.pathname },
      to: "/login",
    });
  }
};

const appLayoutRoute = createRoute({
  beforeLoad: authGuard,
  component: RootLayout,
  getParentRoute: (): typeof rootRoute => rootRoute,
  id: "app-layout",
});

const homeRoute = createRoute({
  component: Home,
  getParentRoute: (): typeof appLayoutRoute => appLayoutRoute,
  path: "/",
});

const aiChatRoute = createRoute({
  component: AiChatPage,
  getParentRoute: (): typeof appLayoutRoute => appLayoutRoute,
  path: AI_CHAT_PATH,
});

const mockMenuRoutes = appMenuLeaves
  .filter((item) => item.path && item.path !== "/" && item.path !== AI_CHAT_PATH)
  .map((item) =>
    createRoute({
      component: MockPage,
      getParentRoute: (): typeof appLayoutRoute => appLayoutRoute,
      path: item.path ?? "/",
    }),
  );

const loginRoute = createRoute({
  beforeLoad: async (): Promise<void> => {
    const accessToken = await getAccessToken();

    if (accessToken) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: search.redirect as string | undefined,
  }),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([homeRoute, aiChatRoute, ...mockMenuRoutes]),
]);

export const router = createRouter({
  defaultPreload: "intent",
  defaultPreloadDelay: 200,
  routeTree,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface IRegister {
    router: typeof router;
  }
}
