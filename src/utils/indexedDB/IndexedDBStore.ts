import type { Table } from "dexie";
import type {
  IIndexedDBPageOptions,
  IIndexedDBPageResult,
  TIndexedDBPrimaryKey,
  UpdateSpec,
} from "./types";

type TEnsureOpen = () => Promise<void>;

/**
 * 单表 IndexedDB CRUD 封装
 */
class IndexedDBStore<T extends object> {
  constructor(
    private readonly table: Table<T>,
    private readonly ensureOpen: TEnsureOpen,
  ) {}

  private async withTable<R>(operation: (table: Table<T>) => Promise<R>): Promise<R> {
    await this.ensureOpen();
    return operation(this.table);
  }

  /** 新增（主键冲突时抛错） */
  async add(item: T): Promise<TIndexedDBPrimaryKey> {
    return this.withTable((table) => table.add(item));
  }

  /** 批量新增 */
  async addMany(items: T[]): Promise<TIndexedDBPrimaryKey> {
    return this.withTable((table) => table.bulkAdd(items));
  }

  /** 写入或覆盖（upsert） */
  async put(item: T): Promise<TIndexedDBPrimaryKey> {
    return this.withTable((table) => table.put(item));
  }

  /** 批量写入或覆盖 */
  async putMany(items: T[]): Promise<void> {
    return this.withTable((table) => table.bulkPut(items));
  }

  /** 按主键查询 */
  async get(key: TIndexedDBPrimaryKey): Promise<T | undefined> {
    return this.withTable((table) => table.get(key));
  }

  /** 按主键批量查询 */
  async getMany(keys: TIndexedDBPrimaryKey[]): Promise<(T | undefined)[]> {
    return this.withTable((table) => table.bulkGet(keys));
  }

  /** 查询全部 */
  async getAll(): Promise<T[]> {
    return this.withTable((table) => table.toArray());
  }

  /** 按索引字段等值查询 */
  async findByIndex(index: string, value: TIndexedDBPrimaryKey): Promise<T[]> {
    return this.withTable((table) => table.where(index).equals(value).toArray());
  }

  /** 部分更新 */
  async update(key: TIndexedDBPrimaryKey, changes: UpdateSpec<T>): Promise<number> {
    return this.withTable((table) => table.update(key, changes));
  }

  /** 按主键删除 */
  async remove(key: TIndexedDBPrimaryKey): Promise<void> {
    return this.withTable((table) => table.delete(key));
  }

  /** 按主键批量删除 */
  async removeMany(keys: TIndexedDBPrimaryKey[]): Promise<void> {
    return this.withTable((table) => table.bulkDelete(keys));
  }

  /** 清空表 */
  async clear(): Promise<void> {
    return this.withTable((table) => table.clear());
  }

  /** 统计条数 */
  async count(): Promise<number> {
    return this.withTable((table) => table.count());
  }

  /** 分页查询 */
  async page(options: IIndexedDBPageOptions): Promise<IIndexedDBPageResult<T>> {
    const { page, pageSize, orderBy, reverse = false } = options;
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const offset = (safePage - 1) * safePageSize;

    return this.withTable(async (table) => {
      const total = await table.count();
      const collection = orderBy ? table.orderBy(orderBy) : table.toCollection();
      const items = await (reverse ? collection.reverse() : collection).offset(offset).limit(safePageSize).toArray();

      return {
        items,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      };
    });
  }

  /** 暴露底层 Table，便于复杂查询 */
  async useTable<R>(operation: (table: Table<T>) => Promise<R>): Promise<R> {
    return this.withTable(operation);
  }
}

export default IndexedDBStore;
