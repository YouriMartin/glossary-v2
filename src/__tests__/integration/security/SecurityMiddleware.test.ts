import { SecurityService } from '../../../infrastructure/security/SecurityService';
import { GlossaryRepository } from '../../../data/repositories/GlossaryRepository';
import { SecurityMiddleware } from '../../../infrastructure/security/SecurityMiddleware';
import { IndexedDBService } from '../../../data/datasources/IndexedDBService';
import { CSVService } from '../../../data/datasources/CSVService';
import { Entry } from '../../../domain/entities/Entry';
import { GlossaryEntry } from '../../../domain/entities/GlossaryEntry';

// Mock pour IndexedDBService
const mockIndexedDBService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  put: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAll: jest.fn().mockResolvedValue([]),
  close: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  count: jest.fn().mockResolvedValue(0),
  getAllKeys: jest.fn().mockResolvedValue([])
};

jest.mock('../../../data/datasources/IndexedDBService', () => {
  return {
    IndexedDBService: jest.fn().mockImplementation(() => mockIndexedDBService)
  };
});

// Mock pour le CSVService
const mockCSVService = {
  exportToCSV: jest.fn().mockResolvedValue('csv data'),
  importFromCSV: jest.fn().mockResolvedValue([])
};

jest.mock('../../../data/datasources/CSVService', () => {
  return {
    CSVService: jest.fn().mockImplementation(() => mockCSVService)
  };
});

// Mock pour le SecurityService
const mockSecurityService = {
  isOperationAllowed: jest.fn().mockResolvedValue(true),
  checkOriginSecurity: jest.fn().mockReturnValue(true),
  validateInput: jest.fn().mockReturnValue(true),
  checkContentSecurity: jest.fn().mockResolvedValue(true),
  encryptData: jest.fn().mockImplementation((data) => {
    const ciphertext = 'encrypted_' + data;
    const iv = 'test-iv';
    return Promise.resolve({ ciphertext, iv });
  }),
  decryptData: jest.fn().mockImplementation((ciphertext, iv) => {
    if (typeof ciphertext === 'string' && ciphertext.startsWith('encrypted_')) {
      return Promise.resolve(ciphertext.replace('encrypted_', ''));
    }
    return Promise.resolve(ciphertext);
  })
};

jest.mock('../../../infrastructure/security/SecurityService', () => {
  return {
    SecurityService: jest.fn().mockImplementation(() => mockSecurityService)
  };
});

