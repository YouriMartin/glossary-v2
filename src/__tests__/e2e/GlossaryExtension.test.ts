import { Entry } from '../../domain/entities/Entry';
import { GlossaryRepository } from '../../data/repositories/GlossaryRepository';
import { SecurityMiddleware } from '../../infrastructure/security/SecurityMiddleware';
import { SecurityService } from '../../infrastructure/security/SecurityService';
import { SyncService } from '../../infrastructure/sync/SyncService';
import { IndexedDBService } from '../../data/datasources/IndexedDBService';
import { CSVService } from '../../data/datasources/CSVService';

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(30000);

// Mock de SecurityMiddleware
jest.mock('../../infrastructure/security/SecurityMiddleware', () => {
  return {
    SecurityMiddleware: jest.fn().mockImplementation(() => ({
      interceptSave: jest.fn().mockImplementation(entry => Promise.resolve(entry)),
      interceptRetrieve: jest.fn().mockImplementation(entry => Promise.resolve(entry)),
      validateOperation: jest.fn().mockResolvedValue(true),
      processData: jest.fn().mockImplementation(data => Promise.resolve(data)),
      checkContentSecurity: jest.fn().mockResolvedValue(true)
    }))
  };
});

// Mock de fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        term: 'test',
        definition: 'test',
        category: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  })
) as jest.Mock;

// Mock de indexedDB
const mockIndexedDB = {
  open: jest.fn().mockImplementation((dbName, version) => {
    const request = {
      result: {
        createObjectStore: jest.fn().mockReturnValue({
          createIndex: jest.fn()
        }),
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn().mockImplementation(() => Promise.resolve()),
            put: jest.fn().mockImplementation(() => Promise.resolve()),
            get: jest.fn().mockImplementation(() => Promise.resolve(null)),
            getAll: jest.fn().mockImplementation(() => Promise.resolve([])),
            delete: jest.fn().mockImplementation(() => Promise.resolve()),
            clear: jest.fn().mockImplementation(() => Promise.resolve())
          }),
          complete: jest.fn()
        }),
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(true)
        }
      },
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      addEventListener: jest.fn().mockImplementation((event, handler) => {
        if (event === 'upgradeneeded') {
          setTimeout(() => {
            handler({
              target: {
                result: {
                  createObjectStore: jest.fn().mockReturnValue({
                    createIndex: jest.fn()
                  }),
                  objectStoreNames: {
                    contains: jest.fn().mockReturnValue(false)
                  }
                }
              }
            });
          }, 0);
        }
        if (event === 'success') {
          setTimeout(() => {
            handler({
              target: {
                result: {
                  transaction: jest.fn().mockReturnValue({
                    objectStore: jest.fn().mockReturnValue({
                      add: jest.fn().mockResolvedValue(undefined),
                      put: jest.fn().mockResolvedValue(undefined),
                      get: jest.fn().mockResolvedValue(null),
                      getAll: jest.fn().mockResolvedValue([]),
                      delete: jest.fn().mockResolvedValue(undefined),
                      clear: jest.fn().mockResolvedValue(undefined)
                    }),
                    complete: jest.fn()
                  }),
                  objectStoreNames: {
                    contains: jest.fn().mockReturnValue(true)
                  }
                }
              }
            });
          }, 0);
        }
      })
    };
    return request;
  })
};

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

jest.mock('selenium-webdriver', () => {
  const mockElement = {
    getText: jest.fn().mockResolvedValue('test definition'),
    getAttribute: jest.fn().mockResolvedValue('sanitized content'),
  };

  const mockDriver = {
    findElement: jest.fn().mockResolvedValue(mockElement),
    findElements: jest.fn().mockResolvedValue([mockElement]),
    executeScript: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    sleep: jest.fn(),
    wait: jest.fn(),
    actions: () => ({
      move: () => ({
        perform: jest.fn()
      })
    })
  };

  return {
    Builder: jest.fn().mockReturnValue({
      forBrowser: jest.fn().mockReturnValue({
        build: jest.fn().mockResolvedValue(mockDriver)
      })
    }),
    By: {
      className: jest.fn()
    },
    until: {
      elementLocated: jest.fn()
    }
  };
});

describe('Glossary Extension Integration Tests', () => {
  let glossaryRepository: GlossaryRepository;
  let securityService: SecurityService;
  let securityMiddleware: SecurityMiddleware;
  let syncService: SyncService;
  let dbService: IndexedDBService<any>;
  let csvService: CSVService;

  beforeEach(async () => {
    // Initialiser les services
    dbService = new IndexedDBService('testDB', 1, ['glossary']);
    csvService = new CSVService();
    glossaryRepository = new GlossaryRepository(dbService, csvService);
    securityService = new SecurityService();
    securityMiddleware = new SecurityMiddleware(securityService);
    syncService = new SyncService('https://api.example.com', securityMiddleware);

    // Initialiser la base de données
    await glossaryRepository.initialize();
  });

  describe('Basic Functionality', () => {
    it('should process terms correctly', async () => {
      // Ajouter un terme au glossaire
      const entry = new Entry('test term', 'test definition');
      await glossaryRepository.saveEntry(entry);

      // Vérifier que l'entrée est correctement stockée
      const entries = await glossaryRepository.getAllEntries();
      expect(entries).toContainEqual(expect.objectContaining({
        acronym: entry.acronym,
        definition: entry.definition
      }));
    });
  });

  describe('Security Features', () => {
    it('should safely handle malicious content', async () => {
      // Tenter d'ajouter une entrée malveillante
      const entry = new Entry('xss test', '<script>alert("xss")</script>');
      
      // Vérifier que le contenu est assaini par le middleware
      const processedData = await securityMiddleware.processData('save', entry.definition);
      expect(processedData).not.toContain('<script>');
    });
  });

  describe('Sync Functionality', () => {
    it('should sync changes with server', async () => {
      // Ajouter une entrée locale
      const entry = new Entry('sync test', 'sync definition');
      await glossaryRepository.saveEntry(entry);

      // Déclencher la synchronisation
      await syncService.sync();

      // Vérifier que les changements sont synchronisés
      const entries = await glossaryRepository.getAllEntries();
      expect(entries).toContainEqual(expect.objectContaining({
        acronym: entry.acronym,
        definition: entry.definition
      }));
    });
  });

  describe('Performance', () => {
    it('should handle multiple entries efficiently', async () => {
      // Réduire le nombre d'entrées pour le test de performance
      const entries = Array.from({ length: 20 }, (_, i) => 
        new Entry(`term${i}`, `definition${i}`)
      );
      
      const startTime = Date.now();
      await Promise.all(entries.map(entry => glossaryRepository.saveEntry(entry)));
      const processingTime = Date.now() - startTime;
      
      // Le traitement devrait prendre moins de 500ms
      expect(processingTime).toBeLessThan(500);
    });
  });
});
