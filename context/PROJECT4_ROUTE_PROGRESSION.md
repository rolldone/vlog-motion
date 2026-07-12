# Project 4 — Route Progression Map (Mapbox + Turf.js)

> **Status:** 🟢 All phases complete ✅  
> **Phase:** 7/7 — UI Polish (done)
> **Created:** 2026-07-09  
> **Last updated:** 2026-07-14  
> **Parent module:** `src/renderer/projects/actor-movement-map/project-4/`

---

## Overview

Route-based map viewer & simulator untuk rute perjalanan nyata (real-world GPS coordinates). User upload file GPX/GeoJSON → rute ditampilkan di peta Mapbox → actor bergerak sepanjang rute berdasarkan jarak (km) dan kecepatan yang bisa diatur.

Berbeda dengan **project-1** (MapCanvas) yang pake SVG viewBox abstrak dengan freehand lines/checkpoints, project-4 ini fokus ke **rute dunia nyata** dengan koordinat `[lng, lat]`.

---

## Goal

Menciptakan experience seperti **GPS navigation simulator** — visualisasi perjalanan di peta sungguhan, dengan checkpoint berbasis kilometer, play/pause, dan camera tracking.

---

## Tech Stack

| Layer | Tech | Status |
|-------|------|--------|
| **Map rendering** | Mapbox GL JS (`mapbox-gl` ^3.25.0) | ✅ Terinstall & terintegrasi |
| **Geo calculation** | Turf.js (`@turf/turf` ^7.3.5) | ✅ Sudah terinstall |
| **Route parsing** | Custom parser (`geo.ts`) | ✅ Sudah ada (GeoJSON + GPX) |
| **Framework** | React 19 + TypeScript | ✅ Existing |
| **Animation** | `requestAnimationFrame` loop | ✅ Sudah ada (Mapbox source sync) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Project4Page.tsx (thin wrapper)                             │
│  Renders <MapAdminPage /> — no logic                         │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│  MapAdminPage.tsx (state owner / orchestrator)               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  State: coords, checkpoints, currentKm, isPlaying,    │  │
│  │  mapStyle, terrain, globe, kontur, viewMode,           │  │
│  │  totalKmOverride, startKm, speed, watermark            │  │
│  │                                                        │  │
│  │  Layout: vertical stacked (atas-bawah)                 │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  AdminPanel (top — full width)                   │  │  │
│  │  │  - Route Input (upload / paste)                  │  │  │
│  │  │  - Journey Settings (total km, start km, speed)  │  │  │
│  │  │  - Checkpoint CRUD (add/remove by km + label)    │  │  │
│  │  │  - Map Display (style + Globe/Kontur/Terrain)    │  │  │
│  │  │  - Watermark input (custom text)                 │  │  │
│  │  │  - Simulation (play/pause/reset + seek bar)      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  MapView (bottom — full width)                   │  │  │
│  │  │  - Pure map, no business logic                   │  │  │
│  │  │  - All state via props                           │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Component Tree

```
Project4Page
 └── MapAdminPage            ← state owner
      ├── AdminPanel         ← pure UI (all controls)
      └── MapView            ← pure map rendering
           └── MapboxMap     ← Mapbox GL wrapper
```

### Data Flow

