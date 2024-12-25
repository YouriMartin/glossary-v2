export interface EncryptionResult {
  ciphertext: string;
  iv: string;
}

export interface ISecurityService {
  // Encryption/Decryption
  encryptData(data: string): Promise<EncryptionResult>;
  decryptData(ciphertext: string, iv: string): Promise<string>;

  // Input Validation
  validateInput(input: string): boolean;
  sanitizeInput(input: string): string;

  // Access Control
  isOperationAllowed(operation: string): Promise<boolean>;
  getPermissions(): Promise<string[]>;

  // Security Checks
  checkContentSecurity(content: string): Promise<boolean>;
  checkOriginSecurity(origin: string): boolean;
}
