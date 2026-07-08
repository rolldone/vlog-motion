# Implemented Features — Checklist

## ✅ Phase 1: Data Types & Foundation
- [x] `WalkingPoint` type — `{ id, lineId, x, y }`
- [x] `actorState` field on Checkpoint — `'idle' | 'stop' | 'finish'` (default: `'finish'`)
- [x] `actorAssets` — 4 slots (idle, walking, stop, finish) in actor settings
- [x] `selectedCheckpointId` state — track active checkpoint

## ✅ Phase 2: Walking Points Editor
- [x] Add walking point — "🚶 Add walking" button in LineActionMenu
- [x] Drag walking point — snap/project to nearest line segment
- [x] Delete walking point — 🗑 button per item in LineActionMenu + LineBodyPopup
- [x] Visual — purple dashed circle in editor, invisible in play mode
- [x] Auto-order — walking points sorted by position along line segment
- [x] Integrated into `buildLineGraph()` — BFS pathfinding includes WPs

## ✅ Phase 3: Actor Animation Assets
- [x] Tab "Animation" in ActorSettingsModal
- [x] 4 upload slots (idle, walking, stop, finish) with preview
- [x] Auto-discover assets from `assets/actors/`
- [x] Support GIF animated, PNG, WebP (transparent)

## ✅ Phase 4: Data Panel 3-Dot Menu
- [x] 3-dot button (⋮) per checkpoint in DataPanel
- [x] Dropdown — Select, Edit Label, 🎨 Icon, Delete
- [x] Select action — set `selectedCheckpointId`, highlight on map
- [x] Click outside — close dropdown

## ✅ Phase 5: Keyboard & Selection
- [x] `selectedCheckpointId` visual — outline/glow on selected checkpoint
- [x] Keyboard listener — Space/Enter trigger advance
- [x] Guard — only trigger when selectedCheckpointId exists

## ✅ Phase 6: Animation Engine
- [x] `actorState` machine — idle → walking → stop → finish
- [x] BFS path calculation — full path through walking points
- [x] Sequential movement — 1 walking point per SPACE press
- [x] Image switching — auto-change sprite per state
- [x] Pause at walking points — store remaining in `pendingMovementRef`
- [x] Continue movement — SPACE resumes from pause
- [x] Smooth animation — `@motionone/dom`

## ⚠️ Phase 7: Checkpoint Actor State
- [x] `actorState` property in Checkpoint type
- [ ] **UI dropdown in CheckpointModal** — NOT YET (always defaults to 'finish')
- [ ] **Actor sprite changes on arrival** based on checkpoint actorState

## ✅ Phase 8: UI & Infrastructure
- [x] Line styling (color, dash, width, opacity, glow)
- [x] Checkpoint styling (icon, shape, size, border)
- [x] Zoom controls (Ctrl+wheel, +/−, 25%–300%)
- [x] Pan/hand tool
- [x] Fullscreen mode
- [x] Save JSON download
- [x] Load from registered data
- [x] Walking points in both LineActionMenu + LineBodyPopup
- [x] Zero TypeScript errors

## 🔄 Walking Point Pause Mechanism
- `pendingMovementRef` stores `{ remainingPath, target, targetId }`
- `moveActorTo()` finds first WP in BFS path → animates → pauses
- `continueMovement()` reads remaining path → next WP → pauses again
- SPACE handler checks `pendingMovementRef` first → continue or start new

## 🔄 Drag-vs-Click Conflict
- `isDraggingWpRef` flag — set true on first mousemove during WP drag
- Checked in `openLinePoint` — if true, reset + return (prevents modal open)

---

## ✅ Gameplay Dashboard — Interactive Video Dashboard

### GamePlay1Page (`src/projects/gameplay/gameplay-1/`)
- [x] Fullscreen dashboard mode (Esc to exit)
- [x] GameHUD menu bar — Inventory, Map, Browser
- [x] Panel toggle (click again to close)
- [x] Dark theme (bg-black, orange accent)

### Panels
- [x] **InventoryPanel** — 8-slot grid with emoji items (placeholder)
- [x] **MapPanel** — Placeholder (aspect-video box)
- [x] **BrowserPanel** — URL bar + bookmarks + floating window browser

### Browser — Electron WebContentsView Approach (v3, current ✅)
- [x] `electron.vite.config.ts` — unified config for main/preload/renderer
- [x] `src/main/index.ts` — Electron main process with WebContentsView
- [x] WebContentsView — native browser rendering in main process (60fps)
- [x] `addChildView`/`removeChildView` — attach/detach browser view to window
- [x] IPC handlers — browser:navigate, browser:show, browser:hide, browser:close,
      browser:set-bounds, browser:go-back, browser:go-forward, browser:reload
- [x] URL change forwarding — `did-navigate` → `browser-url-changed` event to renderer
- [x] `src/preload/index.ts` — contextBridge exposes `window.browser` API
- [x] BrowserPanel.tsx — uses `window.browser` IPC API (navigate, show, hide, close, setBounds)
- [x] FloatingWindow.tsx — draggable/resizable window chrome, transparent content area
- [x] Bookmarks: Bing, Bing Maps, Wikipedia, YouTube, Reddit
- [x] **Advantage**: Native rendering, full interactivity, no latency

