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

// ─── GIF Recorder API (exposed via preload contextBridge) ───────
export interface GifRecorderApi {
  /** Native save dialog for GIF — returns chosen file path or null */
  saveDialog: (defaultName?: string) => Promise<string | null>
  /** Write binary GIF data to file path */
  saveFile: (filePath: string, data: Uint8Array) => Promise<boolean>
  /** Get desktopCapturer window source ID for screen capture */
  getSource: () => Promise<string | null>
  /** Native save dialog for WebM — returns chosen file path or null */
  saveDialogWebm: (defaultName?: string) => Promise<string | null>
  /** Save binary data to OS temp dir, returns file path */
  saveTemp: (data: Uint8Array) => Promise<string | null>
  /** Merge separate video + audio WebM files into outputPath via FFmpeg */
  mergeWebm: (videoPath: string, audioPath: string, outputPath: string) => Promise<boolean>
}

declare global {
  interface Window {
    project: ProjectApi
    gifRecorder: GifRecorderApi
  }
}
