import { ISelectionService } from './ISelectionService';
import { IPopupService } from './IPopupService';
import { ManageEntryUseCase } from '../../domain/usecases/ManageEntryUseCase';

export class BrowserIntegrationService {
  constructor(
    private selectionService: ISelectionService,
    private popupService: IPopupService,
    private manageEntryUseCase: ManageEntryUseCase
  ) {}

  initialize(): void {
    this.selectionService.initialize();
    this.setupSelectionHandler();
    this.setupContextMenu();
  }

  cleanup(): void {
    this.selectionService.cleanup();
    this.popupService.hideDefinition();
  }

  private setupSelectionHandler(): void {
    this.selectionService.onSelection(async (event) => {
      const entry = await this.manageEntryUseCase.getEntry(event.text);
      if (entry) {
        this.popupService.showDefinition(entry.acronym, entry.definition, event.position);
      }
    });
  }

  private setupContextMenu(): void {
    chrome.contextMenus.create({
      id: 'addToGlossary',
      title: 'Add to Glossary',
      contexts: ['selection']
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === 'addToGlossary' && info.selectionText) {
        const selection = this.selectionService.getCurrentSelection();
        if (selection) {
          // Ouvrir le popup d'ajout d'entrée
          chrome.runtime.sendMessage({
            type: 'OPEN_ADD_ENTRY',
            data: {
              text: info.selectionText,
              context: selection.text
            }
          });
        }
      }
    });
  }
}
