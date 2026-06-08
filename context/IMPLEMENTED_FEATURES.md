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
