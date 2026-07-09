import { app, BrowserWindow, ipcMain, WebContentsView, dialog, desktopCapturer } from 'electron'
import { join } from 'path'
import { writeFileSync, readFileSync, existsSync } from 'fs'

let mainWindow: BrowserWindow | null = null

// ─── Multi-Tab Browser (WebContentsView) ───────────────────────
interface BrowserTab {
  id: string
  view: WebContentsView
  url: string
  title: string
}

const tabs = new Map<string, BrowserTab>()
let activeTabId: string | null = null
let browserBounds: { x: number; y: number; width: number; height: number } = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createTab(url?: string): string {
  if (!mainWindow) return ''

  const id = generateTabId()
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  })

  // ─── Intercept new-window / target="_blank" → open as NEW TAB ───
  view.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    // Create a new tab instead of opening a popup or navigating in same tab
    const newTabId = createTab(targetUrl)
    switchTab(newTabId)
    // Notify renderer about the new tab
    mainWindow?.webContents.send('browser:tab-created', {
      tabId: newTabId,
      url: targetUrl,
      title: 'New Tab',
    })
    return { action: 'deny' }
  })

  // ─── Forward URL changes to renderer with tabId ───
  view.webContents.on('did-navigate', (_e, url) => {
    tabs.get(id)!.url = url
    mainWindow?.webContents.send('browser-url-changed', { tabId: id, url })
  })
  view.webContents.on('did-navigate-in-page', (_e, url) => {
    tabs.get(id)!.url = url
    mainWindow?.webContents.send('browser-url-changed', { tabId: id, url })
  })
  view.webContents.on('page-title-updated', (_e, title) => {
    tabs.get(id)!.title = title
    mainWindow?.webContents.send('browser-title-changed', { tabId: id, title })
  })

  mainWindow.contentView.addChildView(view)
  view.setBounds(browserBounds)
  view.setVisible(false) // hidden until switched to

  tabs.set(id, { id, view, url: url || '', title: 'New Tab' })

  if (url) {
    view.webContents.loadURL(url)
  }

  return id
}

function switchTab(tabId: string) {
  // Hide all tabs, show only the target
  for (const [id, tab] of tabs) {
    tab.view.setVisible(id === tabId)
  }
  activeTabId = tabId
}

function closeTab(tabId: string) {
  const tab = tabs.get(tabId)
  if (!tab) return

  // Stop any in-flight navigation & close page gracefully
  try {
    if (tab.view.webContents && !tab.view.webContents.isDestroyed()) {
      tab.view.webContents.stop()
      tab.view.webContents.close()
    }
  } catch {
    // Already destroyed
  }

  try {
    mainWindow?.contentView.removeChildView(tab.view)
  } catch {
    // View may already be removed (window closing)
  }

  tabs.delete(tabId)

  if (activeTabId === tabId) {
    const remaining = Array.from(tabs.keys())
    if (remaining.length > 0) {
      switchTab(remaining[0])
    } else {
      activeTabId = null
    }
  }
}

function setBrowserBounds(bounds: { x: number; y: number; width: number; height: number }) {
  browserBounds = bounds
  for (const tab of tabs.values()) {
    tab.view.setBounds(bounds)
  }
}

function showBrowser() {
  if (activeTabId) {
    const tab = tabs.get(activeTabId)
    if (tab) tab.view.setVisible(true)
  }
}

function hideBrowser() {
  for (const tab of tabs.values()) {
    tab.view.setVisible(false)
  }
}

function hideTabView(tabId: string) {
  const tab = tabs.get(tabId)
  if (tab) tab.view.setVisible(false)
}

function showTabView(tabId: string) {
  // Hide all others, show only target (same as switchTab but without changing activeTabId)
  for (const [id, t] of tabs) {
    t.view.setVisible(id === tabId)
  }
}

function closeAllTabs() {
  for (const tabId of Array.from(tabs.keys())) {
    closeTab(tabId)
  }
}

