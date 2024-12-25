import { SelectionService } from '../../../presentation/services/SelectionService';
import { SelectionEvent } from '../../../presentation/services/ISelectionService';

describe('SelectionService', () => {
  let selectionService: SelectionService;
  let mockSelection: any;
  let mockRange: any;

  beforeEach(() => {
    selectionService = new SelectionService();

    // Mock selection and range
    mockRange = {
      collapsed: false,
      getBoundingClientRect: jest.fn(() => ({
        left: 100,
        bottom: 200,
        right: 300,
        top: 100
      }))
    };

    mockSelection = {
      toString: jest.fn(() => 'test selection'),
      rangeCount: 1,
      getRangeAt: jest.fn(() => mockRange)
    };

    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      value: jest.fn(() => mockSelection)
    });

    // Mock window.scrollX/Y
    Object.defineProperty(window, 'scrollX', { value: 0 });
    Object.defineProperty(window, 'scrollY', { value: 0 });

    // Initialize service
    selectionService.initialize();
  });

  afterEach(() => {
    selectionService.cleanup();
    jest.clearAllMocks();
  });

  it('should initialize event listeners', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    selectionService.initialize();
    expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
  });

  it('should register selection callbacks', () => {
    const callback = jest.fn();
    selectionService.onSelection(callback);

    // Simulate mouseup event with selection
    const mouseEvent = new MouseEvent('mouseup');
    document.dispatchEvent(mouseEvent);

    // Selection should be processed
    expect(window.getSelection).toHaveBeenCalled();
    expect(mockSelection.toString).toHaveBeenCalled();
    expect(mockSelection.getRangeAt).toHaveBeenCalled();
    expect(mockRange.getBoundingClientRect).toHaveBeenCalled();

    expect(callback).toHaveBeenCalledWith({
      text: 'test selection',
      position: { x: 100, y: 200 }
    });
  });

  it('should handle empty selection', () => {
    const callback = jest.fn();
    selectionService.onSelection(callback);

    // Mock empty selection
    mockSelection.toString.mockReturnValue('');

    const mouseEvent = new MouseEvent('mouseup');
    document.dispatchEvent(mouseEvent);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle collapsed range', () => {
    const callback = jest.fn();
    selectionService.onSelection(callback);

    // Mock collapsed range
    mockRange.collapsed = true;

    const mouseEvent = new MouseEvent('mouseup');
    document.dispatchEvent(mouseEvent);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle keyboard selection', () => {
    const callback = jest.fn();
    selectionService.onSelection(callback);

    // Simulate arrow key press
    const keyEvent = new KeyboardEvent('keyup', { key: 'ArrowRight' });
    document.dispatchEvent(keyEvent);

    // Selection should be processed
    expect(window.getSelection).toHaveBeenCalled();
    expect(mockSelection.toString).toHaveBeenCalled();
    expect(mockSelection.getRangeAt).toHaveBeenCalled();
    expect(mockRange.getBoundingClientRect).toHaveBeenCalled();

    expect(callback).toHaveBeenCalledWith({
      text: 'test selection',
      position: { x: 100, y: 200 }
    });
  });

  it('should ignore non-selection keyboard events', () => {
    const callback = jest.fn();
    selectionService.onSelection(callback);

    // Simulate non-arrow key press
    const keyEvent = new KeyboardEvent('keyup', { key: 'a' });
    document.dispatchEvent(keyEvent);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should cleanup event listeners', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    selectionService.cleanup();
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
  });

  it('should get current selection', () => {
    // Simulate selection
    const mouseEvent = new MouseEvent('mouseup');
    document.dispatchEvent(mouseEvent);

    const currentSelection = selectionService.getCurrentSelection();
    expect(currentSelection).toEqual({
      text: 'test selection',
      position: { x: 100, y: 200 }
    });
  });

  it('should handle selection change event', () => {
    const callback = jest.fn();
    selectionService.onSelection(callback);

    // Simulate selection change
    const event = new Event('selectionchange');
    document.dispatchEvent(event);

    // Selection change alone shouldn't trigger callbacks
    expect(callback).not.toHaveBeenCalled();

    // But the selection should be stored
    const currentSelection = selectionService.getCurrentSelection();
    expect(currentSelection).toEqual({
      text: 'test selection',
      position: { x: 100, y: 200 }
    });
  });
});
