export interface IPopupService {
  showDefinition(text: string, definition: string, position: { x: number; y: number }): void;
  hideDefinition(): void;
  isVisible(): boolean;
}
