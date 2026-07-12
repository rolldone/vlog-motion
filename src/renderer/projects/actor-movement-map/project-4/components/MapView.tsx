import { useCallback, useEffect, useRef, useState } from 'react'
import { bbox, featureCollection } from '@turf/turf'
import { alongKm, bearingAtKm, type LngLat } from '../geo'
import { MapboxMap } from './MapboxMap'
import type { MapboxStyleId } from '../mapbox-token'
import type { Checkpoint } from '../types'

// ── SVG marker icons (inline) ────────────────────────────────
const SVG = {
  actor: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".35"/>
        </filter>
        <radialGradient id="g1" cx="35%" cy="35%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="100%" stop-color="#dc2626"/>
        </radialGradient>
      </defs>
      <g filter="url(#s)">
        <circle cx="20" cy="20" r="17" fill="url(#g1)" stroke="#fff" stroke-width="2.5"/>
        <path d="M20 8l8 16H12l8-16z" fill="#fff" opacity=".95"/>
        <circle cx="20" cy="22" r="4" fill="url(#g1)"/>
      </g>
    </svg>`,
  )}`,
  start: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 56">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".4"/>
        </filter>
        <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4ade80"/>
          <stop offset="100%" stop-color="#16a34a"/>
        </linearGradient>
      </defs>
      <g filter="url(#s)">
        <path d="M22 54C22 54 6 34 6 20c0-8.8 7.2-16 16-16s16 7.2 16 16c0 14-16 34-16 34z" fill="url(#gs)" stroke="#fff" stroke-width="2.5"/>
        <rect x="16" y="16" width="12" height="12" rx="2" fill="#fff" opacity=".95"/>
        <polygon points="20,19 27,22 20,25" fill="url(#gs)"/>
      </g>
    </svg>`,
  )}`,
  finish: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 56">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".4"/>
        </filter>
        <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#b91c1c"/>
        </linearGradient>
      </defs>
      <g filter="url(#s)">
        <path d="M22 54C22 54 6 34 6 20c0-8.8 7.2-16 16-16s16 7.2 16 16c0 14-16 34-16 34z" fill="url(#gf)" stroke="#fff" stroke-width="2.5"/>
        <rect x="15" y="14" width="14" height="14" rx="1" fill="#fff" opacity=".95"/>
        <rect x="17" y="16" width="5" height="5" fill="#b91c1c"/>
        <rect x="22" y="16" width="5" height="5" fill="#fff"/>
        <rect x="17" y="21" width="5" height="5" fill="#fff"/>
        <rect x="22" y="21" width="5" height="5" fill="#b91c1c"/>
      </g>
    </svg>`,
  )}`,
  actorPulse: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="38" fill="none" stroke="#ef4444" stroke-width="2" opacity=".4"/>
    </svg>`,
  )}`,
  checkpoint: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 56">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".4"/>
        </filter>
        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <g filter="url(#s)">
        <path d="M22 54C22 54 6 34 6 20c0-8.8 7.2-16 16-16s16 7.2 16 16c0 14-16 34-16 34z" fill="url(#gc)" stroke="#fff" stroke-width="2.5"/>
        <polygon points="17,14 27,20 17,26" fill="#fff" opacity=".95"/>
      </g>
    </svg>`,
  )}`,
  cardBg: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30">
      <rect x="1" y="1" width="98" height="28" rx="4" fill="#ffffff" stroke="#d1d5db" stroke-width="1"/>
    </svg>`,
  )}`,
} as const

// ── GeoJSON helpers ──────────────────────────────────────────
function toLineString(coords: LngLat[]) {
  return { type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: coords }, properties: {} }
}

function toPointFeature(lnglat: LngLat, props: Record<string, unknown> = {}) {
  return { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: lnglat }, properties: props }
}

// ── Source / Layer IDs ───────────────────────────────────────
const S = {
  route: 'p4-route',
  checkpoints: 'p4-checkpoints',
  start: 'p4-start',
  finish: 'p4-finish',
  actor: 'p4-actor',
  actorPulse: 'p4-actor-pulse',
} as const

