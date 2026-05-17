import { useState, useEffect, useRef, useCallback } from "react";
import type { IUseWindowSizeOptions, IWindowSize } from "./types";

/**
 * 高性能获取并监听浏览器窗口尺寸的 Hook
 * 基于 ResizeObserver 实现
 */
const useWindowSize = (options: IUseWindowSizeOptions = {}): IWindowSize => {
  const { debounceMs = 0, initialWidth = 0, initialHeight = 0, pauseWhenHidden = true } = options;

  // 防抖定时器引用
  const debounceTimerRef = useRef<number | null>(null);
  // ResizeObserver 实例引用
  const observerRef = useRef<ResizeObserver | null>(null);

  // 惰性初始化，只在客户端执行一次
  const [windowSize, setWindowSize] = useState<IWindowSize>(() => {
    if (typeof window === "undefined") {
      return { width: initialWidth, height: initialHeight };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  // 带防抖的更新函数
  const updateSize = useCallback(
    (width: number, height: number) => {
      if (debounceMs <= 0) {
        setWindowSize({ width, height });
        return;
      }

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        setWindowSize({ width, height });
      }, debounceMs);
    },
    [debounceMs],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const target = document.documentElement;
    const handleResize = (entries: ResizeObserverEntry[]): void => {
      // 页面隐藏时跳过更新
      if (pauseWhenHidden && document.hidden) {
        return;
      }

      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      updateSize(Math.round(width), Math.round(height));
    };

    // 创建 ResizeObserver 实例
    observerRef.current = new ResizeObserver(handleResize);
    observerRef.current.observe(target);

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [updateSize, pauseWhenHidden]);

  return windowSize;
};

export default useWindowSize;
