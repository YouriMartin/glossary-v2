export interface SelectionEvent {
  text: string;
  position: { x: number; y: number };
}

export interface ISelectionService {
  initialize(): void;
  onSelection(callback: (event: SelectionEvent) => void): void;
  getCurrentSelection(): SelectionEvent | null;
  cleanup(): void;
}