```
[User Action] → AdminPanel callback → MapAdminPage state update
                                       ↓
                                   MapView receives new props
                                       ↓
                                   syncAllLayers() updates Mapbox GeoJSON sources
                                       ↓
                                   Mapbox GL renders on map

---

## Current State (All Phases Complete ✅)

### ✅ Sudah Ada

**Core Infrastructure:**
- `geo.ts` — Turf.js helpers: `lineLengthKm()`, `alongKm()`, `bearingAtKm()`, `getBounds()`, `project()`, `parseRoute()`, `parseGeoJSON()`, `parseGpx()`
- `Project4Page.tsx` — Thin entry point, renders `<MapAdminPage />`
- `MapAdminPage.tsx` — State owner / orchestrator (route, checkpoints, simulation, map display)
- `MapView.tsx` — Pure map component (Mapbox + layers + camera follow)
- `AdminPanel.tsx` — Pure UI panel (all admin controls)
- `MapboxMap.tsx` — Mapbox GL wrapper dengan loading/error overlay + watermark
- `useMapbox.ts` — Mapbox hook: init, cleanup, style switching, terrain, projection, hillshade
- `types.ts` — Checkpoint, RouteData, JourneySettings, SimulationState, MapStyleId
- `mapbox-token.ts` — Baca token dari `import.meta.env.VITE_MAPBOX_TOKEN`

**Map Features:**
- Mapbox-based rendering — peta sungguhan (streets/satellite/outdoors/light/dark)
- Route line — blue line + glow outline (GeoJSON source)
- Checkpoint markers — amber pin SVGs (bukan circle)
- Start marker — green teardrop pin with play icon SVG
- Finish marker — red teardrop pin with checkered flag SVG
- Actor marker — red gradient arrow SVG with rotation (`icon-rotate` via bearing)
- Pulse animation — animated ring around actor (sine wave scale via RAF)
- 3D Terrain — elevation/dem terrain (toggle)
- Globe 3D — Mapbox globe projection (like Google Earth, toggle)
- Kontur / Hillshade — terrain relief overlay (toggle)
- Fit bounds to route — auto-zoom via Turf.js `bbox()`

**Labels (all markers):**
- Card box style — white background, rounded corners (via `icon-text-fit` SVG)
- Start label (green text), Finish label (red text), Checkpoint labels (brown text)
- Actor label — `"Its Me (KM X.X)"` with real-time KM update
- Format: `Pos 3 (KM 1)` style

**Camera Tracking (Simulation):**
- **Drive mode** — fly-to with pitch, smooth easeTo follow, no bearing rotation (fixed angle)
- **Top-down mode** — straight above, no tilt, no rotation
- **Free mode** — no camera tracking (user controls)
- Reset follow flag when mode changes

**Simulation:**
- `requestAnimationFrame` loop — `currentKm += speed * dt`
- Turf.js `along()` → actor position per frame
- Turf.js `bearing()` → actor rotation
- Seek bar (range slider) — scrub through route
- Speed setting (km/detik)
- Total distance override
- Start km offset

**UI / Layout:**
- Vertical stacked layout — admin panel on top, map below (full width)
- Admin panel: Route Input, Journey Settings, Checkpoints, Map Display, Watermark, Simulation
- Map style switcher — 5 styles (streets, satellite, outdoors, light, dark)
- Map controls hint (bottom-left `?` button with tooltip)
- Custom watermark — text input, realtime preview at bottom-right
- Attribution & logo Mapbox disembunyikan (paid account, private use)

### ❌ Yang Belum
- Click on map to add checkpoint — masih manual via form
- Save/Load route data (JSON)
- Pause at checkpoint option
- Speed profile (constant vs easing)
- Fullscreen mode

---

## Migration Plan: SVG → Mapbox ✅

### Phase 1: Setup Mapbox ✅
- [x] Install `mapbox-gl` + `@types/mapbox-gl`
- [x] Setup Mapbox access token — `.env` + `mapbox-token.ts`
- [x] Create `MapboxMap` component wrapper (`components/MapboxMap.tsx`)
- [x] Create `useMapbox` hook (`hooks/useMapbox.ts`) — init, cleanup, style switch, error handling
- [x] Initialize map with default style (outdoors / satellite)
- [x] Replace SVG preview dengan Mapbox container
- [x] Create `types.ts` — Checkpoint, RouteData, JourneySettings, SimulationState, MapStyleId
- [x] Loading/error overlay di MapboxMap
- [x] `.env` ditambahkan ke `.gitignore`
- [x] Full build — 0 errors

### Phase 2: Route Rendering ✅
- [x] Add GeoJSON source untuk route line (`syncAllLayers()` → `ensureSource()`)
- [x] Add line layer — styling (blue route line + glow outline)
- [x] Fit bounds to route (`map.fitBounds()` via Turf.js `bbox()`)
- [x] Remove manual `project()` — Mapbox handle proyeksi sendiri

### Phase 3: Checkpoint & Actor Layer ✅
- [x] Add GeoJSON source untuk checkpoints
- [x] Add SVG markers — amber pin SVGs (bukan circle)
- [x] Add/remove checkpoint → update source data (`syncAllLayers()`)
- [x] Add GeoJSON source untuk actor position
- [x] Update position via `setData()` saat simulation tick (Turf.js `along()`)

### Phase 4: Camera Tracking ✅
- [x] Follow actor saat playing — `map.easeTo()` / `map.flyTo()`
- [x] **Drive mode** — fly-to with pitch, smooth easeTo, no bearing rotation (fixed angle)
- [x] **Top-down mode** — straight above, no tilt, no rotation
- [x] **Free mode** — user controls, no camera tracking
- [x] Reset follow flag when switching modes

### Phase 5: Map Enhancement ✅
- [x] **Globe 3D** — Mapbox `projection: 'globe'` toggle (like Google Earth)
- [x] **Kontur / Hillshade** — terrain relief overlay from Mapbox DEM source
- [x] **3D Terrain** — elevation/terrain toggle (`map.setTerrain()`)
- [x] Style switcher — 5 styles (streets, satellite, outdoors, light, dark)

### Phase 6: Component Separation ✅
- [x] Extract `MapView.tsx` — pure map rendering, zero business logic
- [x] Extract `AdminPanel.tsx` — pure UI panel, all controls as props
- [x] Create `MapAdminPage.tsx` — state owner / orchestrator
- [x] Refactor `Project4Page.tsx` — thin wrapper (just renders MapAdminPage)
- [x] All state passed down as props, all changes via callbacks

### Phase 7: UI Polish ✅
- [x] SVG markers — start (green pin), finish (red checkered pin), actor (red arrow with rotation), checkpoint (amber pin)
- [x] Pulse animation — animated ring around actor (sine wave scale via RAF)
- [x] Card box labels — white background, rounded corners, colored text per type
- [x] Label format — `Pos 3 (KM 1)`, `Its Me (KM X.X)`
- [x] Watermark — custom text input, realtime preview at bottom-right
- [x] Layout — vertical stacked (admin panel on top, map below, full width)
- [x] Map controls hint (bottom-left `?` button)
- [x] Attribution & logo Mapbox hidden (paid account, private use)
- [x] All marker sizes reduced (start/finish 0.25, actor 0.2, pulse 0.2-0.35)

---

## File Structure (Current)

```
src/renderer/projects/actor-movement-map/project-4/
├── Project4Page.tsx              — Thin entry (renders <MapAdminPage />)
├── MapAdminPage.tsx              — State owner / orchestrator
├── MapView.tsx                   — Pure map component
├── AdminPanel.tsx                — Pure UI controls panel
├── geo.ts                        — Turf.js helpers
├── types.ts                      — Checkpoint, RouteData, JourneySettings, etc
├── mapbox-token.ts               — Mapbox access token + style config
├── components/
│   ├── MapboxMap.tsx              — Mapbox GL wrapper (loading/error/watermark)
│   ├── ActorMarker.tsx            — (unused — inline SVG in MapView.tsx)
│   └── ... (shared components)
└── hooks/
    └── useMapbox.ts               — Mapbox init, cleanup, style, terrain, projection, hillshade
