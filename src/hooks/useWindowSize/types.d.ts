export interface IWindowSize {
  width: number;
  height: number;
}

export interface IUseWindowSizeOptions {
  /**
   * 防抖延迟时间（毫秒）
   * ResizeObserver 本身已经很高效，建议设置 50-100ms 即可
   * 设置为 0 则不使用防抖
   * @default 50
   */
  debounceMs?: number;
  /**
   * 初始宽度，用于 SSR 环境
   * @default 0
   */
  initialWidth?: number;
  /**
   * 初始高度，用于 SSR 环境
   * @default 0
   */
  initialHeight?: number;
  /**
   * 是否在窗口隐藏时暂停更新
   * 可以进一步节省性能
   * @default true
   */
  pauseWhenHidden?: boolean;
}
