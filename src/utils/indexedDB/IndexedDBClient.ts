import Dexie from "dexie";
import IndexedDBStore from "./IndexedDBStore";
import type { IIndexedDBClientOptions, IIndexedDBStoreDefinition } from "./types";

const assertIndexedDBAvailable = (): void => {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in the current environment.");
  }
};

const toStoreRecord = (stores: IIndexedDBStoreDefinition[]): Record<string, string> => {
  return Object.fromEntries(stores.map((store) => [store.name, store.schema]));
};

/**
 * IndexedDB 客户端：管理数据库连接与多表访问
 */
class IndexedDBClient {
  private readonly dexie: Dexie;
  private readonly storeNames: Set<string>;
  private openPromise: Promise<Dexie> | null = null;

  constructor(private readonly options: IIndexedDBClientOptions) {
    assertIndexedDBAvailable();

    const sortedVersions = [...options.versions].sort((a, b) => a.version - b.version);
    if (sortedVersions.length === 0) {
      throw new Error("IndexedDBClient requires at least one version definition.");
    }

    this.dexie = new Dexie(options.name);
    this.storeNames = new Set<string>();

    for (const versionConfig of sortedVersions) {
      const storeRecord = toStoreRecord(versionConfig.stores);
      this.dexie.version(versionConfig.version).stores(storeRecord);
      versionConfig.stores.forEach((store) => this.storeNames.add(store.name));
    }
  }

  get databaseName(): string {
    return this.options.name;
  }

  /** 打开数据库（幂等） */
  async open(): Promise<void> {
    if (!this.openPromise) {
      this.openPromise = this.dexie.open();
    }

    await this.openPromise;
  }

  /** 关闭数据库连接 */
  close(): void {
    this.dexie.close();
    this.openPromise = null;
  }

  /** 获取单表 CRUD 实例 */
  getStore<T extends object>(storeName: string): IndexedDBStore<T> {
    if (!this.storeNames.has(storeName)) {
      throw new Error(`Store "${storeName}" is not registered in database "${this.options.name}".`);
    }

    return new IndexedDBStore<T>(this.dexie.table(storeName), () => this.open());
  }

  /** 删除整个数据库 */
  static async deleteDatabase(name: string): Promise<void> {
    assertIndexedDBAvailable();
    await Dexie.delete(name);
  }
}

export default IndexedDBClient;