describe('Security Middleware Integration Tests', () => {
  let securityService: SecurityService;
  let glossaryRepository: GlossaryRepository;
  let securityMiddleware: SecurityMiddleware;
  let dbService: IndexedDBService<any>;
  let csvService: CSVService;

  // Timeout raisonnable pour les tests
  jest.setTimeout(5000);

  beforeEach(async () => {
    // Réinitialiser tous les mocks
    jest.clearAllMocks();
    
    // Réinitialiser le comportement par défaut des mocks
    mockSecurityService.isOperationAllowed.mockResolvedValue(true);
    mockSecurityService.checkOriginSecurity.mockReturnValue(true);
    mockSecurityService.validateInput.mockReturnValue(true);
    mockSecurityService.checkContentSecurity.mockResolvedValue(true);
    mockSecurityService.encryptData.mockImplementation((data) => {
      const ciphertext = 'encrypted_' + data;
      const iv = 'test-iv';
      return Promise.resolve({ ciphertext, iv });
    });
    mockSecurityService.decryptData.mockImplementation((ciphertext, iv) => {
      if (typeof ciphertext === 'string' && ciphertext.startsWith('encrypted_')) {
        return Promise.resolve(ciphertext.replace('encrypted_', ''));
      }
      return Promise.resolve(ciphertext);
    });

    // Configurer le comportement du mock IndexedDBService
    mockIndexedDBService.get.mockImplementation((store: string, key: string) => {
      if (store === 'glossary' && key === 'test') {
        return Promise.resolve({
          term: 'test',
          definition: 'encrypted_test definition::test-iv',
          category: 'default'
        });
      }
      return Promise.resolve(undefined);
    });
    
    // Initialiser les services
    securityService = new SecurityService();
    dbService = new IndexedDBService<any>('testDB', 1, ['glossary']);
    csvService = new CSVService();
    glossaryRepository = new GlossaryRepository(dbService, csvService);
    securityMiddleware = new SecurityMiddleware(securityService);
  });

  afterEach(async () => {
    // Nettoyer la base de données après chaque test
    try {
      await dbService.clear('glossary');
    } catch (error) {
      console.warn('Error cleaning up database:', error);
    }
  });

  // Fonctions utilitaires pour la conversion entre Entry et GlossaryEntry
  function entryToGlossaryEntry(entry: Entry): GlossaryEntry {
    return {
      term: entry.acronym,
      definition: entry.definition,
      category: 'default',
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt || undefined
    };
  }

  function glossaryEntryToEntry(glossaryEntry: GlossaryEntry): Entry {
    const entry = new Entry(glossaryEntry.term, glossaryEntry.definition);
    if (glossaryEntry.createdAt) {
      (entry as any).createdAt = glossaryEntry.createdAt;
    }
    if (glossaryEntry.updatedAt) {
      entry.updatedAt = glossaryEntry.updatedAt;
    }
    return entry;
  }

  describe('Data Protection Flow', () => {
    it('should protect data through the entire flow', async () => {
      // Créer une entrée de test
      const entry = new Entry('test', 'test definition');
      const glossaryEntry = entryToGlossaryEntry(entry);

      // Test middleware interception
      const protectedEntry = await securityMiddleware.interceptSave(glossaryEntry);
      expect(protectedEntry).toBeDefined();

      // Test middleware decryption
      const retrievedEntry = await dbService.get('glossary', 'test');
      if (retrievedEntry) {
        const decryptedEntry = await securityMiddleware.interceptRetrieve(retrievedEntry);
        expect(decryptedEntry.term).toBe(entry.acronym);
        expect(decryptedEntry.definition).toBe(entry.definition);
      } else {
        expect(retrievedEntry).toBeDefined();
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      // Créer les entrées de test
      const entries = Array.from({ length: 100 }, (_, i) => {
        const entry = new Entry(`term${i}`, `definition${i}`);
        return entryToGlossaryEntry(entry);
      });

      const startTime = Date.now();
      
      // Process all entries through middleware
      const protectedEntries = await Promise.all(
        entries.map(entry => securityMiddleware.interceptSave(entry))
      );
      
      // Save all protected entries
      await Promise.all(
        protectedEntries.map(entry => glossaryRepository.saveEntry(glossaryEntryToEntry(entry)))
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Vérifier que le traitement est assez rapide (moins de 1s pour 100 entrées)
      expect(processingTime).toBeLessThan(1000);
      
      // Vérifier que toutes les entrées sont correctement protégées
      for (let i = 0; i < protectedEntries.length; i++) {
        expect(protectedEntries[i].definition).not.toBe(entries[i].definition);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', async () => {
      const maliciousEntry = new Entry('test', '<script>alert("xss")</script>');
      
      // Override le mock pour simuler une détection de contenu malveillant
      (securityService.checkContentSecurity as jest.Mock).mockResolvedValueOnce(false);
      
      await expect(
        securityMiddleware.interceptSave(entryToGlossaryEntry(maliciousEntry))
      ).rejects.toThrow('Invalid content detected');
    });

    it('should handle decryption failures appropriately', async () => {
      // Override le mock pour simuler une erreur de déchiffrement
      (securityService.decryptData as jest.Mock).mockRejectedValueOnce(new Error('Decryption failed'));
      
      const entry = new Entry('test', 'test definition');
      await expect(
        securityMiddleware.interceptRetrieve(entryToGlossaryEntry(entry))
      ).rejects.toThrow('Decryption failed');
    });
  });

  describe('Permission Checks', () => {
    it('should enforce permission requirements', async () => {
      // Override le mock pour simuler un manque de permissions
      (securityService.isOperationAllowed as jest.Mock).mockResolvedValueOnce(false);
      
      const entry = new Entry('test', 'test definition');
      await expect(
        securityMiddleware.interceptSave(entryToGlossaryEntry(entry))
      ).rejects.toThrow('Insufficient permissions');
    });
  });
});
