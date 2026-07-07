# 🗺️ Donis Outdoor — Project Structure

## Tech Stack
- **Vite 8.0.14** + **React 19.2.6** + **TypeScript ~6.0.2** + **Tailwind CSS 4.3**
- **@motionone/dom** (v10) — actor animation (`animate()`) — actor-movement-map
- **motion** (v12) — intro menu animations (`motion/react`) — motion-intro-menu
- **BFS pathfinding** — `buildLineGraph()` → `findPathToPoint()`
- **SVG rendering** — `viewBox="0 0 100 100"` (percentage coordinates)
- **Puppeteer + Chromium snap** — headless browser streaming (gameplay-1, will be replaced by Electron)
- **SSE** — screenshot streaming (gameplay-1, will be replaced)
- **react-router-dom** — routing

---

## Top-Level Directory Tree

```
donis_outdoor/
├── vite.config.ts                    — Vite config + proxyPlugin + browserStreamPlugin
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
├── index.html
├── context/                          — Documentation
│   ├── CONCEPT_interactive_video_dashboard.md
│   ├── IMPLEMENTED_FEATURES.md
│   ├── PROJECT_STATUS.md
│   ├── TODO_NEXT.md
│   └── project_structure.md          — This file
├── public/
│   └── sound/
└── src/
    ├── App.tsx                       — Routes
    ├── main.tsx                      — Entry point
    ├── App.css / index.css
    ├── components/
    │   └── ProjectShell.tsx          — Admin shell wrapper (title, back button, menu)
    ├── pages/
    │   ├── HomePage.tsx              — Project catalog (cards)
    │   ├── ActorMovementWorkspace.tsx
    │   └── AdminOverview.tsx
    ├── plugins/
    │   └── browserStreamPlugin.ts    — Puppeteer headless streaming (SSE)
    └── projects/
        ├── actor-movement-map/       — Map editor (✅ functional)
        ├── gameplay/                 — Interactive video dashboard (🔄 in progress)
        ├── motion-intro-menu/        — Intro menu animations (✅ done)
        ├── motion-close-page/        — Close page animation (✅ done)
        ├── inventory/                — Inventory panel (✅ done)
        ├── gallery/                  — Gallery panel (✅ done)
        └── cost/                     — Cost panel (✅ done)
```

---

## Module 1: Actor Movement Map Editor

```
src/projects/actor-movement-map/
│
├── ActorMovementMapPage.tsx          (33L)  — Route wrapper for project-1
├── ActorMovementOverviewPage.tsx     (51L)  — Overview/landing page
├── data.ts                           (30L)  — MapDataEntry type + AVAILABLE_DATAS registry
│
├── project-1/                              — ⭐ Main active project
│   ├── Project1Page.tsx              (20L)  — Page wrapper → MapCanvas
│   ├── MapCanvas.tsx              (~2168L)  — 🧠 Main orchestrator (ALL state + logic)
│   ├── types.ts                      (58L)  — All TypeScript types
│   ├── actorAssets.ts                (21L)  — Auto-discovered actor sprite registry
│   ├── backgrounds.ts                (13L)  — Auto-discovered background registry
│   │
│   └── components/
│       ├── ActorMarker.tsx            (64L)  — Actor marker rendering on canvas
│       ├── ActorSettingsModal.tsx    (358L)  — ⚙️ Actor settings (icon, shape, speed, sprites)
│       ├── CheckpointActionMenu.tsx  (107L)  — Checkpoint context menu
│       ├── CheckpointLayer.tsx        (93L)  — SVG checkpoint rendering
│       ├── CheckpointModal.tsx        (62L)  — Create/edit checkpoint label
│       ├── ConnectAcceptPopup.tsx     (49L)  — Connect confirmation popup
│       ├── DataPanel.tsx             (265L)  — 📊 Side panel (lines + checkpoints list)
│       ├── EditorToolbar.tsx         (168L)  — Top toolbar (mode, zoom, tools)
│       ├── IconPicker.tsx            (195L)  — Icon/shape/size/border picker
│       ├── LineActionMenu.tsx        (317L)  — ✏️ Line edit modal (style + walking points)
│       ├── LineBodyPopup.tsx         (273L)  — 📌 Line body click modal (extend + walking points)
│       ├── LineStylePicker.tsx       (155L)  — (Unused) Standalone line style picker
│       ├── LoadDialog.tsx             (59L)  — (Legacy) Standalone load dialog
│       ├── MapDataPicker.tsx         (124L)  — 💾 Save/Load dialog (unified)
│       ├── PointPopup.tsx             (62L)  — Map point context menu
│       ├── RouteLayer.tsx             (95L)  — SVG line + walking point rendering
│       └── SaveDialog.tsx             (66L)  — (Legacy) Standalone save dialog
│
├── project-2/  — Placeholder
├── project-3/  — Placeholder
└── assets/
    ├── actors/           — Actor sprite images
    ├── backgrounds/      — Map background images
    ├── checkpoints/      — Checkpoint icon images
    └── datas/           — Saved map data (JSON)
        ├── test.json
        └── harta-karun.json
```

