import { PopupService } from '../../../presentation/services/PopupService';

describe('PopupService', () => {
  let popupService: PopupService;

  beforeEach(() => {
    document.body.innerHTML = '';
    popupService = new PopupService();
  });

  it('should create popup element on initialization', () => {
    const popup = document.querySelector('.glossary-popup') as HTMLElement;
    expect(popup).toBeTruthy();
    expect(popup?.style.display).toBe('none');
  });

  describe('showDefinition', () => {
    it('should display popup with correct content', () => {
      const text = 'API';
      const definition = 'Application Programming Interface';
      const position = { x: 100, y: 100 };

      popupService.showDefinition(text, definition, position);

      const popup = document.querySelector('.glossary-popup') as HTMLElement;
      expect(popup?.style.display).toBe('block');
      expect(popup?.innerHTML).toContain(text);
      expect(popup?.innerHTML).toContain(definition);
    });

    it('should escape HTML in content', () => {
      const text = '<script>alert("xss")</script>';
      const definition = '<img src="x" onerror="alert(1)">';
      
      popupService.showDefinition(text, definition, { x: 0, y: 0 });

      const popup = document.querySelector('.glossary-popup') as HTMLElement;
      const content = popup?.innerHTML || '';
      
      expect(content).not.toContain('<script>');
      expect(content).not.toContain('<img');
    });

    it('should position popup within viewport bounds', () => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });

      const position = { x: 1000, y: 750 };
      popupService.showDefinition('Test', 'Definition', position);

      const popup = document.querySelector('.glossary-popup') as HTMLElement;
      const rect = popup?.getBoundingClientRect();

      expect(rect?.right).toBeLessThanOrEqual(1024);
      expect(rect?.bottom).toBeLessThanOrEqual(768);
    });
  });

  describe('hideDefinition', () => {
    it('should hide the popup', () => {
      popupService.showDefinition('Test', 'Definition', { x: 0, y: 0 });
      popupService.hideDefinition();

      const popup = document.querySelector('.glossary-popup') as HTMLElement;
      expect(popup?.style.display).toBe('none');
    });
  });

  describe('isVisible', () => {
    it('should return true when popup is visible', () => {
      popupService.showDefinition('Test', 'Definition', { x: 0, y: 0 });
      expect(popupService.isVisible()).toBe(true);
    });

    it('should return false when popup is hidden', () => {
      popupService.hideDefinition();
      expect(popupService.isVisible()).toBe(false);
    });
  });

  describe('click outside behavior', () => {
    it('should hide popup when clicking outside', () => {
      popupService.showDefinition('Test', 'Definition', { x: 0, y: 0 });
      
      document.body.click();
      
      expect(popupService.isVisible()).toBe(false);
    });

    it('should not hide popup when clicking inside', () => {
      popupService.showDefinition('Test', 'Definition', { x: 0, y: 0 });
      
      const popup = document.querySelector('.glossary-popup') as HTMLElement;
      popup?.click();
      
      expect(popupService.isVisible()).toBe(true);
    });
  });
});
