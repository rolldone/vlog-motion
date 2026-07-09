# Project 4 — Route Progression Map (Mapbox + Turf.js)

> **Status:** Planning  
> **Created:** 2026-07-09  
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
| **Map rendering** | Mapbox GL JS (`mapbox-gl`) | 🆕 Akan dipakai |
| **Geo calculation** | Turf.js (`@turf/turf` ^7.3.5) | ✅ Sudah terinstall |
| **Route parsing** | Custom parser (`geo.ts`) | ✅ Sudah ada (GeoJSON + GPX) |
| **Framework** | React 19 + TypeScript | ✅ Existing |
| **Animation** | `requestAnimationFrame` loop | ✅ Sudah ada (akan di-refine) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Project4Page.tsx (React component)                 │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Route Input                                  │  │
│  │  - Upload .geojson / .gpx                     │  │
│  │  - Paste raw text                             │  │
│  │  - parseRoute() → LngLat[]                    │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼───────────────────────────┐  │
│  │  Mapbox GL Map                                 │  │
│  │  - Base map (streets / satellite)              │  │
│  │  - GeoJSON source: route line                  │  │
│  │  - GeoJSON source: checkpoints                 │  │
│  │  - GeoJSON source: actor marker                │  │
│  │  - Camera tracking (follow actor)              │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼───────────────────────────┐  │
│  │  Simulation Engine                             │  │
│  │  - requestAnimationFrame loop                  │  │
│  │  - currentKm += speed * dt                     │  │
│  │  - Turf.js along() → actor position            │  │
│  │  - Turf.js bearing() → actor rotation          │  │
│  │  - Update Mapbox GeoJSON source                │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Controls Panel                                │  │
│  │  - Play / Pause / Reset                        │  │
│  │  - Speed slider (km/detik)                     │  │
│  │  - Seek bar (currentKm / totalKm)              │  │
│  │  - Checkpoint list (add by km + label)         │  │
│  │  - Total distance override                     │  │
│  │  - Start km                                    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Current State (Sebelum Mapbox)

### ✅ Sudah Ada
- `geo.ts` — Turf.js helpers: `lineLengthKm()`, `alongKm()`, `bearingAtKm()`, `getBounds()`, `project()`, `parseRoute()`, `parseGeoJSON()`, `parseGpx()`
- `Project4Page.tsx` — UI lengkap: route input, journey settings, checkpoint list, SVG preview, play/pause/reset, seek bar
- SVG-based preview — polyline route + circle checkpoints + circle actor
- `requestAnimationFrame` simulation loop — `currentKm += speed * dt`
- Checkpoint by km — add/remove dengan label

### ❌ Yang Kurang
- **Background putih polos** — nggak ada peta sungguhan (jalan, satelit, terrain)
- **Proyeksi manual** — `project()` di `geo.ts` itu linear sederhana, bukan Mercator/proper map projection
- **Zoom/Pan** — nggak ada
- **Jalan/jalanan** tidak terlihat — cuma garis abstrak
- **Camera tracking** — nggak ada follow actor
- **Actor rotation** — bearing dihitung tapi belum dipakai untuk rotasi marker

---

## Migration Plan: SVG → Mapbox

### Phase 1: Setup Mapbox
- [ ] Install `mapbox-gl` + `@types/mapbox-gl`
- [ ] Setup Mapbox access token (env / config)
- [ ] Create `MapboxMap` component wrapper
- [ ] Initialize map with default style (streets / satellite)
- [ ] Replace SVG preview dengan Mapbox container

### Phase 2: Route Rendering
- [ ] Add GeoJSON source untuk route line (`map.addSource()`)
- [ ] Add line layer — styling (color, width, dash)
- [ ] Fit bounds to route (`map.fitBounds()`)
- [ ] Remove manual `project()` — Mapbox handle proyeksi sendiri

### Phase 3: Checkpoint Layer
- [ ] Add GeoJSON source untuk checkpoints
- [ ] Add circle/symbol layer — custom icon per checkpoint
- [ ] Popup on click — label + km info
- [ ] Add/remove checkpoint → update source data

### Phase 4: Actor Marker
- [ ] Add GeoJSON source untuk actor position
- [ ] Add symbol layer — custom actor icon (dari `actorAssets.ts`)
- [ ] Update position via `setData()` saat simulation tick
- [ ] Actor rotation berdasarkan `bearingAtKm()` — `icon-rotate` property

### Phase 5: Camera Tracking
- [ ] Follow actor saat playing — `map.easeTo()` atau `map.setCenter()`
- [ ] Toggle follow mode (lock/unlock camera)
- [ ] Auto-zoom berdasarkan speed (zoom out saat cepat, zoom in saat pelan)

### Phase 6: Simulation Refinement
- [ ] Refactor `requestAnimationFrame` loop — update Mapbox source instead of SVG
- [ ] Smooth interpolation — Turf.js `along()` per frame
- [ ] Pause at checkpoint option
- [ ] Speed profile (constant vs easing)

### Phase 7: UI Polish
- [ ] Map controls — zoom buttons, style switcher (streets/satellite)
- [ ] Checkpoint editor — click map untuk add checkpoint
- [ ] Route styling panel — color, width, opacity
- [ ] Fullscreen mode
- [ ] Save/Load route data (JSON)

---

## File Structure (Planned)

```
src/renderer/projects/actor-movement-map/project-4/
├── Project4Page.tsx              — Main page (orchestrator)
├── geo.ts                        — Turf.js helpers (existing, keep)
├── types.ts                      — Types (Checkpoint, RouteData, etc)
├── mapbox-token.ts               — Mapbox access token config
├── components/
│   ├── MapboxMap.tsx              — Mapbox GL wrapper component
│   ├── RouteInput.tsx             — Upload/paste route file
│   ├── JourneySettings.tsx        — Total km, start km, speed
│   ├── CheckpointList.tsx         — Add/remove checkpoints by km
│   ├── SimulationControls.tsx     — Play/pause/reset, seek bar
│   └── MapStyleSwitcher.tsx       — Streets / satellite toggle
└── hooks/
    ├── useMapbox.ts               — Mapbox init + cleanup
    └── useSimulation.ts           — RAF loop + state management
```

---

## Mapbox Integration Notes

### Access Token
- Mapbox GL JS butuh access token dari [mapbox.com](https://account.mapbox.com/)
- Store di env variable atau config file (jangan hardcode)
- Untuk Electron: bisa set via `process.env.MAPBOX_TOKEN` di main process

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

## Turf.js Usage (Existing + Planned)

| Function | Current | Planned |
|----------|---------|---------|
| `lineString()` | ✅ Bikin LineString dari coords | ✅ Keep — untuk Mapbox source |
| `length()` | ✅ Hitung panjang rute (km) | ✅ Keep |
| `along()` | ✅ Posisi di km tertentu | ✅ Keep — update actor position |
| `bearing()` | ✅ Arah antara 2 titik | ✅ Keep — actor rotation |
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