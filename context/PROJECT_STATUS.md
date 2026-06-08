# Actor Movement Map Editor — Project Status

## Tech Stack
- Vite 8.0.14 + React 19.2.6 + TypeScript ~6.0.2 + Tailwind CSS 4.3
- @motionone/dom — actor animation
- BFS pathfinding — `buildLineGraph()` → `findPathToPoint()`
- SVG rendering — `viewBox="0 0 100 100"` with percentage coordinates

## File Structure
```
src/projects/actor-movement-map/
├── project-1/
│   ├── MapCanvas.tsx          (~2250 lines) — Main orchestrator
│   ├── types.ts               (~55 lines)   — All types
│   ├── components/
│   │   ├── LineActionMenu.tsx    — Line edit modal (Style + Walking Points)
│   │   ├── LineBodyPopup.tsx     — Line body click modal (Extend + Walking Points)
│   │   ├── CheckpointActionMenu.tsx — Checkpoint edit modal
│   │   ├── DataPanel.tsx         — Side panel (lines + checkpoints list)
│   │   ├── EditorToolbar.tsx     — Top toolbar
│   │   ├── MapDataPicker.tsx     — Save/Load dialog
│   │   ├── ActorSettingsModal.tsx — Actor icon/sprite settings
│   │   ├── CheckpointModal.tsx   — Create/edit checkpoint
│   │   └── ...
│   └── assets/
│       ├── actors/              — Actor sprite images
│       ├── checkpoints/         — Checkpoint icons
│       └── backgrounds/         — Background images
├── data.ts                     — AVAILABLE_DATAS registry
└── assets/datas/
    ├── test.json               — Test map data
    └── harta-karun.json        — Harta karun map data
```

## Core Concepts
- **Edit mode**: Layout/design — draw lines, create checkpoints, add walking points
- **Run mode**: Navigation/animation — select checkpoint → SPACE to move actor
- **Line**: Series of points connecting checkpoints, has `walkingPoints[]`
- **Checkpoint**: Named node on line endpoint (or free-floating), has `actorState`
- **Walking Point**: Invisible waypoint between checkpoints, actor pauses here
- **Actor**: Moves along BFS path, pauses at each walking point

## Save/Load Flow
- **Save**: Downloads JSON with all state (checkpoints, lines, mapPoints, actor, background)
- **Load**: Select from `AVAILABLE_DATAS` registry (files in `assets/datas/`)
- Walking points are part of `Line` object → automatically included in save/load
