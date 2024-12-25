import { SecurityMiddleware } from '../../../infrastructure/security/SecurityMiddleware';
import { ISecurityService } from '../../../infrastructure/security/ISecurityService';

describe('SecurityMiddleware', () => {
  let securityMiddleware: SecurityMiddleware;
  let mockSecurityService: jest.Mocked<ISecurityService>;

  beforeEach(() => {
    // Mock the security service
    mockSecurityService = {
      encryptData: jest.fn(),
      decryptData: jest.fn(),
      validateInput: jest.fn(),
      sanitizeInput: jest.fn(),
      isOperationAllowed: jest.fn(),
      getPermissions: jest.fn(),
      checkContentSecurity: jest.fn(),
      checkOriginSecurity: jest.fn()
    };

    securityMiddleware = new SecurityMiddleware(mockSecurityService);

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'chrome-extension://abcdef'
      }
    });
  });

  describe('validateOperation', () => {
    it('should validate allowed operations', async () => {
      mockSecurityService.isOperationAllowed.mockResolvedValue(true);
      mockSecurityService.checkOriginSecurity.mockReturnValue(true);
      mockSecurityService.validateInput.mockReturnValue(true);

      const result = await securityMiddleware.validateOperation('test', 'data');
      expect(result).toBe(true);
    });

    it('should reject disallowed operations', async () => {
      mockSecurityService.isOperationAllowed.mockResolvedValue(false);
      
      const result = await securityMiddleware.validateOperation('test');
      expect(result).toBe(false);
    });

    it('should validate input data when present', async () => {
      mockSecurityService.isOperationAllowed.mockResolvedValue(true);
      mockSecurityService.checkOriginSecurity.mockReturnValue(true);
      mockSecurityService.validateInput.mockReturnValue(true);

      const result = await securityMiddleware.validateOperation('test', { field: 'value' });
      expect(result).toBe(true);
      expect(mockSecurityService.validateInput).toHaveBeenCalledWith('value');
    });
  });

  describe('processData', () => {
    beforeEach(() => {
      mockSecurityService.isOperationAllowed.mockResolvedValue(true);
      mockSecurityService.checkOriginSecurity.mockReturnValue(true);
      mockSecurityService.validateInput.mockReturnValue(true);
    });

    it('should process string data', async () => {
      const encryptionResult = { ciphertext: 'encrypted', iv: 'iv' };
      mockSecurityService.encryptData.mockResolvedValue(encryptionResult);

      const result = await securityMiddleware.processData('test', 'data');
      expect(result).toEqual(encryptionResult);
    });

    it('should process array data', async () => {
      mockSecurityService.sanitizeInput.mockImplementation(str => `sanitized_${str}`);

      const result = await securityMiddleware.processData('test', ['data1', 'data2']);
      expect(result).toEqual(['sanitized_data1', 'sanitized_data2']);
    });

    it('should process object data', async () => {
      mockSecurityService.sanitizeInput.mockImplementation(str => `sanitized_${str}`);

      const result = await securityMiddleware.processData('test', { field: 'value' });
      expect(result).toEqual({ field: 'sanitized_value' });
    });

    it('should return null on validation failure', async () => {
      mockSecurityService.isOperationAllowed.mockResolvedValue(false);

      const result = await securityMiddleware.processData('test', 'data');
      expect(result).toBeNull();
    });
  });

  describe('validateAndSanitizeInput', () => {
    it('should validate and sanitize valid input', async () => {
      mockSecurityService.validateInput.mockReturnValue(true);
      mockSecurityService.sanitizeInput.mockReturnValue('sanitized');

      const result = await securityMiddleware.validateAndSanitizeInput('input');
      expect(result).toBe('sanitized');
    });

    it('should return null for invalid input', async () => {
      mockSecurityService.validateInput.mockReturnValue(false);

      const result = await securityMiddleware.validateAndSanitizeInput('invalid');
      expect(result).toBeNull();
    });
  });

  describe('checkContentSecurity', () => {
    it('should check content security', async () => {
      mockSecurityService.checkContentSecurity.mockResolvedValue(true);

      const result = await securityMiddleware.checkContentSecurity('content');
      expect(result).toBe(true);
      expect(mockSecurityService.checkContentSecurity).toHaveBeenCalledWith('content');
    });

    it('should handle errors gracefully', async () => {
      mockSecurityService.checkContentSecurity.mockRejectedValue(new Error('test error'));

      const result = await securityMiddleware.checkContentSecurity('content');
      expect(result).toBe(false);
    });
  });
});