// ── Sync helpers ─────────────────────────────────────────────
function ensureSource(map: mapboxgl.Map, id: string, data: any) {
  try {
    const src = map.getSource(id) as mapboxgl.GeoJSONSource | undefined
    if (src) { src.setData(data); return }
    map.addSource(id, { type: 'geojson', data })
  } catch { /* ignore */ }
}

function addLayers(map: mapboxgl.Map) {
  // Route outline (glow)
  if (!map.getLayer('p4-route-outline')) {
    map.addLayer({
      id: 'p4-route-outline',
      type: 'line',
      source: S.route,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0ea5e9',
        'line-width': 6,
        'line-opacity': 0.3,
        'line-blur': 4,
      },
    })
  }
  // Route line
  if (!map.getLayer('p4-route-line')) {
    map.addLayer({
      id: 'p4-route-line',
      type: 'line',
      source: S.route,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0ea5e9',
        'line-width': 3,
        'line-opacity': 0.9,
      },
    })
  }
  // Checkpoints (pin markers)
  if (!map.getLayer(S.checkpoints)) {
    map.addLayer({
      id: S.checkpoints,
      type: 'symbol',
      source: S.checkpoints,
      layout: {
        'icon-image': 'p4-icon-checkpoint',
        'icon-size': 0.25,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
      },
    })
  }
  // Start marker (pin)
  if (!map.getLayer(S.start)) {
    map.addLayer({
      id: S.start,
      type: 'symbol',
      source: S.start,
      layout: {
        'icon-image': 'p4-icon-start',
        'icon-size': 0.25,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
      },
    })
  }
  // Start label (card box)
  if (!map.getLayer('p4-start-label')) {
    map.addLayer({
      id: 'p4-start-label',
      type: 'symbol',
      source: 'p4-start-label',
      layout: {
        'icon-image': 'p4-card-bg',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [2, 6, 2, 6],
        'icon-allow-overlap': true,
        'text-field': ['get', 'label'],
        'text-size': 12,
        'text-anchor': 'top',
        'text-offset': [0, 2.8],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#15803d',
      },
    })
  }
  // Finish marker (pin)
  if (!map.getLayer(S.finish)) {
    map.addLayer({
      id: S.finish,
      type: 'symbol',
      source: S.finish,
      layout: {
        'icon-image': 'p4-icon-finish',
        'icon-size': 0.25,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
      },
    })
  }
  // Finish label (card box)
  if (!map.getLayer('p4-finish-label')) {
    map.addLayer({
      id: 'p4-finish-label',
      type: 'symbol',
      source: 'p4-finish-label',
      layout: {
        'icon-image': 'p4-card-bg',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [2, 6, 2, 6],
        'icon-allow-overlap': true,
        'text-field': ['get', 'label'],
        'text-size': 12,
        'text-anchor': 'top',
        'text-offset': [0, 2.8],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#dc2626',
      },
    })
  }
  // Checkpoint markers (pin)
  if (!map.getLayer(S.checkpoints)) {
    map.addLayer({
      id: S.checkpoints,
      type: 'symbol',
      source: S.checkpoints,
      layout: {
        'icon-image': 'p4-icon-checkpoint',
        'icon-size': 0.25,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
      },
    })
  }
  // Checkpoint labels (card box)
  if (!map.getLayer('p4-checkpoints-label')) {
    map.addLayer({
      id: 'p4-checkpoints-label',
      type: 'symbol',
      source: 'p4-checkpoints-label',
      layout: {
        'icon-image': 'p4-card-bg',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [2, 6, 2, 6],
        'icon-allow-overlap': true,
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-anchor': 'top',
        'text-offset': [0, 2.8],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#92400e',
      },
    })
  }
  // Actor pulse (animated ring)
  if (!map.getLayer(S.actorPulse)) {
    map.addLayer({
      id: S.actorPulse,
      type: 'symbol',
      source: S.actorPulse,
      layout: {
        'icon-image': 'p4-icon-actor-pulse',
        'icon-size': 0.5,
        'icon-allow-overlap': true,
      },
    })
  }
  // Actor marker (arrow with rotation)
  if (!map.getLayer(S.actor)) {
    map.addLayer({
      id: S.actor,
      type: 'symbol',
      source: S.actor,
      layout: {
        'icon-image': 'p4-icon-actor',
        'icon-size': 0.2,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
      },
    })
  }
  // Actor label (card box)
  if (!map.getLayer('p4-actor-label')) {
    map.addLayer({
      id: 'p4-actor-label',
      type: 'symbol',
      source: 'p4-actor-label',
      layout: {
        'icon-image': 'p4-card-bg',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [2, 6, 2, 6],
        'icon-allow-overlap': true,
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-anchor': 'top',
        'text-offset': [0, 2.8],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#dc2626',
      },
    })
  }
}

