import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { tanstackRouter } from "@tanstack/router-plugin/rspack"; // 引入插件

const { publicVars } = loadEnv({ prefixes: ["PUBLIC_"] });
const proxyTarget = process.env.PROXY_TARGET ?? "http://120.53.227.126:9000";

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  source: {
    define: publicVars,
  },
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginBabel({
      include: /\.[jt]sx?$/,
      exclude: [/[\\/]node_modules[\\/]/],
      babelLoaderOptions(opts) {
        opts.plugins?.unshift("babel-plugin-react-compiler");
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  server: {
    port: 8080,
    open: true,
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        pathRewrite: { "^/api": "" },
      },
    },
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: "react", // 指定目标框架为 React
          autoCodeSplitting: true, // 启用自动代码分割，提升性能
          enableRouteGeneration: false, // 使用手动路由配置（src/routers）
        }),
      ],
    },
  },
});
