import { defineConfig } from "@rsbuild/core";
import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { tanstackRouter } from "@tanstack/router-plugin/rspack"; // 引入插件

// Docs: https://rsbuild.rs/config/
export default defineConfig({
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