### `MapCanvas.tsx` (~2168 lines) — The Brain
| Section | Lines | Description |
|---------|-------|-------------|
| **Imports** | 1–25 | React, motionone, types, all components |
| **State** | 25–150 | All `useState` + `useRef` hooks |
| **Utils** | 150–250 | `ptKey()`, `distToSegment()`, `projectOnSegments()` |
| **Line Graph** | 250–310 | `buildLineGraph()` — BFS adjacency graph |
| **Pathfinding** | 310–370 | `findPathToPoint()` — BFS from actor to target |
| **Actor Movement** | 370–545 | `moveActorTo()`, `continueMovement()`, `moveActorToPoint()` |
| **Walking Points** | 310–350 | `addWalkingPoint()`, `deleteWalkingPoint()`, drag logic |
| **Checkpoint Ops** | 545–900 | Create, edit, delete, connect checkpoints |
| **Line Ops** | 900–1115 | Add/remove points, join, extend lines |
| **Save/Load** | 1115–1175 | `handleSaveJson()`, `handleLoadDataById()`, `handleLoadJsonFile()` |
| **Map Point Ops** | 1175–1350 | `moveActorToPoint()`, map point menus |
| **Render** | 1350–2168 | Canvas, layers, modals, toolbars |

### `types.ts` (58 lines) — Data Types
```
Point         { x, y }
Line          { id, points[], color, lineStyle, width, opacity, glow, walkingPoints[] }
WalkingPoint  { id, lineId, x, y }
Checkpoint    { id, label, lineId, pointIndex, path[], icon, shape, size, border, actorState }
MapPoint      { id, x, y, label }
ActorState    'idle' | 'walking' | 'stop' | 'finish'
ActorAssets   { idle?, walking?, stop?, finish? }
```

---

## Module 2: Gameplay — Interactive Video Dashboard

```
src/projects/gameplay/
├── GamePlayPage.tsx                          — Route wrapper (ProjectShell + Outlet)
├── GamePlayOverviewPage.tsx                  — Overview/landing page
└── gameplay-1/
    ├── GamePlay1Page.tsx                     — 🧠 Main dashboard page (fullscreen + HUD)
    └── components/
        ├── GameHUD.tsx                       — Top menu bar (inventory, map, browser buttons)
        ├── InventoryPanel.tsx                — 8-slot inventory grid (placeholder)
        ├── MapPanel.tsx                      — Map placeholder
        ├── BrowserPanel.tsx                  — URL bar + bookmarks + floating window launcher
        ├── BrowserStream.tsx                 — SSE screenshot receiver (Puppeteer stream)
        └── FloatingWindow.tsx               — Draggable + resizable window (createPortal)
```

### `GamePlay1Page.tsx` — Main Dashboard
- Fullscreen mode (`document.documentElement.requestFullscreen()`)
- GameHUD menu bar with 3 items: Inventory, Map, Browser
- Panel toggle (click same item to close)
- Dark theme (bg-black, orange accent)

### `BrowserPanel.tsx` — Browser Panel
- URL input bar + Go button
- Bookmarks: Bing, Bing Maps, Wikipedia, YouTube, Reddit
- Opens `FloatingWindow` with `BrowserStream` child
- Calls `/browser/close` on window close

### `BrowserStream.tsx` — SSE Screenshot Receiver
- `EventSource('/browser/stream')` — receives JPEG screenshots
- Renders as `<img>` element
- Click → POST `/browser/click` (coordinates scaled 1280×800)
- Navigate → POST `/browser/navigate`
- `prevUrlRef` + `navigatingRef` guards for race conditions
- `onUrlChangeRef` stable callback (prevents infinite render loop)

### `FloatingWindow.tsx` — Draggable/Resizable Window
- Drag by title bar, resize by bottom-right corner
- 80% screen width/height default
- `createPortal` to `document.body` (outside DOM hierarchy)
- Accepts `children` (BrowserStream) or `url` (iframe)

### `browserStreamPlugin.ts` — Puppeteer Streaming Server
- Singleton session (`sessionPromise`) — prevents multiple Chromium instances
- Chromium: `/snap/bin/chromium`, headless, 1280×800, JPEG quality 60
- Endpoints:
  - `GET /browser/stream` — SSE screenshots every 500ms
  - `POST /browser/navigate` — navigate to URL
  - `POST /browser/click` — click at coordinates
  - `POST /browser/scroll` — scroll up/down
  - `POST /browser/type` — type text
  - `POST /browser/key` — press key
  - `POST /browser/close` — close browser session
