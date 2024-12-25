import { IIndexedDBService } from './IIndexedDBService';

export class IndexedDBService implements IIndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly version: number;
  private readonly stores: string[];

  constructor(dbName: string, version: number, stores: string[]) {
    this.dbName = dbName;
    this.version = version;
    this.stores = stores;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        this.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'acronym' });
          }
        });
      };
    });
  }

  async add(storeName: string, data: any): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      store.put(data);
    });
  }

  async get(storeName: string, key: string): Promise<any> {
    return this.executeTransaction(storeName, 'readonly', (store) => {
      return store.get(key);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    return this.executeTransaction(storeName, 'readonly', (store) => {
      return store.getAll();
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      store.delete(key);
    });
  }

  async clear(storeName: string): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      store.clear();
    });
  }

  private async executeTransaction(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => void | Promise<any>
  ): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      try {
        const result = operation(store);
        
        transaction.oncomplete = () => {
          resolve(result);
        };

        transaction.onerror = () => {
          reject(new Error('Transaction failed'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}
