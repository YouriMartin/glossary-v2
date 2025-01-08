import { GlossaryEntry } from '../../domain/entities/GlossaryEntry';
import { SecurityMiddleware } from '../security/SecurityMiddleware';

export interface SyncOptions {
  autoSync: boolean;
  syncInterval: number;
  maxRetries: number;
}

const defaultSyncOptions: SyncOptions = {
  autoSync: true,
  syncInterval: 300000, // 5 minutes
  maxRetries: 3
};

export class SyncService {
  private syncTimeoutId: NodeJS.Timeout | null = null;
  private retryCount: number = 0;

  constructor(
    private readonly apiUrl: string,
    private readonly securityMiddleware: SecurityMiddleware,
    private readonly options: SyncOptions = defaultSyncOptions
  ) {
    if (this.options.autoSync) {
      this.startSync();
    }
  }

  public async startSync(): Promise<void> {
    if (this.syncTimeoutId !== null) {
      return;
    }

    const startAutoSync = async () => {
      try {
        await this.sync();
        // Réinitialiser le compteur de tentatives après un succès
        this.retryCount = 0;
        
        // Programmer la prochaine synchronisation uniquement en cas de succès
        if (this.syncTimeoutId !== null) {
          this.syncTimeoutId = setTimeout(startAutoSync, this.options.syncInterval);
        }
      } catch (error) {
        this.retryCount++;
        if (this.retryCount >= this.options.maxRetries) {
          this.stopSync();
          return;
        }
        
        // En cas d'échec, réessayer immédiatement si nous n'avons pas atteint le maximum
        if (this.syncTimeoutId !== null) {
          this.syncTimeoutId = setTimeout(startAutoSync, 0);
        }
      }
    };

    // Initialiser l'état de synchronisation
    this.syncTimeoutId = setTimeout(startAutoSync, this.options.syncInterval);
    
    // Démarrer la première synchronisation immédiatement
    await startAutoSync();
  }

  public stopSync(): void {
    if (this.syncTimeoutId !== null) {
      clearTimeout(this.syncTimeoutId);
      this.syncTimeoutId = null;
    }
    this.retryCount = 0;
  }

  public async sync(): Promise<void> {
    try {
      // Récupérer les changements locaux
      const localChanges = await this.getLocalChanges();

      // Chiffrer les données avant l'envoi
      const encryptedChanges = await Promise.all(
        localChanges.map(entry => this.securityMiddleware.interceptSave(entry))
      );

      // Envoyer les changements au serveur
      const response = await fetch(`${this.apiUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encryptedChanges)
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      // Récupérer et appliquer les changements du serveur
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

      // Log pour le débogage
      console.log('Applying server changes:', decryptedChanges);
      // À implémenter : appliquer les modifications au stockage local
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
