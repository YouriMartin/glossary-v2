export interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
