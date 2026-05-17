import type { IndexableType, UpdateSpec } from "dexie";

export type { IndexableType, UpdateSpec };

/** IndexedDB 主键类型 */
export type TIndexedDBPrimaryKey = IndexableType;

export interface IIndexedDBStoreDefinition {
  /** 表（Object Store）名称 */
  name: string;
  /**
   * Dexie 表结构定义
   * @example `++id, name, updatedAt` — 自增主键
   * @example `key, value, updatedAt` — 指定 key 为主键
   */
  schema: string;
}

export interface IIndexedDBVersionDefinition {
  version: number;
  stores: IIndexedDBStoreDefinition[];
}

export interface IIndexedDBClientOptions {
  /** 数据库名称 */
  name: string;
  /**
   * 版本配置（支持多版本迁移，按 version 升序声明）
   * 仅传最后一版时等价于单版本初始化
   */
  versions: IIndexedDBVersionDefinition[];
}

export interface IIndexedDBPageOptions {
  /** 页码，从 1 开始 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序字段（需在 schema 中声明索引） */
  orderBy?: string;
  /** 是否倒序 */
  reverse?: boolean;
}

export interface IIndexedDBPageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
