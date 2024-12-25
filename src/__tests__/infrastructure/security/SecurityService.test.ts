import { SecurityService } from '../../../infrastructure/security/SecurityService';
import { mockSubtle, mockCrypto } from '../../setup';

describe('SecurityService', () => {
  let securityService: SecurityService;
  let mockCounter = 0;

  beforeEach(() => {
    securityService = new SecurityService();
    mockCounter = 0;

    // Mock chrome.permissions API
    (global as any).chrome = {
      permissions: {
        getAll: jest.fn((callback) => callback({ permissions: ['storage', 'tabs'] }))
      }
    };

    // Reset crypto mocks
    jest.clearAllMocks();

    // Setup crypto mock implementations
    mockSubtle.importKey.mockResolvedValue('mockKey');
    mockSubtle.deriveKey.mockResolvedValue('mockDerivedKey');
    mockSubtle.encrypt.mockImplementation(async (_, __, data) => {
      mockCounter++;
      return new Uint8Array([...new Uint8Array(data)].map(b => b + mockCounter));
    });
    mockSubtle.decrypt.mockImplementation(async (_, __, data) => {
      return new Uint8Array([...new Uint8Array(data)].map(b => b - mockCounter));
    });
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i + mockCounter;
      }
      return array;
    });
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = 'test data';
      const { ciphertext, iv } = await securityService.encryptData(originalData);
      
      expect(ciphertext).toBeTruthy();
      expect(iv).toBeTruthy();
      
      const decrypted = await securityService.decryptData(ciphertext, iv);
      expect(decrypted).toBe(originalData);
    });

    it('should produce different ciphertexts for same input', async () => {
      const data = 'test data';
      const result1 = await securityService.encryptData(data);
      mockCounter++; // Simulate different IV
      const result2 = await securityService.encryptData(data);
      
      expect(result1.ciphertext).not.toBe(result2.ciphertext);
      expect(result1.iv).not.toBe(result2.iv);
    });
  });

  describe('Input Validation', () => {
    it('should validate safe input', () => {
      const safeInput = 'Regular text input';
      expect(securityService.validateInput(safeInput)).toBe(true);
    });

    it('should reject dangerous input', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'onclick=alert(1)',
        'String.fromCharCode(88,83,83)',
        '<iframe src="evil.html"></iframe>',
        '<embed src="evil.swf">',
        '<object data="evil.swf"></object>',
        'eval("alert(1)")',
        'setTimeout("alert(1)", 100)',
        'setInterval("alert(1)", 100)'
      ];

      dangerousInputs.forEach(input => {
        expect(securityService.validateInput(input)).toBe(false);
      });
    });

    it('should properly sanitize input', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = securityService.sanitizeInput(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('alert(&quot;xss&quot;)');
      expect(sanitized).toContain('&lt;&#x2F;script&gt;');
    });
  });

  describe('Access Control', () => {
    it('should check operation permissions', async () => {
      expect(await securityService.isOperationAllowed('storage')).toBe(true);
      expect(await securityService.isOperationAllowed('unknown')).toBe(false);
    });

    it('should get permissions list', async () => {
      const permissions = await securityService.getPermissions();
      expect(permissions).toEqual(['storage', 'tabs']);
    });
  });

  describe('Security Checks', () => {
    it('should validate content security', async () => {
      const safeContent = 'Safe content';
      const dangerousContent = '<script>alert(1)</script>';
      
      expect(await securityService.checkContentSecurity(safeContent)).toBe(true);
      expect(await securityService.checkContentSecurity(dangerousContent)).toBe(false);
    });

    it('should check origin security', () => {
      expect(securityService.checkOriginSecurity('chrome-extension://abcdef')).toBe(true);
      expect(securityService.checkOriginSecurity('moz-extension://abcdef')).toBe(true);
      expect(securityService.checkOriginSecurity('http://malicious.com')).toBe(false);
    });

    it('should reject oversized content', async () => {
      const largeContent = 'a'.repeat(1000001);
      expect(await securityService.checkContentSecurity(largeContent)).toBe(false);
    });
  });
});
