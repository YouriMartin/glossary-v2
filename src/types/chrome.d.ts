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

  export interface ChromePermissions {
    permissions?: string[];
    origins?: string[];
  }

  export interface PermissionsAPI {
    getAll(callback: (permissions: ChromePermissions) => void): void;
    contains(permissions: ChromePermissions, callback: (result: boolean) => void): void;
    request(permissions: ChromePermissions, callback: (granted: boolean) => void): void;
    remove(permissions: ChromePermissions, callback?: (removed: boolean) => void): void;
    onAdded: {
      addListener(callback: (permissions: ChromePermissions) => void): void;
      removeListener(callback: (permissions: ChromePermissions) => void): void;
      hasListener(callback: (permissions: ChromePermissions) => void): boolean;
    };
    onRemoved: {
      addListener(callback: (permissions: ChromePermissions) => void): void;
      removeListener(callback: (permissions: ChromePermissions) => void): void;
      hasListener(callback: (permissions: ChromePermissions) => void): boolean;
    };
  }

  export interface Runtime {
    sendMessage(
      message: any,
      responseCallback?: (response: any) => void
    ): void;
    onMessage: {
      addListener(
        callback: (
          message: any,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: any) => void
        ) => void
      ): void;
    };
  }

  export interface MessageSender {
    id?: string;
    tab?: chrome.tabs.Tab;
    frameId?: number;
    url?: string;
    tlsChannelId?: string;
  }

  export interface Tab {
    id?: number;
    index: number;
    windowId: number;
    highlighted: boolean;
    active: boolean;
    pinned: boolean;
    url?: string;
    title?: string;
    favIconUrl?: string;
    status?: string;
    incognito: boolean;
    width?: number;
    height?: number;
    sessionId?: string;
  }

  export interface ContextMenus {
    create(
      createProperties: {
        id?: string;
        title?: string;
        contexts?: string[];
        onclick?: (info: OnClickData, tab: Tab) => void;
      },
      callback?: () => void
    ): void;
    onClicked: {
      addListener(
        callback: (info: OnClickData, tab?: Tab) => void
      ): void;
    };
  }

  export interface OnClickData {
    menuItemId: string;
    parentMenuItemId?: string;
    mediaType?: string;
    linkUrl?: string;
    srcUrl?: string;
    pageUrl?: string;
    frameUrl?: string;
    selectionText?: string;
    editable: boolean;
    wasChecked?: boolean;
    checked?: boolean;
  }

  export const runtime: Runtime;
  export const permissions: PermissionsAPI;
  export const contextMenus: ContextMenus;
}
