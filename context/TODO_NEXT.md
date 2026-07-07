# TODO — Next Features

## 🔴 High Priority — Gameplay Dashboard (Active Focus)

### 1. Migrasi Browser Panel ke Electron `<webview>`
- **What**: Ganti Puppeteer headless streaming dengan Electron `<webview>` untuk native browser rendering
- **Why**: Headless streaming (500ms JPEG) tidak smooth untuk interactive UX; Electron webview = 60fps native
- **Blocker**: `$DISPLAY` kosong di mini PC — perlu pindah ke real Ubuntu PC dengan display
- **Steps**:
  1. Pindah development ke Ubuntu PC dengan monitor
  2. Setup Electron project (main process + renderer)
  3. Implement `<webview>` untuk browser panel
  4. Port UI overlay (GameHUD, FloatingWindow, panels) ke Electron renderer
  5. Setup OBS window capture untuk Electron window
- **Complexity**: High
- **Impact**: Critical — smooth browser rendering untuk OBS recording

### 2. Video Player Background
- **What**: Load .mp4 file dari CapCut sebagai full-screen video background
- **Where**: `GamePlay1Page.tsx` — tambah `<video>` element di belakang UI overlay
- **Controls**: Play, pause, seek, volume, loop
- **Complexity**: Low-Medium
- **Impact**: Core feature — ini dasar dari interactive video dashboard

### 3. UI Overlay Polish
- **What**: Transisi antar panel, animasi, styling refinement
- **Where**: `GamePlay1Page.tsx`, semua panel components
- **Complexity**: Medium
- **Impact**: High — harus terasa seperti game/interactive movie

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
- Animation Speed Control — Global speed slider in ActorSettingsModal (0.2x–3.0x)
- Line Body Popup → Walking Points — Added to LineBodyPopup
- Proxy iframe approach — works for simple sites (Wikipedia)
- Headless Puppeteer streaming — works but not smooth enough
- SSE streaming + click/scroll/type interaction
- Bookmarks (Bing, Bing Maps, Wikipedia, YouTube, Reddit)
- FloatingWindow (draggable + resizable, createPortal to document.body)
- GameHUD menu (inventory, map, browser)
- InventoryPanel, MapPanel (placeholder)