// ─── IPC Handlers ──────────────────────────────────────────────
function registerIpc() {
  ipcMain.handle('browser:create-tab', (_e, url?: string) => {
    const tabId = createTab(url)
    switchTab(tabId)
    return tabId
  })

  ipcMain.handle('browser:close-tab', (_e, tabId: string) => {
    if (tabs.has(tabId)) closeTab(tabId)
    return activeTabId
  })

  ipcMain.handle('browser:switch-tab', (_e, tabId: string) => {
    switchTab(tabId)
  })

  ipcMain.handle('browser:navigate', (_e, tabId: string, url: string) => {
    const tab = tabs.get(tabId)
    if (tab) {
      tab.view.webContents.loadURL(url)
    }
  })

  ipcMain.handle('browser:show', (_e, bounds: { x: number; y: number; width: number; height: number }) => {
    setBrowserBounds(bounds)
    showBrowser()
  })

  ipcMain.handle('browser:hide', () => {
    hideBrowser()
  })

  ipcMain.handle('browser:close', () => {
    closeAllTabs()
  })

  ipcMain.handle('browser:set-bounds', (_e, bounds: { x: number; y: number; width: number; height: number }) => {
    setBrowserBounds(bounds)
  })

  ipcMain.handle('browser:go-back', (_e, tabId: string) => {
    tabs.get(tabId)?.view.webContents.goBack()
  })

  ipcMain.handle('browser:go-forward', (_e, tabId: string) => {
    tabs.get(tabId)?.view.webContents.goForward()
  })

  ipcMain.handle('browser:reload', (_e, tabId: string) => {
    tabs.get(tabId)?.view.webContents.reload()
  })

  ipcMain.handle('browser:get-tabs', () => {
    return Array.from(tabs.values()).map((t) => ({ id: t.id, url: t.url, title: t.title }))
  })

  ipcMain.handle('browser:get-active-tab', () => activeTabId)

  // ─── Screenshot capture ───
  ipcMain.handle('browser:capture-screenshot', async () => {
    if (!activeTabId) return null
    const tab = tabs.get(activeTabId)
    if (!tab) return null
    const image = await tab.view.webContents.capturePage()
    return image.toDataURL()
  })

  // ─── Save image via native save dialog ───
  ipcMain.handle('browser:save-image', async (_e, dataUrl: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Screenshot',
      defaultPath: `screenshot-${Date.now()}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    })
    if (result.canceled || !result.filePath) return null
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    writeFileSync(result.filePath, Buffer.from(base64, 'base64'))
    return result.filePath
  })

  ipcMain.handle('browser:hide-tab-view', (_e, tabId: string) => {
    hideTabView(tabId)
  })

  ipcMain.handle('browser:show-tab-view', (_e, tabId: string) => {
    showTabView(tabId)
  })

  // ─── Project file: save/open dialogs + file read/write ───
  ipcMain.handle('project:save-dialog', async (_e, defaultName?: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Project',
      defaultPath: defaultName || 'project.donis',
      filters: [{ name: 'Donis Project', extensions: ['donis'] }],
    })
    return result.canceled ? null : result.filePath
  })

  ipcMain.handle('project:open-dialog', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Project',
      filters: [{ name: 'Donis Project', extensions: ['donis'] }],
      properties: ['openFile'],
    })
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain.handle('project:save-file', (_e, filePath: string, content: string) => {
    try {
      writeFileSync(filePath, content, 'utf-8')
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('project:load-file', (_e, filePath: string) => {
    try {
      if (!existsSync(filePath)) return null
      return readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  })

  ipcMain.handle('project:file-exists', (_e, filePath: string) => {
    try {
      return existsSync(filePath)
    } catch {
      return false
    }
  })

  // ─── GIF save dialog ───
  ipcMain.handle('gif:save-dialog', async (_e, defaultName?: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save GIF Recording',
      defaultPath: defaultName || `gameplay-${Date.now()}.gif`,
      filters: [{ name: 'Animated GIF', extensions: ['gif'] }],
    })
    return result.canceled ? null : result.filePath
  })

  ipcMain.handle('gif:save-file', (_e, filePath: string, data: Uint8Array) => {
    try {
      writeFileSync(filePath, data)
      return true
    } catch {
      return false
    }
  })

  // ─── WebM save dialog ───
  ipcMain.handle('webm:save-dialog', async (_e, defaultName?: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save WebM Recording',
      defaultPath: defaultName || `gameplay-${Date.now()}.webm`,
      filters: [{ name: 'WebM Video', extensions: ['webm'] }],
    })
    return result.canceled ? null : result.filePath
  })

  // ─── Save temp file in OS temp dir, returns path ───
  ipcMain.handle('webm:save-temp', (_e, data: Uint8Array) => {
    try {
      const path = join(app.getPath('temp'), `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webm`)
      writeFileSync(path, data)
      console.log('[webm:save-temp] saved to', path)
      return path
    } catch (err) {
      console.error('[webm:save-temp] error:', err)
      return null
    }
  })

  // ─── FFmpeg merge: combine separate video + audio WebM → outputPath ───
  ipcMain.handle('webm:merge', async (_e, videoPath: string, audioPath: string, outputPath: string) => {
    try {
      const fs = require('fs')

      // Find ffmpeg: check common locations first, fallback to shell PATH
      let ffmpegCmd = 'ffmpeg'
      const candidates = [
        join(__dirname, '../ffmpeg.exe'),
        join(__dirname, '../../ffmpeg.exe'),
        join(process.resourcesPath || '', 'ffmpeg.exe'),
      ]
      for (const c of candidates) {
        try { if (require('fs').existsSync(c)) { ffmpegCmd = c; break } } catch {}
      }
      console.log('[ffmpeg] using:', ffmpegCmd)

      return await new Promise<boolean>((resolve) => {
        // Use exec (shell) so PATH is resolved from user's environment
        const { exec } = require('child_process')
        const cmdStr = `"${ffmpegCmd}" -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a libopus -map 0:v:0 -map 1:a:0 -fflags +genpts -async 1 -vsync 1 -shortest -y "${outputPath}"`

        exec(cmdStr, { timeout: 120_000 }, (err: Error | null) => {
          if (err) {
            console.error('[webm:merge] ffmpeg error:', err.message)
            resolve(false)
          } else {
            console.log('[webm:merge] done →', outputPath)
            resolve(true)
          }
          // Cleanup temp input files
          try { fs.unlinkSync(videoPath) } catch {}
          try { fs.unlinkSync(audioPath) } catch {}
        })
      })
    } catch (err) {
      console.error('[webm:merge] error:', err)
      return false
    }
  })

  // ─── desktopCapturer: get window source ID for screen capture ───
  ipcMain.handle('gif:get-source', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 1, height: 1 }, // minimal thumbnail
        fetchWindowIcons: false,
      })
      // Find our own window by title
      const ourWindow = sources.find((s) => s.name === mainWindow?.getTitle()) || sources[0]
      return ourWindow?.id || null
    } catch (err) {
      console.error('[gif:get-source] error:', err)
      return null
    }
  })
}

// ─── Window Creation ───────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Donis Outdoor',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false, // ← allow file:// access from http:// (dev) for video playback
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    closeAllTabs()
    mainWindow = null
  })

  // Dev vs production
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeAllTabs()
  if (process.platform !== 'darwin') app.quit()
})