```

---

## Mapbox Integration Notes

### Access Token
- Mapbox GL JS butuh access token dari [mapbox.com](https://account.mapbox.com/)
- Store di `.env` sebagai `VITE_MAPBOX_TOKEN` (Vite `import.meta.env`)
- Jangan hardcode — `.env` sudah di `.gitignore`
- Baca via `mapbox-token.ts` → `import.meta.env.VITE_MAPBOX_TOKEN`

### GeoJSON Source Pattern
```typescript
// Add source
map.addSource('route', {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: lngLatCoords }
  }
})

// Update source data (saat simulation tick)
const source = map.getSource('route')
source.setData(updatedGeoJSON)
```

### Camera Tracking
```typescript
// Follow actor
map.easeTo({
  center: actorLngLat,
  zoom: 14,
  duration: 500
})
```

### Actor Rotation
```typescript
// Symbol layer dengan icon-rotate
map.addLayer({
  id: 'actor',
  type: 'symbol',
  source: 'actor',
  layout: {
    'icon-image': 'actor-icon',
    'icon-rotate': ['get', 'bearing'],  // dari Turf.js bearing()
    'icon-rotation-alignment': 'map'
  }
})
```

---

## Turf.js Usage

| Function | Used For |
|----------|----------|
| `lineString()` | Bikin LineString dari coords |
| `length()` | Hitung panjang rute (km) |
| `along()` | Posisi actor di km tertentu (setiap frame) |
| `bearing()` | Arah/rotation actor antara 2 titik |
| `bbox()` | Fit bounds map ke route |
| `featureCollection()` | Kumpulin multiple features untuk Mapbox source |
| `lineDistance()` | (via `lineLengthKm()`) |
| `coordEach()` | (via parsing) |
| `bbox()` | ❌ Belum | 🆕 `map.fitBounds()` — auto-fit route |
| `point()` | ❌ Belum | 🆕 Bikin GeoJSON Point untuk checkpoint/actor |
| `featureCollection()` | ❌ Belum | 🆕 Bundle checkpoints jadi FeatureCollection |

---

## Open Questions

- [ ] Mapbox token — pakai akun sendiri atau organization?
- [ ] Style — streets default atau satellite? Atau toggle keduanya?
- [ ] Actor icon — pakai sprite dari `actorAssets.ts` atau custom Mapbox icon?
- [ ] Save/Load — apakah perlu `.donis` integration seperti gameplay dashboard?
- [ ] Offline support — Mapbox butuh internet, apakah perlu fallback tile?
- [ ] Checkpoint interaction — click map untuk add, atau tetap input km manual?