# Donis Outdoor — Project Status

## Overview
Dashboard full-screen tempat user bisa "memainkan" video yang sudah di-edit di CapCut sambil berinteraksi dengan UI overlay (menu, gallery, inventory, browser, dll). User merekam seluruh session pakai **OBS** → hasilnya jadi video final untuk penonton.

Lihat `context/CONCEPT_interactive_video_dashboard.md` untuk detail konsep.

## Tech Stack
- **electron-vite 6.0.0-beta.1** (Vite 8) — Electron build tooling (main/preload/renderer)
- **Electron 43** — Desktop app framework, WebContentsView for browser panel
  - `webUtils.getPathForFile()` — get OS path from File object (replaces removed `File.path`)
  - `webSecurity: false` in BrowserWindow — allows `file://` URLs from `http://localhost` dev server
- React 19.2.6 + TypeScript ~6.0.2 + Tailwind CSS 4.3
- @motionone/dom — actor animation (actor-movement-map)
- motion (v12) — intro menu animations (`motion/react`)
- BFS pathfinding — `buildLineGraph()` → `findPathToPoint()`
- SVG rendering — `viewBox="0 0 100 100"` with percentage coordinates
- **WebContentsView** — native browser rendering in main process (replaces Puppeteer/SSE)
- IPC (contextBridge) — renderer ↔ main communication for browser + project APIs
- **localStorage** — central state persistence (inventory, cost, gallery, video info)
- **`.donis` files** — JSON project files for save/load (all state)
- react-router-dom — routing

## Environment
- **Development**: `rollminipc-100u` (Ubuntu mini PC, now has display/monitor)
- Electron app runs natively with GUI — no longer headless
- `publicDir` set to project root `public/` in `electron.vite.config.ts`

## Project Modules

### 1. Actor Movement Map Editor (`src/projects/actor-movement-map/`)
Map editor dengan SVG-based rendering, BFS pathfinding, actor animation.
- **Status**: ✅ Functional — edit mode, play mode, save/load, walking points, line styling
- **Key file**: `MapCanvas.tsx` (~2168 lines) — all state + logic + rendering
- Lihat `context/project_structure.md` untuk detail

### 2. Gameplay — Interactive Video Dashboard (`src/renderer/projects/gameplay/`)
Dashboard dengan video background + UI overlay (inventory, cost, gallery, browser).
- **Status**: ✅ Fully functional — video player, project save/load, all panels
- **Key file**: `GamePlay1Page.tsx` — fullscreen dashboard + admin mode dengan HUD menu
- **Components**: GameHUD, VideoSelector, ProjectManager, InventoryPanel, CostPanel, GalleryPanel, GalleryDisplay, BrowserPanel, FloatingWindow, CropOverlay
- **Browser approach**: WebContentsView via IPC — native 60fps rendering in main process
- **Project files**: `.donis` JSON files — save/load all state (video, inventory, cost, gallery)
- **Video persistence**: Path saved via `webUtils.getPathForFile()`, auto-loaded on project open

### 3. Other Modules
- **Motion Intro Menu** (`src/renderer/projects/motion-intro-menu/`) — ✅ Done
- **Inventory** (`src/renderer/projects/inventory/`) — ✅ Done — sort mode persistence + project file integration
- **Gallery** (`src/renderer/projects/gallery/`) — ✅ Done — custom image upload, reorder, checkbox, project file integration
- **Cost** (`src/renderer/projects/cost/`) — ✅ Done — project file integration
- **Motion Close Page** (`src/renderer/projects/motion-close-page/`) — ✅ Done

## Browser Panel — Current Architecture (Electron WebContentsView)

### Active: WebContentsView via IPC
```
src/main/index.ts → WebContentsView (main process)
  → addChildView to mainWindow → native browser rendering
  → IPC handlers: browser:navigate, browser:show, browser:hide,
    browser:close, browser:set-bounds, browser:go-back, browser:go-forward,
    browser:reload
  → URL change forwarding: did-navigate → browser-url-changed event

src/preload/index.ts → contextBridge exposes window.browser API
  → navigate(url), show(), hide(), close(), setBounds(bounds),
    goBack(), goForward(), reload(), onUrlChanged(callback)

src/renderer/projects/gameplay/gameplay-1/components/BrowserPanel.tsx
  → Uses window.browser IPC API to control WebContentsView
  → FloatingWindow.tsx provides draggable/resizable window chrome
  → Transparent content area (WebContentsView renders behind in main process)
```
- **Works**: Full native browser rendering, 60fps, full interactivity
- **Advantage**: No screenshot streaming, no latency, native input

### Removed (Superseded)
- ~~Puppeteer headless streaming~~ — `browserStreamPlugin.ts` deleted
- ~~SSE screenshot streaming~~ — `BrowserStream.tsx` deleted
- ~~Proxy iframe approach~~ — `proxyPlugin` removed from vite config
- ~~`vite.config.ts`~~ — replaced by `electron.vite.config.ts`

## Core Concepts (Actor Movement Map)
- **Edit mode**: Layout/design — draw lines, create checkpoints, add walking points
- **Run mode**: Navigation/animation — select checkpoint → SPACE to move actor
- **Line**: Series of points connecting checkpoints, has `walkingPoints[]`
- **Checkpoint**: Named node on line endpoint (or free-floating), has `actorState`
- **Walking Point**: Invisible waypoint between checkpoints, actor pauses here
- **Actor**: Moves along BFS path, pauses at each walking point

## Save/Load Flow (Actor Movement Map)
- **Save**: Downloads JSON with all state (checkpoints, lines, mapPoints, actor, background)
- **Load**: Select from `AVAILABLE_DATAS` registry (files in `assets/datas/`)
- Walking points are part of `Line` object → automatically included in save/load

## Save/Load Flow (Gameplay Dashboard)
- **Save**: `ProjectManager` → native save dialog → `.donis` JSON file with all state
- **Load**: `ProjectManager` → native open dialog → parse JSON → `restoreProjectState()` → localStorage → `window.location.reload()`
- **State collected**: video (path, name, size, time, isPlaying), inventory (items, history, checkedIds, customOrder, sortMode, bgColor), cost (total, history, bgColor), gallery (images, checkedIds, bgColor)
- **Video auto-load**: On reload, read `project-video-path` → `fileExists()` → set `file://` URL
- **Missing file**: Warning banner shown if video file not found at saved path
