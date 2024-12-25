import { ISecurityService, EncryptionResult } from './ISecurityService';

export class SecurityService implements ISecurityService {
  private readonly ALLOWED_ORIGINS = ['chrome-extension://', 'moz-extension://'];
  private readonly ENCRYPTION_ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly ITERATION_COUNT = 100000;
  private readonly SALT_LENGTH = 16;
  private readonly IV_LENGTH = 12;
  private readonly MAX_CONTENT_SIZE = 1000000;

  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.initializeEncryptionKey();
  }

  private async initializeEncryptionKey(): Promise<void> {
    if (this.encryptionKey) return;

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('glossary-secure-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATION_COUNT,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ENCRYPTION_ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptData(data: string): Promise<EncryptionResult> {
    await this.initializeEncryptionKey();
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encodedData = new TextEncoder().encode(data);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: this.ENCRYPTION_ALGORITHM,
        iv
      },
      this.encryptionKey,
      encodedData
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  async decryptData(ciphertext: string, iv: string): Promise<string> {
    await this.initializeEncryptionKey();
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const decodedCiphertext = this.base64ToArrayBuffer(ciphertext);
    const decodedIv = this.base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ENCRYPTION_ALGORITHM,
        iv: decodedIv
      },
      this.encryptionKey,
      decodedCiphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  validateInput(input: string): boolean {
    // Vérifier la longueur
    if (input.length > 1000) return false;

    // Vérifier les caractères dangereux
    const dangerousPatterns = [
      /<script[\s\S]*?>/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+=/i,
      /\\\w+\(/i,
      /String\.fromCharCode/i,
      /<iframe/i,
      /<embed/i,
      /<object/i,
      /eval\(/i,
      /setTimeout/i,
      /setInterval/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  }

  sanitizeInput(input: string): string {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '\\': '&#x5C;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };

    return input.replace(/[&<>"'\/\\`=]/g, char => replacements[char]);
  }

  async isOperationAllowed(operation: string): Promise<boolean> {
    const permissions = await this.getPermissions();
    return permissions.includes(operation);
  }

  async getPermissions(): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.permissions.getAll((permissions) => {
        resolve(permissions.permissions || []);
      });
    });
  }

  async checkContentSecurity(content: string): Promise<boolean> {
    // Vérifier la taille du contenu
    if (content.length > this.MAX_CONTENT_SIZE) return false;

    // Vérifier le contenu pour des motifs malveillants
    const maliciousPatterns = [
      /<script[\s\S]*?>/i,
      /<iframe[\s\S]*?>/i,
      /<object[\s\S]*?>/i,
      /<embed[\s\S]*?>/i,
      /javascript:/i,
      /data:text\/html/i,
      /eval\(/i,
      /String\.fromCharCode/i,
      /setTimeout/i,
      /setInterval/i
    ];

    return !maliciousPatterns.some(pattern => pattern.test(content));
  }

  checkOriginSecurity(origin: string): boolean {
    return this.ALLOWED_ORIGINS.some(allowedOrigin => origin.startsWith(allowedOrigin));
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
