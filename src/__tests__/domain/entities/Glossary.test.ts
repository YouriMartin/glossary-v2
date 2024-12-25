import { Glossary } from '../../../domain/entities/Glossary';
import { Entry } from '../../../domain/entities/Entry';

describe('Glossary Entity', () => {
  let glossary: Glossary;

  beforeEach(() => {
    glossary = new Glossary();
  });

  it('should start with an empty entries list', () => {
    expect(glossary.entries.length).toBe(0);
  });

  it('should add new entry', () => {
    const entry = new Entry('API', 'Application Programming Interface');
    glossary.addEntry(entry);
    expect(glossary.entries.length).toBe(1);
    expect(glossary.entries[0]).toBe(entry);
  });

  it('should not add duplicate acronyms', () => {
    const entry1 = new Entry('API', 'Application Programming Interface');
    const entry2 = new Entry('API', 'Another Programming Interface');
    
    glossary.addEntry(entry1);
    expect(() => glossary.addEntry(entry2)).toThrow('Acronym already exists');
  });

  it('should find entry by acronym', () => {
    const entry = new Entry('API', 'Application Programming Interface');
    glossary.addEntry(entry);
    
    const found = glossary.findByAcronym('API');
    expect(found).toBe(entry);
  });

  it('should return null when acronym not found', () => {
    const found = glossary.findByAcronym('NOT_EXISTS');
    expect(found).toBeNull();
  });

  it('should remove entry by acronym', () => {
    const entry = new Entry('API', 'Application Programming Interface');
    glossary.addEntry(entry);
    
    glossary.removeEntry('API');
    expect(glossary.entries.length).toBe(0);
  });

  it('should throw when removing non-existent acronym', () => {
    expect(() => glossary.removeEntry('NOT_EXISTS')).toThrow('Acronym not found');
  });
});
