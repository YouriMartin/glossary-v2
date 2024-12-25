import { ManageEntryUseCase } from '../../../domain/usecases/ManageEntryUseCase';
import { IGlossaryRepository } from '../../../domain/repositories/IGlossaryRepository';
import { Entry } from '../../../domain/entities/Entry';

describe('ManageEntryUseCase', () => {
  let useCase: ManageEntryUseCase;
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
    useCase = new ManageEntryUseCase(mockRepository);
  });

  describe('addEntry', () => {
    it('should add new entry when acronym does not exist', async () => {
      mockRepository.getEntry.mockResolvedValue(null);
      
      await useCase.addEntry('API', 'Application Programming Interface');
      
      expect(mockRepository.saveEntry).toHaveBeenCalledWith(
        expect.any(Entry)
      );
    });

    it('should throw error when acronym already exists', async () => {
      mockRepository.getEntry.mockResolvedValue(
        new Entry('API', 'Existing Definition')
      );
      
      await expect(
        useCase.addEntry('API', 'New Definition')
      ).rejects.toThrow('Acronym already exists');
    });
  });

  describe('updateEntry', () => {
    it('should update existing entry', async () => {
      const existingEntry = new Entry('API', 'Old Definition');
      mockRepository.getEntry.mockResolvedValue(existingEntry);
      
      await useCase.updateEntry('API', 'New Definition');
      
      expect(mockRepository.saveEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          acronym: 'API',
          definition: 'New Definition'
        })
      );
    });

    it('should throw error when entry does not exist', async () => {
      mockRepository.getEntry.mockResolvedValue(null);
      
      await expect(
        useCase.updateEntry('API', 'New Definition')
      ).rejects.toThrow('Entry not found');
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry', async () => {
      await useCase.deleteEntry('API');
      expect(mockRepository.deleteEntry).toHaveBeenCalledWith('API');
    });
  });

  describe('getEntry', () => {
    it('should return entry when found', async () => {
      const entry = new Entry('API', 'Definition');
      mockRepository.getEntry.mockResolvedValue(entry);
      
      const result = await useCase.getEntry('API');
      expect(result).toBe(entry);
    });

    it('should return null when entry not found', async () => {
      mockRepository.getEntry.mockResolvedValue(null);
      
      const result = await useCase.getEntry('API');
      expect(result).toBeNull();
    });
  });

  describe('getAllEntries', () => {
    it('should return all entries', async () => {
      const entries = [
        new Entry('API', 'Definition 1'),
        new Entry('URL', 'Definition 2')
      ];
      mockRepository.getAllEntries.mockResolvedValue(entries);
      
      const result = await useCase.getAllEntries();
      expect(result).toBe(entries);
    });
  });
});
