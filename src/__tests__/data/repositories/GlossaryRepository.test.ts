import { GlossaryRepository } from '../../../data/repositories/GlossaryRepository';
import { IIndexedDBService } from '../../../data/datasources/IIndexedDBService';
import { ICSVService } from '../../../data/datasources/ICSVService';
import { Entry } from '../../../domain/entities/Entry';

describe('GlossaryRepository', () => {
  let repository: GlossaryRepository;
  let mockDBService: jest.Mocked<IIndexedDBService>;
  let mockCSVService: jest.Mocked<ICSVService>;

  beforeEach(() => {
    mockDBService = {
      initialize: jest.fn(),
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    };

    mockCSVService = {
      parse: jest.fn(),
      stringify: jest.fn(),
      validate: jest.fn(),
    };

    repository = new GlossaryRepository(mockDBService, mockCSVService);
  });

  describe('saveEntry', () => {
    it('should save entry to database', async () => {
      const entry = new Entry('API', 'Application Programming Interface');
      await repository.saveEntry(entry);

      expect(mockDBService.add).toHaveBeenCalledWith('glossary', {
        acronym: entry.acronym,
        definition: entry.definition,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      });
    });
  });

  describe('getEntry', () => {
    it('should return entry when found', async () => {
      const mockData = {
        acronym: 'API',
        definition: 'Application Programming Interface',
        createdAt: new Date().toISOString(),
        updatedAt: null
      };
      mockDBService.get.mockResolvedValue(mockData);

      const entry = await repository.getEntry('API');
      
      expect(entry).toBeDefined();
      expect(entry?.acronym).toBe('API');
      expect(entry?.definition).toBe('Application Programming Interface');
    });

    it('should return null when entry not found', async () => {
      mockDBService.get.mockResolvedValue(null);
      
      const entry = await repository.getEntry('NOT_EXISTS');
      expect(entry).toBeNull();
    });
  });

  describe('getAllEntries', () => {
    it('should return all entries', async () => {
      const mockEntries = [
        {
          acronym: 'API',
          definition: 'Application Programming Interface',
          createdAt: new Date().toISOString(),
          updatedAt: null
        },
        {
          acronym: 'URL',
          definition: 'Uniform Resource Locator',
          createdAt: new Date().toISOString(),
          updatedAt: null
        }
      ];
      mockDBService.getAll.mockResolvedValue(mockEntries);

      const entries = await repository.getAllEntries();
      
      expect(entries).toHaveLength(2);
      expect(entries[0].acronym).toBe('API');
      expect(entries[1].acronym).toBe('URL');
    });
  });

  describe('importFromCSV', () => {
    it('should import entries from CSV content', async () => {
      const entries = [
        new Entry('API', 'Application Programming Interface'),
        new Entry('URL', 'Uniform Resource Locator')
      ];
      mockCSVService.parse.mockResolvedValue(entries);
      
      const csvContent = 'acronym,definition\nAPI,Application Programming Interface\nURL,Uniform Resource Locator';
      await repository.importFromCSV(csvContent);

      expect(mockDBService.clear).toHaveBeenCalled();
      expect(mockDBService.add).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid CSV format', async () => {
      const invalidCSV = 'invalid,csv\nformat';
      mockCSVService.parse.mockRejectedValue(new Error('Invalid CSV format'));
      
      await expect(repository.importFromCSV(invalidCSV))
        .rejects.toThrow('Invalid CSV format');
    });
  });

  describe('exportToCSV', () => {
    it('should export entries to CSV format', async () => {
      const entries = [
        new Entry('API', 'Application Programming Interface'),
        new Entry('URL', 'Uniform Resource Locator')
      ];
      const expectedCSV = 'acronym,definition\nAPI,Application Programming Interface\nURL,Uniform Resource Locator';
      
      mockDBService.getAll.mockResolvedValue(entries);
      mockCSVService.stringify.mockResolvedValue(expectedCSV);

      const csv = await repository.exportToCSV();
      expect(csv).toBe(expectedCSV);
    });
  });
});
