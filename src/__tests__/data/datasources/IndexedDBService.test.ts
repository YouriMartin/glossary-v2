import { IndexedDBService } from '../../../data/datasources/IndexedDBService';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
};

const mockIDBRequest = {
  onerror: null as any,
  onsuccess: null as any,
  onupgradeneeded: null as any,
  result: {
    transaction: jest.fn(),
    createObjectStore: jest.fn(),
    objectStoreNames: {
      contains: jest.fn(),
    },
  },
};

const mockIDBTransaction = {
  objectStore: jest.fn(),
  oncomplete: null as any,
  onerror: null as any,
};

const mockIDBObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
};

const mockIDBRequest2 = {
  onsuccess: null as any,
  onerror: null as any,
  result: null as any,
};

// Mock global indexedDB
(global as any).indexedDB = mockIndexedDB;

describe('IndexedDBService', () => {
  let service: IndexedDBService<any>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset service
    service = new IndexedDBService('testDB', 1, ['testStore']);

    // Setup default mock implementations
    mockIndexedDB.open.mockReturnValue(mockIDBRequest);
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    mockIDBRequest.result.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBObjectStore.put.mockReturnValue(mockIDBRequest2);
    mockIDBObjectStore.get.mockReturnValue(mockIDBRequest2);
    mockIDBObjectStore.getAll.mockReturnValue(mockIDBRequest2);
    mockIDBObjectStore.delete.mockReturnValue(mockIDBRequest2);
    mockIDBObjectStore.clear.mockReturnValue(mockIDBRequest2);

    // Initialize success handlers
    mockIDBRequest.onsuccess = null;
    mockIDBRequest.onerror = null;
    mockIDBRequest.onupgradeneeded = null;
    mockIDBTransaction.oncomplete = null;
    mockIDBTransaction.onerror = null;
  });

  describe('initialize', () => {
    it('should initialize the database successfully', async () => {
      const initPromise = service.initialize();
      mockIDBRequest.onsuccess({ target: mockIDBRequest });
      await expect(initPromise).resolves.toBeUndefined();
    });

    it('should handle initialization error', async () => {
      const initPromise = service.initialize();
      mockIDBRequest.onerror({ target: mockIDBRequest });
      await expect(initPromise).rejects.toThrow('Failed to open database');
    });

    it('should create object store if it does not exist', async () => {
      mockIDBRequest.result.objectStoreNames.contains.mockReturnValue(false);
      const initPromise = service.initialize();
      mockIDBRequest.onupgradeneeded({ target: mockIDBRequest });
      mockIDBRequest.onsuccess({ target: mockIDBRequest });
      await initPromise;
      expect(mockIDBRequest.result.createObjectStore).toHaveBeenCalledWith('testStore', { keyPath: 'acronym' });
    });
  });

  describe('add', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      mockIDBRequest.onsuccess({ target: mockIDBRequest });
      await initPromise;
    });

    it('should add data successfully', async () => {
      const addPromise = service.add('testStore', { acronym: 'test', definition: 'test' });
      mockIDBRequest2.onsuccess({ target: mockIDBRequest2 });
      mockIDBTransaction.oncomplete({ target: mockIDBTransaction });
      await expect(addPromise).resolves.toBeUndefined();
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith({ acronym: 'test', definition: 'test' });
    });

    it('should handle add error', async () => {
      const addPromise = service.add('testStore', { acronym: 'test', definition: 'test' });
      mockIDBRequest2.onerror({ target: mockIDBRequest2 });
      await expect(addPromise).rejects.toThrow('Failed to add data');
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      mockIDBRequest.onsuccess({ target: mockIDBRequest });
      await initPromise;
    });

    it('should get data successfully', async () => {
      const testData = { acronym: 'test', definition: 'test' };
      mockIDBRequest2.result = testData;
      const getPromise = service.get('testStore', 'test');
      mockIDBRequest2.onsuccess({ target: mockIDBRequest2 });
      mockIDBTransaction.oncomplete({ target: mockIDBTransaction });
      await expect(getPromise).resolves.toEqual(testData);
      expect(mockIDBObjectStore.get).toHaveBeenCalledWith('test');
    });

    it('should handle get error', async () => {
      const getPromise = service.get('testStore', 'test');
      mockIDBRequest2.onerror({ target: mockIDBRequest2 });
      await expect(getPromise).rejects.toThrow('Failed to get data');
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      mockIDBRequest.onsuccess({ target: mockIDBRequest });
      await initPromise;
    });

    it('should get all data successfully', async () => {
      const testData = [{ acronym: 'test1' }, { acronym: 'test2' }];
      mockIDBRequest2.result = testData;
      const getAllPromise = service.getAll('testStore');
      mockIDBRequest2.onsuccess({ target: mockIDBRequest2 });
      mockIDBTransaction.oncomplete({ target: mockIDBTransaction });
      await expect(getAllPromise).resolves.toEqual(testData);
      expect(mockIDBObjectStore.getAll).toHaveBeenCalled();
    });

    it('should handle getAll error', async () => {
      const getAllPromise = service.getAll('testStore');
      mockIDBRequest2.onerror({ target: mockIDBRequest2 });
      await expect(getAllPromise).rejects.toThrow('Failed to get all data');
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      mockIDBRequest.onsuccess({ target: mockIDBRequest });
      await initPromise;
    });

    it('should delete data successfully', async () => {
      const deletePromise = service.delete('testStore', 'test');
      mockIDBRequest2.onsuccess({ target: mockIDBRequest2 });
      mockIDBTransaction.oncomplete({ target: mockIDBTransaction });
      await expect(deletePromise).resolves.toBeUndefined();
      expect(mockIDBObjectStore.delete).toHaveBeenCalledWith('test');
    });

    it('should handle delete error', async () => {
      const deletePromise = service.delete('testStore', 'test');
      mockIDBRequest2.onerror({ target: mockIDBRequest2 });
      await expect(deletePromise).rejects.toThrow('Failed to delete data');
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      mockIDBRequest.onsuccess({ target: mockIDBRequest });
      await initPromise;
    });

    it('should clear store successfully', async () => {
      const clearPromise = service.clear('testStore');
      mockIDBRequest2.onsuccess({ target: mockIDBRequest2 });
      mockIDBTransaction.oncomplete({ target: mockIDBTransaction });
      await expect(clearPromise).resolves.toBeUndefined();
      expect(mockIDBObjectStore.clear).toHaveBeenCalled();
    });

    it('should handle clear error', async () => {
      const clearPromise = service.clear('testStore');
      mockIDBRequest2.onerror({ target: mockIDBRequest2 });
      await expect(clearPromise).rejects.toThrow('Failed to clear store');
    });
  });
});
