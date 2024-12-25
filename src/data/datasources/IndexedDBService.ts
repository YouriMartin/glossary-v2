import { IIndexedDBService } from './IIndexedDBService';

export class IndexedDBService<T> implements IIndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly version: number;
  private readonly stores: string[];

  constructor(dbName: string = 'glossaryDB', version: number = 1, stores: string[] = ['entries']) {
    this.dbName = dbName;
    this.version = version;
    this.stores = stores;
  }

  async initialize(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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

  async add(storeName: string, data: T): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to add data'));
      });
    });
  }

  async get(storeName: string, key: string): Promise<T | undefined> {
    return this.executeTransaction(storeName, 'readonly', (store) => {
      return new Promise<T | undefined>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to get data'));
      });
    });
  }

  async getAll(storeName: string): Promise<T[]> {
    return this.executeTransaction(storeName, 'readonly', (store) => {
      return new Promise<T[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to get all data'));
      });
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to delete data'));
      });
    });
  }

  async clear(storeName: string): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear store'));
      });
    });
  }

  private async executeTransaction<R>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<R>
  ): Promise<R> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise<R>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      let operationPromise: Promise<R>;
      let transactionComplete = false;
      let operationResult: R | undefined;

      transaction.oncomplete = () => {
        transactionComplete = true;
        if (operationResult !== undefined) {
          resolve(operationResult);
        }
      };

      transaction.onerror = () => {
        reject(new Error('Transaction failed'));
      };

      operationPromise = operation(store);
      operationPromise
        .then((result) => {
          operationResult = result;
          if (transactionComplete) {
            resolve(result);
          }
        })
        .catch(reject);
    });
  }
}