/** Load custom SVG images into Mapbox style, then fire onReady */
function loadMarkerImages(map: mapboxgl.Map, onReady: () => void) {
  const entries: [string, string][] = [
    ['p4-icon-actor', SVG.actor],
    ['p4-icon-start', SVG.start],
    ['p4-icon-finish', SVG.finish],
    ['p4-icon-actor-pulse', SVG.actorPulse],
    ['p4-icon-checkpoint', SVG.checkpoint],
    ['p4-card-bg', SVG.cardBg],
  ]
  let pending = 0
  for (const [id, dataUri] of entries) {
    if (map.hasImage(id)) continue
    pending++
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try { if (!map.hasImage(id)) map.addImage(id, img) } catch {}
      pending--
      if (pending === 0) onReady()
    }
    img.onerror = () => { pending--; if (pending === 0) onReady() }
    img.src = dataUri
  }
  if (pending === 0) onReady()
}

/** Sync all Mapbox layers with current data */
function syncAllLayers(
  map: mapboxgl.Map,
  coords: LngLat[],
  checkpoints: Checkpoint[],
  currentKm: number,
  totalKm: number,
) {
  // 1. Route line
  if (coords.length >= 2) {
    ensureSource(map, S.route, toLineString(coords))
  }

  // 2. Checkpoints
  const cpFeatures = checkpoints.map((cp) => {
    const pos = alongKm(coords, cp.km)
    return toPointFeature(pos, { id: cp.id, label: `${cp.label} (KM ${cp.km})`, km: cp.km })
  })
  ensureSource(map, S.checkpoints, featureCollection(cpFeatures))
  ensureSource(map, 'p4-checkpoints-label', featureCollection(cpFeatures))

  // 3. Start / Finish markers
  if (coords.length >= 2) {
    const startFeat = toPointFeature(coords[0], { label: 'Start' })
    const finishFeat = toPointFeature(coords[coords.length - 1], { label: 'Finish' })
    ensureSource(map, S.start, startFeat)
    ensureSource(map, 'p4-start-label', startFeat)
    ensureSource(map, S.finish, finishFeat)
    ensureSource(map, 'p4-finish-label', finishFeat)
  }

  // 4. Actor marker (with bearing for rotation)
  if (coords.length >= 2) {
    const clampedKm = Math.min(currentKm, totalKm)
    const pos = alongKm(coords, clampedKm)
    const bear = bearingAtKm(coords, clampedKm)
    const actorFeat = toPointFeature(pos, { bearing: bear, label: `Its Me (KM ${clampedKm.toFixed(1)})` })
    ensureSource(map, S.actor, actorFeat)
    ensureSource(map, 'p4-actor-label', actorFeat)
    ensureSource(map, S.actorPulse, toPointFeature(pos))
  }
}

// ── Props ────────────────────────────────────────────────────
export type MapViewProps = {
  coords: LngLat[]
  checkpoints: Checkpoint[]
  currentKm: number
  totalKm: number
  viewMode: 'free' | 'drive' | 'top'
  isPlaying: boolean
  terrainEnabled: boolean
  globeEnabled: boolean
  konturEnabled: boolean
  mapStyle: MapboxStyleId
  watermark?: string
  onMapReady?: (map: mapboxgl.Map) => void
  onMapError?: (error: string) => void
}

/**
 * Pure map component — renders Mapbox-GL with route, checkpoint,
 * and actor layers, plus camera-follow logic for drive/top modes.
 * No admin UI, no simulation state — everything comes via props.
 */
