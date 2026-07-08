# TODO — Next Features

## 🔴 High Priority — Gameplay Dashboard (Active Focus)

### 1. ~~Migrasi Browser Panel ke Electron~~ ✅ DONE
- Migrated from Puppeteer headless streaming to Electron WebContentsView
- `electron.vite.config.ts` — unified config (main/preload/renderer)
- `src/main/index.ts` — main process with WebContentsView + IPC handlers
- `src/preload/index.ts` — contextBridge `window.browser` API
- `BrowserPanel.tsx` + `FloatingWindow.tsx` — rewritten for IPC
- Removed: Puppeteer, SSE, BrowserStream, browserStreamPlugin, vite.config.ts

### 2. ~~Video Player Background~~ ✅ DONE
- Video player with `<video>` element as full-screen background
- `VideoSelector` component — file picker with preview, name, size
- Video path persistence via `webUtils.getPathForFile()` → localStorage
- Auto-load video on project open via `file://` URL + `fileExists()` check
- Missing file warning banner if video not found
- Play/pause (Space), seek bar, time display
- `webSecurity: false` in BrowserWindow for `file://` from dev server

### 3. ~~Project File Save/Load~~ ✅ DONE
- `.donis` JSON files — save/load all state (video, inventory, cost, gallery)
- `ProjectManager` component — Save, Save As, Open, Recent files
- `collectProjectState()` / `restoreProjectState()` — localStorage ↔ JSON
- Recent files list (max 10) in localStorage
- Modified indicator + exit confirmation

### 4. ~~Gallery Custom Image Upload~~ ✅ DONE
- `GallerySelector` — multi-image picker from disk
- List view with checkboxes, reorder (↑↓), remove (✕)
- Image path via `webUtils.getPathForFile()` → `file://` URL
- Images persisted in `.donis` project file (`gallery.images[]`)
- Static default images removed — 100% user-uploaded

### 5. UI Overlay Polish
- **What**: Transisi antar panel, animasi, styling refinement
- **Where**: `src/renderer/projects/gameplay/gameplay-1/GamePlay1Page.tsx`, semua panel components
- **Complexity**: Medium
- **Impact**: High — harus terasa seperti game/interactive movie

### 4. Browser Panel Refinement
- **What**: Test WebContentsView dengan berbagai situs, refine bounds sync, add navigation buttons
- **Where**: `src/main/index.ts`, `BrowserPanel.tsx`, `FloatingWindow.tsx`
- **Tasks**: Test back/forward/reload, verify bounds sync saat resize, add loading indicator
- **Complexity**: Low-Medium
- **Impact**: Medium — polish untuk browser UX

## 🟡 Medium Priority — Actor Movement Map

### 4. Checkpoint Actor State UI (Phase 7 completion)
- **What**: Add dropdown in CheckpointModal to set `actorState` per checkpoint
- **Where**: `CheckpointModal.tsx` — add state selector
- **Logic**: When actor arrives at checkpoint, show sprite matching checkpoint's actorState
- **Complexity**: Low

### 5. Drag to Reposition Checkpoints & Line Points
- **What**: Make checkpoints and line points draggable for repositioning
- **Where**: `MapCanvas.tsx` — add drag handlers on checkpoint/point markers
- **Complexity**: Medium
- **Impact**: High usability improvement

### 6. Undo/Redo System
- **What**: History stack for all edits
- **Where**: New `useHistory` hook or state management
- **Complexity**: High
- **Impact**: Critical for editor UX

### 7. Sequential Auto-Tour
- **What**: Play through checkpoints in order automatically
- **Where**: New state + timer logic
- **Complexity**: Medium

## 🟢 Low Priority — Actor Movement Map
- Snap-to-grid
- Keyboard shortcuts (Delete, Ctrl+Z, etc.)
- Export as image (PNG/SVG)
- Multi-select
- Layer ordering
- Curved/bezier lines
- Checkpoint label positioning
- Responsive/mobile touch controls

## ✅ Done
- ~~Migrasi Browser Panel ke Electron WebContentsView~~ ✅
- ~~Video Player Background~~ ✅ — VideoSelector, auto-load, file:// playback
- ~~Project File Save/Load (.donis)~~ ✅ — ProjectManager, collect/restore state
- ~~Gallery Custom Image Upload~~ ✅ — GallerySelector, reorder, checkbox, persist
- ~~Inventory Sort Mode Persistence~~ ✅ — localStorage + project file
- Animation Speed Control — Global speed slider in ActorSettingsModal (0.2x–3.0x)
- Line Body Popup → Walking Points — Added to LineBodyPopup
- ~~Proxy iframe approach~~ — works for simple sites (Wikipedia) — removed
- ~~Headless Puppeteer streaming~~ — works but not smooth enough — removed
- ~~SSE streaming + click/scroll/type interaction~~ — removed
- Bookmarks (Bing, Bing Maps, Wikipedia, YouTube, Reddit)
- FloatingWindow (draggable + resizable, createPortal to document.body)
- GameHUD menu (inventory, cost, gallery, browser)
- InventoryPanel, CostPanel, GalleryPanel, GalleryDisplay