### Removed (Superseded)
- ~~Proxy iframe approach~~ — `proxyPlugin` removed
- ~~Headless Puppeteer streaming~~ — `browserStreamPlugin.ts` deleted

---

## ✅ Project File Save/Load (.donis files)

### Project Manager (`src/renderer/projects/gameplay/gameplay-1/components/ProjectManager.tsx`)
- [x] Save project → native save dialog → `.donis` JSON file
- [x] Load project → native open dialog → parse JSON → restore state
- [x] Save As — save to new file path
- [x] Recent files list (max 10) — stored in localStorage `project-recent-files`
- [x] Modified indicator — `isModifiedRef` tracks unsaved changes
- [x] Project name + file path persisted to localStorage

### Project File Schema (`types.ts` → `ProjectFile`)
- [x] `version: 1` — format version for backward compatibility
- [x] `name`, `savedAt`, `createdAt` — metadata
- [x] **Video**: `videoPath`, `videoName`, `videoSize`, `videoTime`, `isPlaying`
- [x] **Inventory**: `items`, `history`, `checkedIds`, `customOrder`, `sortMode`, `bgColor`
- [x] **Cost**: `total`, `history`, `bgColor`
- [x] **Gallery**: `images[]`, `checkedIds`, `bgColor`

### State Persistence (`projectManager.ts`)
- [x] `collectProjectState()` — read all state from localStorage → ProjectFile
- [x] `restoreProjectState()` — write ProjectFile → localStorage
- [x] `getRecentFiles()`, `addRecentFile()`, `removeRecentFile()`, `clearRecentFiles()`

---

## ✅ Video File Persistence

### VideoSelector (`src/renderer/projects/gameplay/gameplay-1/components/VideoSelector.tsx`)
- [x] File picker — select .mp4 from disk
- [x] Preview video player
- [x] Shows file name + size
- [x] Fallback props — display video info after reload (when File object is null)
- [x] `fallbackName`, `fallbackSize`, `fallbackUrl` props from parent

### Auto-load Video on Project Open
- [x] Save `project-video-path` to localStorage via `webUtils.getPathForFile()`
- [x] On mount/reload: read path → `window.project.fileExists()` → set `file://` URL
- [x] Missing file warning banner — if file not found at saved path
- [x] `webSecurity: false` in BrowserWindow — allows `file://` from `http://localhost` dev server
- [x] Video plays correctly after reload in fullscreen mode

### Electron 43 Compatibility
- [x] `File.path` removed in Electron 43 → use `webUtils.getPathForFile(file)`
- [x] Exposed via preload: `window.project.getFilePath(file)`

---

## ✅ Inventory Sort Mode Persistence
- [x] `sortMode` saved to localStorage (`inventory-sort-mode`)
- [x] Included in ProjectFile schema (`inventory.sortMode`)
- [x] Restored on project load

---

## ✅ Gallery Custom Image Upload

### GallerySelector (`src/renderer/projects/gallery/gallery-1/components/GallerySelector.tsx`)
- [x] Multi-image file picker — select JPG/PNG/GIF/WebP from disk
- [x] List view with checkboxes — toggle visible/hidden per image
- [x] Reorder buttons (↑↓) — custom sort order
- [x] Remove button (✕) — delete custom image
- [x] Auto-check new images on add
- [x] Image path via `window.project.getFilePath()` → `file://` URL
- [x] Images persisted to localStorage (`gallery-images`)
- [x] Included in ProjectFile schema (`gallery.images[]`)
- [x] Restored on project load
- [x] Static default images (Pixabay) removed — 100% user-uploaded

### GalleryPanel (`src/renderer/projects/gallery/gallery-1/components/GalleryPanel.tsx`)
- [x] Unified list view (selector + checklist combined)
- [x] Fullscreen gallery modal with detail view
- [x] Prev/Next navigation + keyboard arrows
- [x] BG color picker

### GalleryDisplay (`src/renderer/projects/gameplay/gameplay-1/components/GalleryDisplay.tsx`)
- [x] Reads custom images from localStorage
- [x] Embedded mode (in gameplay HUD panel) + standalone mode
- [x] Detail modal with image viewer
- ~~SSE screenshot streaming~~ — `BrowserStream.tsx` deleted
- ~~`vite.config.ts`~~ — replaced by `electron.vite.config.ts`
- [x] Close endpoint (`/browser/close`) — cleanup Chromium
- [x] Singleton session (`sessionPromise`) — prevent multiple Chromium instances
- [x] Auto-cleanup on server close
- [x] `BrowserStream.tsx` — EventSource SSE receiver, renders screenshots as `<img>`
- [x] `FloatingWindow.tsx` — draggable + resizable, `createPortal` to document.body
- [x] Race condition fix — `navigatingRef` guard, `prevUrlRef` for URL change
- [x] Infinite render loop fix — `onUrlChangeRef` stable callback
- [x] Zombie Chromium cleanup — `browser.close()` on server close + window close
- [x] **Limitation**: 500ms JPEG screenshots → not smooth enough for interactive UX

### Browser — Electron `<webview>` Approach (v3, planned)
- [ ] Setup Electron project (main process + renderer)
- [ ] Implement `<webview>` tag for native browser rendering
- [ ] Port UI overlay to Electron renderer
- [ ] OBS window capture setup
- [ ] **Blocker**: `$DISPLAY` kosong di mini PC — perlu pindah ke Ubuntu PC dengan display