export function MapView({
  coords,
  checkpoints,
  currentKm,
  totalKm,
  viewMode,
  isPlaying,
  terrainEnabled,
  globeEnabled,
  konturEnabled,
  mapStyle,
  watermark,
  onMapReady,
  onMapError,
}: MapViewProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const pulseRef = useRef<number | null>(null)
  const restoredRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)

  // ── Map ready ──────────────────────────────────────────────
  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map
    loadMarkerImages(map, () => {
      // Restore last view state (center, zoom, pitch, bearing) if available
      try {
        const saved = localStorage.getItem('map-view-state')
        if (saved) {
          const { center, zoom, pitch, bearing } = JSON.parse(saved)
          map.setCenter(center)
          map.setZoom(zoom)
          if (typeof pitch === 'number') map.setPitch(pitch)
          if (typeof bearing === 'number') map.setBearing(bearing)
          restoredRef.current = true
        }
      } catch { /* ignore */ }

      if (coords.length) {
        syncAllLayers(map, coords, checkpoints, currentKm, totalKm)
        addLayers(map)
      }
      setMapReady(true)
    })
    onMapReady?.(map)
  }, [coords, checkpoints, currentKm, totalKm, onMapReady])

  // ── Pulse animation for actor marker ───────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !coords.length) return
    let start = performance.now()
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000
      const scale = 0.2 + 0.15 * Math.abs(Math.sin(elapsed * 2 * Math.PI))
      try {
        if (map.getLayer(S.actorPulse)) {
          map.setLayoutProperty(S.actorPulse, 'icon-size', scale)
        }
      } catch {}
      pulseRef.current = requestAnimationFrame(animate)
    }
    pulseRef.current = requestAnimationFrame(animate)
    return () => { if (pulseRef.current) cancelAnimationFrame(pulseRef.current) }
  }, [coords, mapReady])

  // ── Sync layers when data changes ──────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !coords.length) return
    syncAllLayers(map, coords, checkpoints, currentKm, totalKm)
    addLayers(map)
  }, [coords, checkpoints, currentKm, totalKm, mapReady])

  // ── Camera view modes: drive / top-down / free ─────────────
  const followRef = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    if (!map || viewMode === 'free' || !isPlaying || coords.length < 2) return

    const clampedKm = Math.min(currentKm, totalKm)
    const pos = alongKm(coords, clampedKm)

    if (!followRef.current) {
      // First tick: animate camera to the new perspective
      followRef.current = true
      if (viewMode === 'drive') {
        map.flyTo({
          center: pos,
          zoom: 16,
          pitch: terrainEnabled ? 65 : 55,
          duration: 1200,
        })
      } else {
        // top-down: straight above, no tilt
        map.flyTo({
          center: pos,
          zoom: 15,
          pitch: 0,
          bearing: 0,
          duration: 1200,
        })
      }
    } else {
      map.easeTo({ center: pos, duration: 200 })
    }
  }, [currentKm, viewMode, isPlaying, coords, totalKm, terrainEnabled])

  // Reset follow flag when view mode changes or playing starts
  useEffect(() => {
    followRef.current = false
  }, [viewMode, isPlaying])

  // ── Save view state on every move ───────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (viewMode !== 'free') return
    const handleMoveEnd = () => {
      const c = map.getCenter()
      const viewState = {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      }
      localStorage.setItem('map-view-state', JSON.stringify(viewState))
    }
    map.on('moveend', handleMoveEnd)
    return () => { map.off('moveend', handleMoveEnd) }
  }, [mapReady, viewMode])

  // ── Fit bounds when route changes (skip if restored from saved state) ─
  useEffect(() => {
    const map = mapRef.current
    if (!map || coords.length < 2) return
    if (restoredRef.current) {
      restoredRef.current = false
      return
    }
    const [minLng, minLat, maxLng, maxLat] = bbox(toLineString(coords))
    map.fitBounds(
      [
        [minLng - 0.01, minLat - 0.01],
        [maxLng + 0.01, maxLat + 0.01],
      ],
      { padding: 40, duration: 800 },
    )
  }, [coords, mapReady])

  return (
    <MapboxMap
      className="h-full w-full"
      styleId={mapStyle}
      terrain={terrainEnabled}
      projection={globeEnabled ? 'globe' : 'mercator'}
      hillshade={konturEnabled}
      watermark={watermark}
      onMapReady={handleMapReady}
      onMapError={onMapError}
    />
  )
}
