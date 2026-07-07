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

### Browser — Proxy Iframe Approach (v1, masih di vite.config.ts)
- [x] `proxyPlugin()` di `vite.config.ts` — fetch target URL, strip X-Frame-Options/CSP headers
- [x] Inject `<base>` tag supaya relative URLs resolve ke domain asli
- [x] Strip `<meta>` CSP & X-Frame-Options tags dari HTML
- [x] Intercept script — click/link/window.open/location/history → postMessage ke parent
- [x] Bookmarks: Bing, Bing Maps, Wikipedia, YouTube, Reddit
- [x] **Limitation**: Google/DuckDuckGo refuse, JS-heavy SPAs navigation not intercepted

### Browser — Headless Streaming Approach (v2, current)
- [x] `browserStreamPlugin()` di `src/plugins/browserStreamPlugin.ts`
- [x] Puppeteer headless Chromium (`/snap/bin/chromium`, 1280×800, JPEG quality 60)
- [x] SSE stream endpoint (`/browser/stream`) — screenshots every 500ms
- [x] Navigate endpoint (`/browser/navigate`)
- [x] Click endpoint (`/browser/click`) — coordinate scaled from display to 1280×800
- [x] Scroll endpoint (`/browser/scroll`)
- [x] Type endpoint (`/browser/type`)
- [x] Key endpoint (`/browser/key`)
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
