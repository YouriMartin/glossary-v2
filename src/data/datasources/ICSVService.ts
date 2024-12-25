import { Entry } from '../../domain/entities/Entry';

export interface ICSVService {
  parse(content: string): Promise<Entry[]>;
  stringify(entries: Entry[]): Promise<string>;
  validate(content: string): boolean;
}
