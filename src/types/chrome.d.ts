declare namespace chrome {
  export namespace contextMenus {
    export function create(
      createProperties: {
        id?: string;
        title?: string;
        contexts?: string[];
      },
      callback?: () => void
    ): void;

    export const onClicked: {
      addListener(callback: (info: {
        menuItemId: string;
        selectionText?: string;
      }, tab?: chrome.tabs.Tab) => void): void;
    };
  }

  export namespace runtime {
    export function sendMessage(
      message: any,
      responseCallback?: (response: any) => void
    ): void;
  }

  export namespace tabs {
    export interface Tab {
      id?: number;
      url?: string;
    }
  }
}
