import { ISelectionService, SelectionEvent } from './ISelectionService';

export class SelectionService implements ISelectionService {
  private selectionCallbacks: ((event: SelectionEvent) => void)[] = [];
  private lastSelection: SelectionEvent | null = null;

  initialize(): void {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }

  onSelection(callback: (event: SelectionEvent) => void): void {
    this.selectionCallbacks.push(callback);
  }

  getCurrentSelection(): SelectionEvent | null {
    return this.lastSelection;
  }

  cleanup(): void {
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }

  private handleMouseUp(event: MouseEvent): void {
    this.processSelection(event);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Only process if it's a key that could affect selection
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      this.processSelection(event);
    }
  }

  private handleSelectionChange(): void {
    // Store the current selection range for future reference
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        // Selection is not empty, store it but don't trigger callbacks
        const rect = range.getBoundingClientRect();
        this.lastSelection = {
          text: selection.toString().trim(),
          position: {
            x: rect.left + window.scrollX,
            y: rect.bottom + window.scrollY
          }
        };
      }
    }
  }

  private processSelection(event: MouseEvent | KeyboardEvent): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const rect = range.getBoundingClientRect();
    const selectionEvent: SelectionEvent = {
      text: selectedText,
      position: {
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY
      }
    };

    this.lastSelection = selectionEvent;
    this.notifyCallbacks(selectionEvent);
  }

  private notifyCallbacks(event: SelectionEvent): void {
    this.selectionCallbacks.forEach(callback => callback(event));
  }
}
