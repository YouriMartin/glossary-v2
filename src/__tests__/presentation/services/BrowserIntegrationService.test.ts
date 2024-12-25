import { BrowserIntegrationService } from '../../../presentation/services/BrowserIntegrationService';
import { ISelectionService, SelectionEvent } from '../../../presentation/services/ISelectionService';
import { IPopupService } from '../../../presentation/services/IPopupService';
import { ManageEntryUseCase } from '../../../domain/usecases/ManageEntryUseCase';
import { Entry } from '../../../domain/entities/Entry';
import { IGlossaryRepository } from '../../../domain/repositories/IGlossaryRepository';

describe('BrowserIntegrationService', () => {
  let browserIntegrationService: BrowserIntegrationService;
  let mockSelectionService: jest.Mocked<ISelectionService>;
  let mockPopupService: jest.Mocked<IPopupService>;
  let mockGlossaryRepository: IGlossaryRepository;
  let mockManageEntryUseCase: ManageEntryUseCase;
  let selectionCallback: (event: SelectionEvent) => void;

  beforeEach(() => {
    // Mock chrome API
    (global as any).chrome = {
      contextMenus: {
        create: jest.fn(),
        onClicked: {
          addListener: jest.fn()
        }
      },
      runtime: {
        sendMessage: jest.fn()
      }
    };

    // Create mocks
    mockSelectionService = {
      initialize: jest.fn(),
      onSelection: jest.fn((callback) => {
        selectionCallback = callback;
      }),
      getCurrentSelection: jest.fn(),
      cleanup: jest.fn()
    };

    mockPopupService = {
      showDefinition: jest.fn(),
      hideDefinition: jest.fn(),
      isVisible: jest.fn()
    };

    mockGlossaryRepository = {
      getEntry: jest.fn(),
      saveEntry: jest.fn(),
      getAllEntries: jest.fn(),
      deleteEntry: jest.fn(),
      importFromCSV: jest.fn(),
      exportToCSV: jest.fn()
    };

    mockManageEntryUseCase = new ManageEntryUseCase(mockGlossaryRepository);

    browserIntegrationService = new BrowserIntegrationService(
      mockSelectionService,
      mockPopupService,
      mockManageEntryUseCase
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize services and setup handlers', () => {
    browserIntegrationService.initialize();

    expect(mockSelectionService.initialize).toHaveBeenCalled();
    expect(mockSelectionService.onSelection).toHaveBeenCalled();
    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: 'addToGlossary',
      title: 'Add to Glossary',
      contexts: ['selection']
    });
  });

  it('should cleanup services', () => {
    browserIntegrationService.cleanup();

    expect(mockSelectionService.cleanup).toHaveBeenCalled();
    expect(mockPopupService.hideDefinition).toHaveBeenCalled();
  });

  it('should show popup when selected text has a glossary entry', async () => {
    const mockEntry = new Entry('API', 'Application Programming Interface');
    (mockGlossaryRepository.getEntry as jest.Mock).mockResolvedValue(mockEntry);

    browserIntegrationService.initialize();
    await selectionCallback({
      text: 'API',
      position: { x: 100, y: 200 }
    });

    expect(mockGlossaryRepository.getEntry).toHaveBeenCalledWith('API');
    expect(mockPopupService.showDefinition).toHaveBeenCalledWith(
      'API',
      'Application Programming Interface',
      { x: 100, y: 200 }
    );
  });

  it('should not show popup when selected text has no glossary entry', async () => {
    (mockGlossaryRepository.getEntry as jest.Mock).mockResolvedValue(null);

    browserIntegrationService.initialize();
    await selectionCallback({
      text: 'unknown',
      position: { x: 100, y: 200 }
    });

    expect(mockGlossaryRepository.getEntry).toHaveBeenCalledWith('unknown');
    expect(mockPopupService.showDefinition).not.toHaveBeenCalled();
  });

  it('should handle context menu click', () => {
    browserIntegrationService.initialize();

    const contextMenuCallback = (chrome.contextMenus.onClicked.addListener as jest.Mock).mock.calls[0][0];
    const mockSelection = { text: 'selected text', position: { x: 0, y: 0 } };
    mockSelectionService.getCurrentSelection.mockReturnValue(mockSelection);

    contextMenuCallback({
      menuItemId: 'addToGlossary',
      selectionText: 'API'
    });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'OPEN_ADD_ENTRY',
      data: {
        text: 'API',
        context: 'selected text'
      }
    });
  });

  it('should not handle context menu click for different menu items', () => {
    browserIntegrationService.initialize();

    const contextMenuCallback = (chrome.contextMenus.onClicked.addListener as jest.Mock).mock.calls[0][0];

    contextMenuCallback({
      menuItemId: 'otherMenuItem',
      selectionText: 'API'
    });

    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
