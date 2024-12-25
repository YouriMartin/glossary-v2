import { Entry } from '../entities/Entry';
import { IGlossaryRepository } from '../repositories/IGlossaryRepository';

export class ManageEntryUseCase {
  constructor(private repository: IGlossaryRepository) {}

  async addEntry(acronym: string, definition: string): Promise<void> {
    const existingEntry = await this.repository.getEntry(acronym);
    if (existingEntry) {
      throw new Error('Acronym already exists');
    }
    
    const entry = new Entry(acronym, definition);
    await this.repository.saveEntry(entry);
  }

  async updateEntry(acronym: string, newDefinition: string): Promise<void> {
    const entry = await this.repository.getEntry(acronym);
    if (!entry) {
      throw new Error('Entry not found');
    }
    
    entry.updateDefinition(newDefinition);
    await this.repository.saveEntry(entry);
  }

  async deleteEntry(acronym: string): Promise<void> {
    await this.repository.deleteEntry(acronym);
  }

  async getEntry(acronym: string): Promise<Entry | null> {
    return await this.repository.getEntry(acronym);
  }

  async getAllEntries(): Promise<Entry[]> {
    return await this.repository.getAllEntries();
  }
}
