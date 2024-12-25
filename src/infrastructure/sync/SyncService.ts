import { GlossaryEntry } from '../../domain/entities/GlossaryEntry';
import { SecurityMiddleware } from '../security/SecurityMiddleware';

export interface SyncOptions {
  autoSync: boolean;
  syncInterval: number;
  maxRetries: number;
}

export class SyncService {
  private syncTimer: NodeJS.Timer | null = null;
  private retryCount: number = 0;

  constructor(
    private readonly apiUrl: string,
    private readonly securityMiddleware: SecurityMiddleware,
    private readonly options: SyncOptions = {
      autoSync: true,
      syncInterval: 300000, // 5 minutes
      maxRetries: 3
    }
  ) {
    if (options.autoSync) {
      this.startAutoSync();
    }
  }

  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      try {
        await this.sync();
        this.retryCount = 0;
      } catch (error) {
        console.error('Auto sync failed:', error);
        this.retryCount++;

        if (this.retryCount >= this.options.maxRetries) {
          console.error('Max retry attempts reached. Stopping auto sync.');
          this.stopAutoSync();
        }
      }
    }, this.options.syncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async sync(): Promise<void> {
    try {
      // Récupérer les modifications locales
      const localChanges = await this.getLocalChanges();
      
      // Chiffrer les données avant l'envoi
      const encryptedChanges = await Promise.all(
        localChanges.map(entry => this.securityMiddleware.interceptSave(entry))
      );

      // Envoyer les modifications au serveur
      const response = await fetch(`${this.apiUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(encryptedChanges)
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      // Récupérer et appliquer les modifications du serveur
      const serverChanges = await response.json();
      await this.applyServerChanges(serverChanges);

    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  private async getLocalChanges(): Promise<GlossaryEntry[]> {
    // À implémenter : récupérer les modifications locales depuis le stockage
    return [];
  }

  private async applyServerChanges(changes: any[]): Promise<void> {
    try {
      // Déchiffrer les modifications du serveur
      const decryptedChanges = await Promise.all(
        changes.map(entry => this.securityMiddleware.interceptRetrieve(entry))
      );

      // À implémenter : appliquer les modifications au stockage local
      console.log('Applying server changes:', decryptedChanges);
    } catch (error) {
      console.error('Error applying server changes:', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string> {
    // À implémenter : récupérer le token d'authentification
    return 'dummy-token';
  }
}
