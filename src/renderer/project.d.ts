// ─── Project file API (exposed via preload contextBridge) ───────
export interface ProjectApi {
  /** Native save dialog — returns chosen file path or null */
  saveDialog: (defaultName?: string) => Promise<string | null>
  /** Native open dialog — returns chosen file path or null */
  openDialog: () => Promise<string | null>
  /** Write text content to file path */
  saveFile: (filePath: string, content: string) => Promise<boolean>
  /** Read text content from file path */
  loadFile: (filePath: string) => Promise<string | null>
  /** Check whether a file exists at the given path */
  fileExists: (filePath: string) => Promise<boolean>
  /** Get absolute OS path from a File object (Electron webUtils) */
  getFilePath: (file: File) => string
}

declare global {
  interface Window {
    project: ProjectApi
  }
}
