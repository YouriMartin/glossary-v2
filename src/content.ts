import { SelectionService } from './presentation/services/SelectionService';
import { PopupService } from './presentation/services/PopupService';
import { BrowserIntegrationService } from './presentation/services/BrowserIntegrationService';
import { ManageEntryUseCase } from './domain/usecases/ManageEntryUseCase';
import { GlossaryRepository } from './data/repositories/GlossaryRepository';
import { IndexedDBService } from './data/datasources/IndexedDBService';
import { CSVService } from './data/datasources/CSVService';

// Initialize services
const indexedDBService = new IndexedDBService();
const csvService = new CSVService();
const glossaryRepository = new GlossaryRepository(indexedDBService, csvService);
const manageEntryUseCase = new ManageEntryUseCase(glossaryRepository);

const selectionService = new SelectionService();
const popupService = new PopupService();

const browserIntegration = new BrowserIntegrationService(
  selectionService,
  popupService,
  manageEntryUseCase
);

// Start the integration
browserIntegration.initialize();

// Cleanup on unload
window.addEventListener('unload', () => {
  browserIntegration.cleanup();
});
