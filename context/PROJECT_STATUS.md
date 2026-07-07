# Donis Outdoor — Project Status

## Overview
Dashboard full-screen tempat user bisa "memainkan" video yang sudah di-edit di CapCut sambil berinteraksi dengan UI overlay (menu, gallery, inventory, browser, dll). User merekam seluruh session pakai **OBS** → hasilnya jadi video final untuk penonton.

Lihat `context/CONCEPT_interactive_video_dashboard.md` untuk detail konsep.

## Tech Stack
- Vite 8.0.14 + React 19.2.6 + TypeScript ~6.0.2 + Tailwind CSS 4.3
- @motionone/dom — actor animation (actor-movement-map)
- motion (v12) — intro menu animations (`motion/react`)
- BFS pathfinding — `buildLineGraph()` → `findPathToPoint()`
- SVG rendering — `viewBox="0 0 100 100"` with percentage coordinates
- Puppeteer + Chromium snap — headless browser streaming (gameplay-1, **will be replaced**)
- SSE (Server-Sent Events) — screenshot streaming (gameplay-1, **will be replaced**)
- react-router-dom — routing

## Environment
- **Development**: Remote SSH ke `rollminipc-100u` (Ubuntu mini PC, headless — `$DISPLAY` kosong)
- **Migration plan**: Pindah development ke real Ubuntu PC dengan display untuk Electron migration
- Chromium path: `/snap/bin/chromium` v150.0.7871.46
- `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'` untuk SSL cert bypass (dev only)

## Project Modules

### 1. Actor Movement Map Editor (`src/projects/actor-movement-map/`)
Map editor dengan SVG-based rendering, BFS pathfinding, actor animation.
- **Status**: ✅ Functional — edit mode, play mode, save/load, walking points, line styling
- **Key file**: `MapCanvas.tsx` (~2168 lines) — all state + logic + rendering
- Lihat `context/project_structure.md` untuk detail

### 2. Gameplay — Interactive Video Dashboard (`src/projects/gameplay/`)
Dashboard dengan video background + UI overlay (inventory, map, browser).
- **Status**: 🔄 In progress — browser panel streaming works but not smooth enough
- **Key file**: `GamePlay1Page.tsx` — fullscreen dashboard dengan HUD menu
- **Components**: GameHUD, InventoryPanel, MapPanel, BrowserPanel, BrowserStream, FloatingWindow
- **Browser approach**: Puppeteer headless → SSE screenshots → **NOT smooth (500ms JPEG)**
- **Migration plan**: Electron dengan `<webview>` untuk native browser rendering (butuh display)

### 3. Other Modules
- **Motion Intro Menu** (`src/projects/motion-intro-menu/`) — ✅ Done
- **Inventory** (`src/projects/inventory/`) — ✅ Done
- **Gallery** (`src/projects/gallery/`) — ✅ Done
- **Cost** (`src/projects/cost/`) — ✅ Done
- **Motion Close Page** (`src/projects/motion-close-page/`) — ✅ Done

## Browser Panel — Current State & Migration Plan

### Current: Headless Streaming (Puppeteer)
```
vite.config.ts → browserStreamPlugin() → Puppeteer headless Chromium
  → SSE stream screenshots (JPEG quality 60, 500ms interval)
  → BrowserStream.tsx renders as <img>
  → Click/scroll/type sent back to server → Puppeteer
```
- **Works**: Bing, Wikipedia, YouTube, Reddit
- **Problem**: 500ms JPEG screenshots → not smooth for interactive UX
- **Files**: `src/plugins/browserStreamPlugin.ts`, `src/projects/gameplay/gameplay-1/components/BrowserStream.tsx`

### Previous: Proxy Iframe
```
vite.config.ts → proxyPlugin() → fetch target URL → strip X-Frame-Options/CSP
  → inject <base> tag + intercept script → render in <iframe>
```
- **Works**: Simple sites (Wikipedia)
- **Problem**: Google/DuckDuckGo refuse, JS-heavy SPAs (Bing Maps) navigation not intercepted
- **Files**: Still in `vite.config.ts` as `proxyPlugin()`

### Target: Electron `<webview>` (Migration)
- **Why**: Native browser rendering, 60fps, full interactivity
- **Blocker**: `$DISPLAY` kosong di mini PC — Electron butuh GUI environment
- **Plan**: Pindah development ke real Ubuntu PC dengan display
- **Approach**: Electron app dengan `<webview>` tag untuk embed browser, custom CSS overlay untuk HUD

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
