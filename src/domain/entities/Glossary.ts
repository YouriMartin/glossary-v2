import { Entry } from './Entry';

export class Glossary {
  private _entries: Entry[] = [];

  get entries(): Entry[] {
    return [...this._entries];
  }

  addEntry(entry: Entry): void {
    if (this.findByAcronym(entry.acronym)) {
      throw new Error('Acronym already exists');
    }
    this._entries.push(entry);
  }

  findByAcronym(acronym: string): Entry | null {
    return this._entries.find(entry => entry.acronym === acronym) || null;
  }

  removeEntry(acronym: string): void {
    const index = this._entries.findIndex(entry => entry.acronym === acronym);
    if (index === -1) {
      throw new Error('Acronym not found');
    }
    this._entries.splice(index, 1);
  }
}
