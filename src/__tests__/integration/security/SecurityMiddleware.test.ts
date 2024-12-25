import { SecurityService } from '../../../infrastructure/security/SecurityService';
import { GlossaryRepository } from '../../../data/repository/GlossaryRepository';
import { SecurityMiddleware } from '../../../infrastructure/security/SecurityMiddleware';

describe('Security Middleware Integration Tests', () => {
  let securityService: SecurityService;
  let glossaryRepository: GlossaryRepository;
  let securityMiddleware: SecurityMiddleware;

  beforeEach(() => {
    securityService = new SecurityService();
    glossaryRepository = new GlossaryRepository();
    securityMiddleware = new SecurityMiddleware(securityService);
  });

  describe('Data Protection Flow', () => {
    it('should protect data through the entire flow', async () => {
      const testEntry = {
        term: 'test term',
        definition: 'test definition',
        category: 'test'
      };

      // Test middleware interception
      const protectedEntry = await securityMiddleware.interceptSave(testEntry);
      expect(protectedEntry).toBeDefined();
      expect(typeof protectedEntry.definition).toBe('string');
      expect(protectedEntry.definition).not.toBe(testEntry.definition);

      // Test storage and retrieval
      await glossaryRepository.saveEntry(protectedEntry);
      const retrievedEntry = await glossaryRepository.getEntry(protectedEntry.term);
      
      // Test middleware decryption
      const decryptedEntry = await securityMiddleware.interceptRetrieve(retrievedEntry);
      expect(decryptedEntry.definition).toBe(testEntry.definition);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        term: `term${i}`,
        definition: `definition${i}`,
        category: 'test'
      }));

      const startTime = Date.now();
      
      // Process all entries through middleware
      const protectedEntries = await Promise.all(
        entries.map(entry => securityMiddleware.interceptSave(entry))
      );

      // Save all entries
      await Promise.all(
        protectedEntries.map(entry => glossaryRepository.saveEntry(entry))
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Ensure processing time is reasonable (less than 2 seconds for 100 entries)
      expect(processingTime).toBeLessThan(2000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidEntry = {
        term: 'test',
        definition: '<script>alert("xss")</script>',
        category: 'test'
      };

      await expect(securityMiddleware.interceptSave(invalidEntry))
        .rejects
        .toThrow('Invalid content detected');
    });

    it('should handle decryption failures appropriately', async () => {
      const entry = {
        term: 'test',
        definition: 'corrupted_encrypted_data',
        category: 'test'
      };

      await expect(securityMiddleware.interceptRetrieve(entry))
        .rejects
        .toThrow('Decryption failed');
    });
  });

  describe('Permission Checks', () => {
    it('should enforce permission requirements', async () => {
      // Mock missing permissions
      jest.spyOn(securityService, 'getPermissions')
        .mockResolvedValueOnce([]);

      const entry = {
        term: 'test',
        definition: 'test',
        category: 'test'
      };

      await expect(securityMiddleware.interceptSave(entry))
        .rejects
        .toThrow('Insufficient permissions');
    });
  });
});
