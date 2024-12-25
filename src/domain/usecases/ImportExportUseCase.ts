import { IGlossaryRepository } from '../repositories/IGlossaryRepository';

export class ImportExportUseCase {
  constructor(private repository: IGlossaryRepository) {}

  async importFromCSV(csvContent: string): Promise<void> {
    await this.repository.importFromCSV(csvContent);
  }

  async exportToCSV(): Promise<string> {
    return await this.repository.exportToCSV();
  }
}
