import { Entry } from '../../../domain/entities/Entry';

describe('Entry Entity', () => {
  it('should create an entry with acronym and definition', () => {
    const entry = new Entry('API', 'Application Programming Interface');
    expect(entry.acronym).toBe('API');
    expect(entry.definition).toBe('Application Programming Interface');
  });

  it('should throw error if acronym is empty', () => {
    expect(() => new Entry('', 'Some definition')).toThrow('Acronym cannot be empty');
  });

  it('should throw error if definition is empty', () => {
    expect(() => new Entry('API', '')).toThrow('Definition cannot be empty');
  });

  it('should store creation date', () => {
    const entry = new Entry('API', 'Application Programming Interface');
    expect(entry.createdAt).toBeInstanceOf(Date);
  });

  it('should be able to update definition', () => {
    const entry = new Entry('API', 'Application Programming Interface');
    entry.updateDefinition('Application Protocol Interface');
    expect(entry.definition).toBe('Application Protocol Interface');
    expect(entry.updatedAt).toBeInstanceOf(Date);
  });
});
