import { ISecurityService } from './ISecurityService';

export class SecurityMiddleware {
  constructor(private securityService: ISecurityService) {}

  async validateOperation(operation: string, data?: any): Promise<boolean> {
    try {
      // Vérifier les permissions
      if (!(await this.securityService.isOperationAllowed(operation))) {
        console.error(`Operation not allowed: ${operation}`);
        return false;
      }

      // Vérifier l'origine
      if (!this.securityService.checkOriginSecurity(window.location.origin)) {
        console.error('Invalid origin');
        return false;
      }

      // Valider les données si présentes
      if (data) {
        if (typeof data === 'string') {
          if (!this.securityService.validateInput(data)) {
            console.error('Invalid input data');
            return false;
          }
        } else if (typeof data === 'object') {
          // Valider récursivement les objets
          for (const key in data) {
            if (typeof data[key] === 'string' && !this.securityService.validateInput(data[key])) {
              console.error(`Invalid input data in field: ${key}`);
              return false;
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Security validation error:', error);
      return false;
    }
  }

  async processData<T>(operation: string, data: T): Promise<T | null> {
    try {
      // Valider l'opération
      if (!(await this.validateOperation(operation, data))) {
        return null;
      }

      // Traiter les données en fonction du type
      if (typeof data === 'string') {
        // Chiffrer les données sensibles
        const { ciphertext, iv } = await this.securityService.encryptData(data);
        return { ciphertext, iv } as unknown as T;
      } else if (Array.isArray(data)) {
        // Traiter les tableaux
        const processed = await Promise.all(
          data.map(async (item) => {
            if (typeof item === 'string') {
              return this.securityService.sanitizeInput(item);
            }
            return item;
          })
        );
        return processed as unknown as T;
      } else if (typeof data === 'object' && data !== null) {
        // Traiter les objets
        const processed: any = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            processed[key] = this.securityService.sanitizeInput(value);
          } else {
            processed[key] = value;
          }
        }
        return processed as T;
      }

      return data;
    } catch (error) {
      console.error('Data processing error:', error);
      return null;
    }
  }

  async validateAndSanitizeInput(input: string): Promise<string | null> {
    try {
      if (!this.securityService.validateInput(input)) {
        return null;
      }
      return this.securityService.sanitizeInput(input);
    } catch (error) {
      console.error('Input validation error:', error);
      return null;
    }
  }

  async checkContentSecurity(content: string): Promise<boolean> {
    try {
      return await this.securityService.checkContentSecurity(content);
    } catch (error) {
      console.error('Content security check error:', error);
      return false;
    }
  }
}
