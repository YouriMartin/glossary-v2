import { IPopupService } from './IPopupService';

export class PopupService implements IPopupService {
  private popup: HTMLElement | null = null;
  private readonly POPUP_CLASS = 'glossary-popup';
  private readonly OFFSET = 10;

  constructor() {
    this.createPopupElement();
  }

  private createPopupElement(): void {
    if (this.popup) return;

    this.popup = document.createElement('div');
    this.popup.className = this.POPUP_CLASS;
    this.popup.style.display = 'none';
    document.body.appendChild(this.popup);

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
      if (this.popup && !this.popup.contains(e.target as Node)) {
        this.hideDefinition();
      }
    });
  }

  showDefinition(text: string, definition: string, position: { x: number; y: number }): void {
    if (!this.popup) {
      this.createPopupElement();
    }

    const content = `
      <div class="glossary-popup-content">
        <div class="glossary-popup-header">
          <span class="glossary-popup-term">${this.escapeHtml(text)}</span>
          <button class="glossary-popup-close">&times;</button>
        </div>
        <div class="glossary-popup-definition">
          ${this.escapeHtml(definition)}
        </div>
      </div>
    `;

    if (this.popup) {
      this.popup.innerHTML = content;
      this.popup.style.display = 'block';
      this.positionPopup(position);

      const closeButton = this.popup.querySelector('.glossary-popup-close');
      if (closeButton) {
        closeButton.addEventListener('click', () => this.hideDefinition());
      }
    }
  }

  hideDefinition(): void {
    if (this.popup) {
      this.popup.style.display = 'none';
    }
  }

  isVisible(): boolean {
    return this.popup?.style.display === 'block';
  }

  private positionPopup(position: { x: number; y: number }): void {
    if (!this.popup) return;

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const popupRect = this.popup.getBoundingClientRect();

    // Calculate position
    let left = position.x + this.OFFSET;
    let top = position.y + this.OFFSET;

    // Adjust if popup would go off screen
    if (left + popupRect.width > viewport.width) {
      left = position.x - popupRect.width - this.OFFSET;
    }
    if (top + popupRect.height > viewport.height) {
      top = position.y - popupRect.height - this.OFFSET;
    }

    // Ensure popup stays within viewport
    left = Math.max(0, Math.min(left, viewport.width - popupRect.width));
    top = Math.max(0, Math.min(top, viewport.height - popupRect.height));

    this.popup.style.left = `${left}px`;
    this.popup.style.top = `${top}px`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
