import { SyncService, SyncOptions } from '../../../infrastructure/sync/SyncService';
import { SecurityMiddleware } from '../../../infrastructure/security/SecurityMiddleware';
import { SecurityService } from '../../../infrastructure/security/SecurityService';

describe('SyncService', () => {
  let syncService: SyncService;
  let securityMiddleware: SecurityMiddleware;
  let mockFetch: jest.Mock;

  const testApiUrl = 'https://api.example.com';
  const testOptions: SyncOptions = {
    autoSync: false,
    syncInterval: 1000,
    maxRetries: 2
  };

  beforeEach(() => {
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Setup security middleware
    const securityService = new SecurityService();
    securityMiddleware = new SecurityMiddleware(securityService);

    // Setup sync service
    syncService = new SyncService(testApiUrl, securityMiddleware, testOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sync Operations', () => {
    it('should successfully sync with server', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([])
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(syncService.sync()).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle sync failure', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Server Error'
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(syncService.sync()).rejects.toThrow('Sync failed: Server Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      await expect(syncService.sync()).rejects.toThrow('Network Error');
    });
  });

  describe('Auto Sync', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start auto sync when enabled', () => {
      const autoSyncService = new SyncService(testApiUrl, securityMiddleware, {
        ...testOptions,
        autoSync: true
      });

      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        testOptions.syncInterval
      );
    });

    it('should stop auto sync after max retries', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Server Error'
      };
      mockFetch.mockResolvedValue(mockResponse);

      const autoSyncService = new SyncService(testApiUrl, securityMiddleware, {
        ...testOptions,
        autoSync: true
      });

      // Simulate multiple sync failures
      for (let i = 0; i <= testOptions.maxRetries; i++) {
        jest.advanceTimersByTime(testOptions.syncInterval);
        await Promise.resolve(); // Allow promises to resolve
      }

      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe('Security Integration', () => {
    it('should encrypt data before sending to server', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([])
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const spyInterceptSave = jest.spyOn(securityMiddleware, 'interceptSave');
      
      await syncService.sync();
      
      expect(spyInterceptSave).toHaveBeenCalled();
    });

    it('should decrypt data received from server', async () => {
      const mockServerData = [{
        term: 'test',
        definition: 'encrypted::data',
        category: 'test'
      }];
      
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockServerData)
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const spyInterceptRetrieve = jest.spyOn(securityMiddleware, 'interceptRetrieve');
      
      await syncService.sync();
      
      expect(spyInterceptRetrieve).toHaveBeenCalled();
    });
  });
});
