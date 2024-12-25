import { CSVService } from '../../../data/datasources/CSVService';
import { Entry } from '../../../domain/entities/Entry';

describe('CSVService', () => {
  let csvService: CSVService;

  beforeEach(() => {
    csvService = new CSVService();
  });

  describe('validate', () => {
    it('should validate correct CSV format', () => {
      const validCSV = 'acronym,definition\nAPI,Application Programming Interface';
      expect(csvService.validate(validCSV)).toBe(true);
    });

    it('should invalidate empty content', () => {
      expect(csvService.validate('')).toBe(false);
      expect(csvService.validate('   ')).toBe(false);
    });

    it('should invalidate CSV without required headers', () => {
      const invalidCSV = 'acr,def\nAPI,Application Programming Interface';
      expect(csvService.validate(invalidCSV)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse valid CSV content', async () => {
      const validCSV = 'acronym,definition\nAPI,Application Programming Interface\nURL,Uniform Resource Locator';
      const entries = await csvService.parse(validCSV);

      expect(entries).toHaveLength(2);
      expect(entries[0].acronym).toBe('API');
      expect(entries[0].definition).toBe('Application Programming Interface');
      expect(entries[1].acronym).toBe('URL');
      expect(entries[1].definition).toBe('Uniform Resource Locator');
    });

    it('should handle CSV with quoted values', async () => {
      const csvWithQuotes = 'acronym,definition\nAPI,"Application, Programming Interface"\nURL,Uniform Resource Locator';
      const entries = await csvService.parse(csvWithQuotes);

      expect(entries[0].definition).toBe('Application, Programming Interface');
    });

    it('should skip invalid lines', async () => {
      const csvWithInvalidLine = 'acronym,definition\nAPI,Application Programming Interface\n,Invalid Line\nURL,Uniform Resource Locator';
      const entries = await csvService.parse(csvWithInvalidLine);

      expect(entries).toHaveLength(2);
      expect(entries[1].acronym).toBe('URL');
    });

    it('should throw error for invalid CSV format', async () => {
      const invalidCSV = 'invalid,csv\nformat';
      await expect(csvService.parse(invalidCSV)).rejects.toThrow('Invalid CSV format');
    });
  });

  describe('stringify', () => {
    it('should convert entries to CSV string', async () => {
      const entries = [
        new Entry('API', 'Application Programming Interface'),
        new Entry('URL', 'Uniform Resource Locator')
      ];

      const csv = await csvService.stringify(entries);
      const expectedCSV = 'acronym,definition\nAPI,Application Programming Interface\nURL,Uniform Resource Locator';
      
      expect(csv).toBe(expectedCSV);
    });

    it('should properly escape special characters', async () => {
      const entries = [
        new Entry('API', 'Application, Programming Interface'),
        new Entry('CSV', 'Comma "Separated" Values')
      ];

      const csv = await csvService.stringify(entries);
      const lines = csv.split('\n');
      
      expect(lines[1]).toBe('API,"Application, Programming Interface"');
      expect(lines[2]).toBe('CSV,"Comma ""Separated"" Values"');
    });
  });
});
