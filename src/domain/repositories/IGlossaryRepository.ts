import { Entry } from '../entities/Entry';

export interface IGlossaryRepository {
  saveEntry(entry: Entry): Promise<void>;
  getEntry(acronym: string): Promise<Entry | null>;
  getAllEntries(): Promise<Entry[]>;
  deleteEntry(acronym: string): Promise<void>;
  importFromCSV(csvContent: string): Promise<void>;
  exportToCSV(): Promise<string>;
}
