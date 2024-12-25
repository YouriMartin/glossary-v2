export interface IIndexedDBService {
  initialize(): Promise<void>;
  add(storeName: string, data: any): Promise<void>;
  get(storeName: string, key: string): Promise<any>;
  getAll(storeName: string): Promise<any[]>;
  delete(storeName: string, key: string): Promise<void>;
  clear(storeName: string): Promise<void>;
}
