import { contextBridge, ipcRenderer, webUtils } from 'electron'

// ─── Browser Panel API (Multi-Tab) ─────────────────────────────
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

const browserApi = {
  // ─── Tab management ───
  createTab: (url?: string) => ipcRenderer.invoke('browser:create-tab', url) as Promise<string>,
  closeTab: (tabId: string) => ipcRenderer.invoke('browser:close-tab', tabId) as Promise<string | null>,
  switchTab: (tabId: string) => ipcRenderer.invoke('browser:switch-tab', tabId) as Promise<void>,
  getTabs: () => ipcRenderer.invoke('browser:get-tabs') as Promise<TabInfo[]>,
  getActiveTab: () => ipcRenderer.invoke('browser:get-active-tab') as Promise<string | null>,

  // ─── Navigation (per tab) ───
  navigate: (tabId: string, url: string) => ipcRenderer.invoke('browser:navigate', tabId, url) as Promise<void>,
  goBack: (tabId: string) => ipcRenderer.invoke('browser:go-back', tabId) as Promise<void>,
  goForward: (tabId: string) => ipcRenderer.invoke('browser:go-forward', tabId) as Promise<void>,
  reload: (tabId: string) => ipcRenderer.invoke('browser:reload', tabId) as Promise<void>,

  // ─── View visibility ───
  show: (bounds: BrowserBounds) => ipcRenderer.invoke('browser:show', bounds) as Promise<void>,
  hide: () => ipcRenderer.invoke('browser:hide') as Promise<void>,
  close: () => ipcRenderer.invoke('browser:close') as Promise<void>,
  setBounds: (bounds: BrowserBounds) => ipcRenderer.invoke('browser:set-bounds', bounds) as Promise<void>,
  hideTabView: (tabId: string) => ipcRenderer.invoke('browser:hide-tab-view', tabId) as Promise<void>,
  showTabView: (tabId: string) => ipcRenderer.invoke('browser:show-tab-view', tabId) as Promise<void>,

  // ─── Screenshot ───
  captureScreenshot: () => ipcRenderer.invoke('browser:capture-screenshot') as Promise<string | null>,
  saveImage: (dataUrl: string) => ipcRenderer.invoke('browser:save-image', dataUrl) as Promise<string | null>,

  // ─── Events ───
  onUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => {
    const handler = (_e: unknown, data: { tabId: string; url: string }) => callback(data)
    ipcRenderer.on('browser-url-changed', handler)
    return () => ipcRenderer.removeListener('browser-url-changed', handler)
  },
  onTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => {
    const handler = (_e: unknown, data: { tabId: string; title: string }) => callback(data)
    ipcRenderer.on('browser-title-changed', handler)
    return () => ipcRenderer.removeListener('browser-title-changed', handler)
  },
  onTabCreated: (callback: (data: { tabId: string; url: string; title: string }) => void) => {
    const handler = (_e: unknown, data: { tabId: string; url: string; title: string }) => callback(data)
    ipcRenderer.on('browser:tab-created', handler)
    return () => ipcRenderer.removeListener('browser:tab-created', handler)
  },
}

// ─── Project file API ──────────────────────────────────────────
const projectApi = {
  saveDialog: (defaultName?: string) => ipcRenderer.invoke('project:save-dialog', defaultName) as Promise<string | null>,
  openDialog: () => ipcRenderer.invoke('project:open-dialog') as Promise<string | null>,
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('project:save-file', filePath, content) as Promise<boolean>,
  loadFile: (filePath: string) => ipcRenderer.invoke('project:load-file', filePath) as Promise<string | null>,
  fileExists: (filePath: string) => ipcRenderer.invoke('project:file-exists', filePath) as Promise<boolean>,
  /** Get absolute path from a File object (Electron webUtils) */
  getFilePath: (file: File) => webUtils.getPathForFile(file),
}

// ─── GIF Recorder API ─────────────────────────────────────────
const gifApi = {
  saveDialog: (defaultName?: string) => ipcRenderer.invoke('gif:save-dialog', defaultName) as Promise<string | null>,
  saveFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('gif:save-file', filePath, data) as Promise<boolean>,
  getSource: () => ipcRenderer.invoke('gif:get-source') as Promise<string | null>,
  saveDialogWebm: (defaultName?: string) => ipcRenderer.invoke('webm:save-dialog', defaultName) as Promise<string | null>,
  /** Save binary data to OS temp dir, returns file path */
  saveTemp: (data: Uint8Array) => ipcRenderer.invoke('webm:save-temp', data) as Promise<string | null>,
  /** Merge separate video + audio WebM files into outputPath via FFmpeg */
  mergeWebm: (videoPath: string, audioPath: string, outputPath: string) => ipcRenderer.invoke('webm:merge', videoPath, audioPath, outputPath) as Promise<boolean>,
}

// ─── Expose to renderer ─────────────────────────────────────────
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('browser', browserApi)
    contextBridge.exposeInMainWorld('project', projectApi)
    contextBridge.exposeInMainWorld('gifRecorder', gifApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.browser = browserApi
}