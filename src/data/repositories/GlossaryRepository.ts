import { IGlossaryRepository } from '../../domain/repositories/IGlossaryRepository';
import { Entry } from '../../domain/entities/Entry';
import { IIndexedDBService } from '../datasources/IIndexedDBService';

export class GlossaryRepository implements IGlossaryRepository {
  private readonly STORE_NAME = 'glossary';

  constructor(private dbService: IIndexedDBService) {}

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
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const acronymIndex = headers.indexOf('acronym');
    const definitionIndex = headers.indexOf('definition');

    if (acronymIndex === -1 || definitionIndex === -1) {
      throw new Error('Invalid CSV format');
    }

    await this.dbService.clear(this.STORE_NAME);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length > 1) {
        const acronym = values[acronymIndex].trim();
        const definition = values[definitionIndex].trim();
        if (acronym && definition) {
          const entry = new Entry(acronym, definition);
          await this.saveEntry(entry);
        }
      }
    }
  }

  async exportToCSV(): Promise<string> {
    const entries = await this.getAllEntries();
    const headers = ['acronym', 'definition'];
    const rows = entries.map(entry => 
      `${entry.acronym},${entry.definition}`
    );
    
    return [headers.join(','), ...rows].join('\n');
  }
}
