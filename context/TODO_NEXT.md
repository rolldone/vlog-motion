# TODO — Next Features

## 🔴 High Priority

### 1. Checkpoint Actor State UI (Phase 7 completion)
- **What**: Add dropdown in CheckpointModal to set `actorState` per checkpoint
- **Where**: `CheckpointModal.tsx` — add state selector
- **Logic**: When actor arrives at checkpoint, show sprite matching checkpoint's actorState
- **Complexity**: Low

### 2. Drag to Reposition Checkpoints & Line Points
- **What**: Make checkpoints and line points draggable for repositioning
- **Where**: `MapCanvas.tsx` — add drag handlers on checkpoint/point markers
- **Complexity**: Medium
- **Impact**: High usability improvement

### 3. Undo/Redo System
- **What**: History stack for all edits
- **Where**: New `useHistory` hook or state management
- **Complexity**: High
- **Impact**: Critical for editor UX

## 🟡 Medium Priority

### 4. Animation Speed Control
- **Status**: ✅ DONE — Global speed slider in ActorSettingsModal (Animation tab)
- **Range**: 0.2x (slow) to 3.0x (fast), default 1.0x
- **Applied to**: All walking/animation durations (0.18s, 0.2s, 0.25s base)
- **Saved in**: JSON as `actor.speed`
- **Complexity**: Low

### 5. Sequential Auto-Tour
- **What**: Play through checkpoints in order automatically
- **Where**: New state + timer logic
- **Complexity**: Medium

### 6. Line Body Popup → Walking Points
- **Status**: ✅ DONE — Added to LineBodyPopup in this session

## 🟢 Low Priority
- Snap-to-grid
- Keyboard shortcuts (Delete, Ctrl+Z, etc.)
- Export as image (PNG/SVG)
- Multi-select
- Layer ordering
- Curved/bezier lines
- Checkpoint label positioning
- Responsive/mobile touch controls