- Auto-cleanup on server close

### `vite.config.ts` — Plugins
- `proxyPlugin()` — iframe proxy (v1, still present): fetch URL, strip headers, inject `<base>` + intercept script
- `browserStreamPlugin()` — Puppeteer streaming (v2, current)
- `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'` — SSL cert bypass (dev only)

---

## Module 3-7: Other Projects (All ✅ Done)

### Motion Intro Menu (`src/projects/motion-intro-menu/`)
- `MotionIntroMenuPage.tsx` — Route wrapper
- `MotionIntroOverviewPage.tsx` — Overview
- `intro-menu-1/IntroMenu1Page.tsx` — Main intro menu
- `intro-menu-1/TextStepper.tsx` — Text animation stepper
- `components/MultiStateBadge.tsx` — Badge component
- Uses `motion` (v12) — `motion/react`, `AnimatePresence`, `useTime`, `useTransform`

### Inventory (`src/projects/inventory/`)
- `InventoryPage.tsx` + `InventoryOverviewPage.tsx`
- `project-1/` — items, types, InventoryPanel, useSounds hook

### Gallery (`src/projects/gallery/`)
- `GalleryPage.tsx` + `GalleryOverviewPage.tsx`
- `gallery-1/` — items, Gallery1Page, GalleryPanel, useSounds hook

### Cost (`src/projects/cost/`)
- `CostPage.tsx` + `CostOverviewPage.tsx`
- `project-1/` — items, types, CostPanel, useSounds hook

### Motion Close Page (`src/projects/motion-close-page/`)
- `MotionClosePage.tsx` — Close page animation

---

## Routing (`App.tsx`)

```
/                                          → HomePage (project catalog)
/projects/actor-movement-map               → ActorMovementMapPage
  /project-1                               → Project1Page (MapCanvas)
  /project-2                               → Placeholder
  /project-3                               → Placeholder
/projects/motion-intro-menu                → MotionIntroMenuPage
  /intro-menu-1                            → IntroMenu1Page
/projects/inventory                        → InventoryPage
  /project-1                               → InventoryProject1Page
/projects/gallery                          → GalleryPage
  /gallery-1                               → Gallery1Page
/projects/cost                             → CostPage
  /project-1                               → CostProject1Page
/projects/gameplay                         → GamePlayPage
  /gameplay-1                              → GamePlay1Page
/projects/motion-close-page                → MotionClosePage
```

---

## Core Concepts (Actor Movement Map)

### Modes
- **Edit Mode** — Draw lines, create checkpoints, add walking points, style everything
- **Play Mode** — Select checkpoint → SPACE/Enter to move actor along path

### Movement Flow
```
Click checkpoint (Play mode)
  → set selectedCheckpointId
  → Press SPACE
  → moveActorTo(checkpoint)
    → findPathToPoint() via BFS
    → animate segment-by-segment
    → if walking point in path → pause (set pendingMovementRef)
    → Press SPACE → continueMovement()
    → repeat until destination
```

### Pathfinding
```
buildLineGraph()
  → Iterates all lines
  → For each line: projects walking points onto segments
  → Sorts WPs by parameter t along segment
  → Builds chain: vertex[i] → wp0 → wp1 → ... → vertex[i+1]
  → Returns Map<string, string[]> adjacency graph

findPathToPoint(target)
  → BFS from actor position through adjacency graph
  → Returns Point[] path
```

### Pause Mechanism
- `pendingMovementRef` stores `{ remainingPath, target, targetId }`
- `moveActorTo()` finds first WP in BFS path → animates to it → pauses
- `continueMovement()` reads remaining path → finds next WP → animates → pauses
- SPACE handler checks `pendingMovementRef` first → continue or start new

### Save/Load
- **Save**: Downloads JSON with all state (checkpoints, lines, mapPoints, actor config, background, speed)
- **Load**: Select from `AVAILABLE_DATAS` registry (files in `assets/datas/`)
- Walking points are part of `Line` object → automatically included in save/load

### Animation Speed System
- `actorSpeed` state (default `1.0`) — global speed multiplier
- UI: Slider in Actor Settings → Animation tab (0.2x – 3.0x)
- Applied as: `duration: 0.18 / actorSpeed` (base duration divided by speed)
- Saved in JSON as `actor.speed`

---

## Unused / Legacy Files
- `LineStylePicker.tsx` — Standalone picker, replaced by inline style in `LineActionMenu`/`LineBodyPopup`
- `LoadDialog.tsx` — Legacy, replaced by `MapDataPicker`
- `SaveDialog.tsx` — Legacy, replaced by `MapDataPicker`
- `project-2/`, `project-3/` (actor-movement-map) — Placeholder pages (not implemented)
- `proxyPlugin()` in `vite.config.ts` — v1 iframe proxy, replaced by `browserStreamPlugin()` but still present
