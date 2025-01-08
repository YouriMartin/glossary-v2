import { SyncService, SyncOptions } from '../../../infrastructure/sync/SyncService';
import { SecurityMiddleware } from '../../../infrastructure/security/SecurityMiddleware';
import { SecurityService } from '../../../infrastructure/security/SecurityService';

describe('SyncService', () => {
  let syncService: SyncService;
  let mockFetch: jest.Mock;
  let mockSetTimeout: jest.SpyInstance;
  let mockClearTimeout: jest.SpyInstance;
  let securityMiddleware: SecurityMiddleware;
  let spyInterceptSave: jest.SpyInstance;
  let spyInterceptRetrieve: jest.SpyInstance;
  let mockEntry: any;

  const testApiUrl = 'https://api.example.com';
  const testOptions: SyncOptions = {
    autoSync: true,
    syncInterval: 1000,
    maxRetries: 3
  };

  beforeEach(() => {
    // Mock global fetch
    mockFetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    }));
    global.fetch = mockFetch;

    // Mock timers
    jest.useFakeTimers();
    mockSetTimeout = jest.spyOn(global, 'setTimeout');
    mockClearTimeout = jest.spyOn(global, 'clearTimeout');

    // Mock security middleware
    const securityService = new SecurityService();
    securityMiddleware = new SecurityMiddleware(securityService);

    mockEntry = {
      term: 'test',
      definition: 'test',
      category: 'test',
      createdAt: new Date('2025-01-08T19:23:52.785Z'),
      updatedAt: new Date('2025-01-08T19:23:52.785Z'),
      acronym: 'test',
      _definition: 'test',
      updateDefinition: jest.fn()
    };

    spyInterceptSave = jest.spyOn(securityMiddleware, 'interceptSave')
      .mockImplementation(async () => mockEntry);
    spyInterceptRetrieve = jest.spyOn(securityMiddleware, 'interceptRetrieve')
      .mockImplementation(async () => mockEntry);

    // Mock getLocalChanges pour retourner des données de test
    jest.spyOn(SyncService.prototype as any, 'getLocalChanges')
      .mockResolvedValue([mockEntry]);

    syncService = new SyncService(testApiUrl, securityMiddleware, {
      ...testOptions,
      autoSync: false // Désactiver l'auto-sync par défaut pour les tests
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.restoreAllMocks();
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
    it('should start auto sync when enabled', async () => {
      // Créer un nouveau service avec auto-sync activé
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockEntry])
      }));

      const autoSyncService = new SyncService(testApiUrl, securityMiddleware, {
        ...testOptions,
        autoSync: true
      });

      // Attendre que la première synchronisation soit terminée
      await Promise.resolve(); // Pour le constructeur
      await Promise.resolve(); // Pour le startSync
      await Promise.resolve(); // Pour le sync
      await Promise.resolve(); // Pour le fetch

      // Vérifier que la synchronisation a été effectuée
      expect(mockFetch).toHaveBeenCalledWith(
        `${testApiUrl}/sync`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(String)
        })
      );

      // Avancer le temps et attendre que la prochaine synchronisation soit programmée
      jest.advanceTimersByTime(testOptions.syncInterval);
      
      // Vérifier que setTimeout a été appelé avec les bons arguments
      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        testOptions.syncInterval
      );

      // Nettoyer
      autoSyncService.stopSync();
    });

    it('should stop auto sync after max retries', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: false,
        statusText: 'Server Error'
      }));

      // Créer un nouveau service avec auto-sync activé et un seul essai
      const autoSyncService = new SyncService(testApiUrl, securityMiddleware, {
        ...testOptions,
        autoSync: true,
        maxRetries: 1
      });

      // Attendre que la première synchronisation soit terminée
      await Promise.resolve(); // Pour le constructeur
      await Promise.resolve(); // Pour le startSync
      await Promise.resolve(); // Pour le sync
      await Promise.resolve(); // Pour le fetch

      // Simuler la deuxième tentative
      jest.advanceTimersByTime(testOptions.syncInterval);
      await Promise.resolve(); // Pour le startSync
      await Promise.resolve(); // Pour le sync
      await Promise.resolve(); // Pour le fetch

      // Vérifier que clearTimeout a été appelé après le nombre maximum de tentatives
      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2); // Une fois pour chaque tentative
      
      // Vérifier qu'aucune nouvelle tentative n'est programmée
      jest.advanceTimersByTime(testOptions.syncInterval);
      expect(mockSetTimeout).not.toHaveBeenCalledTimes(3);
    });
  });

  describe('Security Integration', () => {
    beforeEach(() => {
      // Mock fetch pour retourner des données
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockEntry])
      }));

      // Mock les méthodes de sécurité
      spyInterceptSave.mockResolvedValue(mockEntry);
      spyInterceptRetrieve.mockResolvedValue(mockEntry);
    });

    it('should encrypt data before sending to server', async () => {
      await syncService.sync();
      expect(spyInterceptSave).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls[0];
      const sentData = JSON.parse(fetchCall[1].body);
      const { updateDefinition, ...expectedEntry } = mockEntry;
      expect(sentData[0]).toEqual({
        ...expectedEntry,
        createdAt: expectedEntry.createdAt.toISOString(),
        updatedAt: expectedEntry.updatedAt.toISOString()
      });
    });

    it('should decrypt data received from server', async () => {
      await syncService.sync();
      expect(spyInterceptRetrieve).toHaveBeenCalled();
    });
  });
});
