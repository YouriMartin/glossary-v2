import { ICSVService } from './ICSVService';
import { Entry } from '../../domain/entities/Entry';

export class CSVService implements ICSVService {
  private readonly REQUIRED_HEADERS = ['acronym', 'definition'];
  private readonly DELIMITER = ',';
  private readonly NEWLINE = '\n';

  async parse(content: string): Promise<Entry[]> {
    if (!this.validate(content)) {
      throw new Error('Invalid CSV format');
    }

    const lines = content.split(this.NEWLINE);
    const headers = this.parseHeaders(lines[0]);
    const entries: Entry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const entry = this.parseLine(line, headers);
        if (entry) {
          entries.push(entry);
        }
      }
    }

    return entries;
  }

  async stringify(entries: Entry[]): Promise<string> {
    const headers = this.REQUIRED_HEADERS.join(this.DELIMITER);
    const rows = entries.map(entry => 
      this.escapeCSV(entry.acronym) + this.DELIMITER + this.escapeCSV(entry.definition)
    );
    
    return [headers, ...rows].join(this.NEWLINE);
  }

  validate(content: string): boolean {
    if (!content.trim()) {
      return false;
    }

    const lines = content.split(this.NEWLINE);
    if (lines.length < 1) {
      return false;
    }

    const headers = this.parseHeaders(lines[0]);
    return this.REQUIRED_HEADERS.every(header => headers.includes(header));
  }

  private parseHeaders(headerLine: string): string[] {
    return headerLine
      .split(this.DELIMITER)
      .map(header => header.trim().toLowerCase());
  }

  private parseLine(line: string, headers: string[]): Entry | null {
    const values = this.splitCSVLine(line);
    if (values.length !== headers.length) {
      return null;
    }

    const data: { [key: string]: string } = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    try {
      return new Entry(data.acronym, data.definition);
    } catch {
      return null;
    }
  }

  private splitCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === this.DELIMITER && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values.map(value => this.unescapeCSV(value));
  }

  private escapeCSV(value: string): string {
    if (value.includes(this.DELIMITER) || value.includes('"') || value.includes(this.NEWLINE)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private unescapeCSV(value: string): string {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  }
}
