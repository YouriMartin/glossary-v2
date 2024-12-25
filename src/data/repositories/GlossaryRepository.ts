import { IGlossaryRepository } from '../../domain/repositories/IGlossaryRepository';
import { Entry } from '../../domain/entities/Entry';
import { IIndexedDBService } from '../datasources/IIndexedDBService';
import { ICSVService } from '../datasources/ICSVService';

export class GlossaryRepository implements IGlossaryRepository {
  private readonly STORE_NAME = 'glossary';

  constructor(
    private dbService: IIndexedDBService,
    private csvService: ICSVService
  ) {}

  async initialize(): Promise<void> {
    await this.dbService.initialize();
  }

  async saveEntry(entry: Entry): Promise<void> {
    await this.dbService.add(this.STORE_NAME, {
      acronym: entry.acronym,
      definition: entry.definition,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    });
  }

  async getEntry(acronym: string): Promise<Entry | null> {
    const data = await this.dbService.get(this.STORE_NAME, acronym);
    if (!data) return null;
    
    const entry = new Entry(data.acronym, data.definition);
    Object.assign(entry, {
      createdAt: new Date(data.createdAt),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : null
    });
    return entry;
  }

  async getAllEntries(): Promise<Entry[]> {
    const entries = await this.dbService.getAll(this.STORE_NAME);
    return entries.map(data => {
      const entry = new Entry(data.acronym, data.definition);
      Object.assign(entry, {
        createdAt: new Date(data.createdAt),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : null
      });
      return entry;
    });
  }

  async deleteEntry(acronym: string): Promise<void> {
    await this.dbService.delete(this.STORE_NAME, acronym);
  }

  async importFromCSV(csvContent: string): Promise<void> {
    const entries = await this.csvService.parse(csvContent);
    await this.dbService.clear(this.STORE_NAME);
    
    for (const entry of entries) {
      await this.saveEntry(entry);
    }
  }

  async exportToCSV(): Promise<string> {
    const entries = await this.getAllEntries();
    return await this.csvService.stringify(entries);
  }
}
