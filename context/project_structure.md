# 🗺️ Actor Movement Map Editor — Project Structure

## Tech Stack
- **Vite 8.0.14** + **React 19.2.6** + **TypeScript ~6.0.2** + **Tailwind CSS 4.3**
- **@motionone/dom** — actor animation (`animate()`)
- **BFS pathfinding** — `buildLineGraph()` → `findPathToPoint()`
- **SVG rendering** — `viewBox="0 0 100 100"` (percentage coordinates)

---

## Directory Tree

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
├── project-2/
│   └── Project2Page.tsx                   — Placeholder
│
├── project-3/
│   └── Project3Page.tsx                   — Placeholder
│
└── assets/
    ├── actors/                             — Actor sprite images
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── backgrounds/                        — Map background images
    │   └── istockphoto-688848706-1024x1024.jpg
    ├── checkpoints/                        — Checkpoint icon images
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    └── datas/                              — Saved map data (JSON)
        ├── test.json
        └── harta-karun.json
```

**Total: ~4,900 lines** across all files.

---

## Core Files Breakdown

### `MapCanvas.tsx` (~2168 lines) — The Brain
Everything lives here: all state, all logic, all rendering. This is the single orchestrator.

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

### `data.ts` (30 lines) — Data Registry
- `MapDataEntry` type — schema for saved/loaded map data
- `AVAILABLE_DATAS` — registered map data entries (imported from JSON files)

### `actorAssets.ts` (21 lines) — Sprite Registry
- Auto-discovers actor sprite images from `assets/actors/`
- Exports `ACTOR_SPRITE_LIST` with `{ id, label, src }` entries

### `backgrounds.ts` (13 lines) — Background Registry
- Auto-discovers background images from `assets/backgrounds/`
- Exports `BACKGROUND_LIST` with `{ id, label, src }` entries

---

## Component Responsibilities

| Component | Parent | Trigger | Purpose |
|-----------|--------|---------|---------|
| `EditorToolbar` | MapCanvas | Always | Mode toggle, zoom, tools, settings buttons |
| `DataPanel` | MapCanvas | Data button | Side panel with lines/checkpoints list |
| `ActorSettingsModal` | MapCanvas | Actor button | Icon, shape, size, border, speed, sprites |
| `CheckpointModal` | MapCanvas | Click empty space / edit label | Create/edit checkpoint |
| `CheckpointActionMenu` | MapCanvas | Right-click checkpoint | Checkpoint actions (edit, connect, delete) |
| `CheckpointLayer` | MapCanvas | Always (SVG) | Render checkpoint markers on canvas |
| `LineActionMenu` | MapCanvas | Click line endpoint | Line edit (style, walking points, delete) |
| `LineBodyPopup` | MapCanvas | Click line body | Line body actions (extend, style, walking points) |
| `RouteLayer` | MapCanvas | Always (SVG) | Render lines + walking point markers |
| `ActorMarker` | MapCanvas | Always | Render actor marker on canvas |
| `IconPicker` | CheckpointActionMenu | Icon button | Icon/shape/size/border picker |
| `ConnectAcceptPopup` | MapCanvas | Connect confirmation | Accept/reject connect |
| `MapDataPicker` | MapCanvas | Map Data button | Save/load dialog |
| `PointPopup` | MapCanvas | Right-click map point | Map point menu |

---

## Core Concepts

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

---

## Animation Speed System
- `actorSpeed` state (default `1.0`) — global speed multiplier
- UI: Slider in Actor Settings → Animation tab (0.2x – 3.0x)
- Applied as: `duration: 0.18 / actorSpeed` (base duration divided by speed)
- Saved in JSON as `actor.speed`
- **Not applied to**: mode transitions, teleport jumps (those use fixed durations)

---

## Unused / Legacy Files
- `LineStylePicker.tsx` — Standalone picker, replaced by inline style in `LineActionMenu`/`LineBodyPopup`
- `LoadDialog.tsx` — Legacy, replaced by `MapDataPicker`
- `SaveDialog.tsx` — Legacy, replaced by `MapDataPicker`
- `project-2/`, `project-3/` — Placeholder pages (not implemented)
