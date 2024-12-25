import { ImportExportUseCase } from '../../../domain/usecases/ImportExportUseCase';
import { IGlossaryRepository } from '../../../domain/repositories/IGlossaryRepository';

describe('ImportExportUseCase', () => {
  let useCase: ImportExportUseCase;
  let mockRepository: jest.Mocked<IGlossaryRepository>;

  beforeEach(() => {
    mockRepository = {
      saveEntry: jest.fn(),
      getEntry: jest.fn(),
      getAllEntries: jest.fn(),
      deleteEntry: jest.fn(),
      importFromCSV: jest.fn(),
      exportToCSV: jest.fn(),
    };
    useCase = new ImportExportUseCase(mockRepository);
  });

  describe('importFromCSV', () => {
    it('should import CSV content', async () => {
      const csvContent = 'acronym,definition\nAPI,Application Programming Interface';
      await useCase.importFromCSV(csvContent);
      expect(mockRepository.importFromCSV).toHaveBeenCalledWith(csvContent);
    });
  });

  describe('exportToCSV', () => {
    it('should export to CSV format', async () => {
      const expectedCSV = 'acronym,definition\nAPI,Application Programming Interface';
      mockRepository.exportToCSV.mockResolvedValue(expectedCSV);
      
      const result = await useCase.exportToCSV();
      expect(result).toBe(expectedCSV);
      expect(mockRepository.exportToCSV).toHaveBeenCalled();
    });
  });
});
