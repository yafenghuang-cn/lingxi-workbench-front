import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import Home from "@/pages/Home";
import RootLayout from "@/layouts";
import LoginPage from "@/pages/Login";
import NotFoundPage from "@/pages/NotFoundPage";

const rootRoute = createRootRoute({
  notFoundComponent: NotFoundPage,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app-layout",
  component: RootLayout,
  beforeLoad: async ({ location }) => {
    console.log(location, "/");
  },
});

const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  component: Home,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const routeTree = rootRoute.addChildren([loginRoute, appLayoutRoute.addChildren([homeRoute])]);

export const routers = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof routers;
  }
}
