// ─── Browser Panel API (Multi-Tab, exposed via preload contextBridge) ─────
export interface BrowserBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface TabInfo {
  id: string
  url: string
  title: string
}

export interface BrowserApi {
  // ─── Tab management ───
  createTab: (url?: string) => Promise<string>
  closeTab: (tabId: string) => Promise<string | null>
  switchTab: (tabId: string) => Promise<void>
  getTabs: () => Promise<TabInfo[]>
  getActiveTab: () => Promise<string | null>

  // ─── Navigation (per tab) ───
  navigate: (tabId: string, url: string) => Promise<void>
  goBack: (tabId: string) => Promise<void>
  goForward: (tabId: string) => Promise<void>
  reload: (tabId: string) => Promise<void>

  // ─── View visibility ───
  show: (bounds: BrowserBounds) => Promise<void>
  hide: () => Promise<void>
  close: () => Promise<void>
  setBounds: (bounds: BrowserBounds) => Promise<void>
  hideTabView: (tabId: string) => Promise<void>
  showTabView: (tabId: string) => Promise<void>

  // ─── Screenshot ───
  captureScreenshot: () => Promise<string | null>
  saveImage: (dataUrl: string) => Promise<string | null>

  // ─── Events ───
  onUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => () => void
  onTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => () => void
  onTabCreated: (callback: (data: { tabId: string; url: string; title: string }) => void) => () => void
}

declare global {
  interface Window {
    browser: BrowserApi
  }
}