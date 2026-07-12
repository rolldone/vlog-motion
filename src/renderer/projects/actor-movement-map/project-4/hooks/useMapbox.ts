import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAPBOX_TOKEN, MAPBOX_STYLES, type MapboxStyleId } from '../mapbox-token'

export type UseMapboxOptions = {
  container: HTMLElement | null
  styleId?: MapboxStyleId
  center?: [number, number]
  zoom?: number
}

export type UseMapboxResult = {
  map: mapboxgl.Map | null
  isReady: boolean
  error: string | null
  setStyle: (styleId: MapboxStyleId) => void
  setTerrain: (enabled: boolean, exaggeration?: number) => void
  terrainEnabled: boolean
  setProjection: (projection: 'mercator' | 'globe') => void
  setHillshade: (enabled: boolean) => void
  hillshadeEnabled: boolean
}

export function useMapbox({
  container,
  styleId = 'streets',
  center = [106.8, -6.2], // default: Jakarta
  zoom = 10,
}: UseMapboxOptions): UseMapboxResult {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [terrainEnabled, setTerrainEnabledState] = useState(false)
  const terrainRef = useRef({ enabled: false, exaggeration: 1.5 })
  const projectionRef = useRef<'mercator' | 'globe'>('mercator')
  const [hillshadeEnabled, setHillshadeEnabled] = useState(false)
  const hillshadeRef = useRef(false)

  useEffect(() => {
    if (!container) return
    if (mapRef.current) return // sudah ada

    // Validasi token
    const token = MAPBOX_TOKEN
    if (!token) {
      setError(
        'Mapbox token belum diisi. Buka src/.../project-4/mapbox-token.ts untuk set token.'
      )
      return
    }

    mapboxgl.accessToken = token

    try {
      const map = new mapboxgl.Map({
        container,
        style: MAPBOX_STYLES[styleId],
        center,
        zoom,
        attributionControl: false,
      })

      // Navigation control (zoom + compass)
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right')

      // ── Google Earth-like orbit controls ──
      // Right-click + drag → orbit (tilt + rotate) — already default
      // For power users: hold Ctrl+Alt + left drag also works like GE
      map.touchPitch.enable()

      map.on('load', () => {
        mapRef.current = map
        setIsReady(true)
        // Re-apply persisted state after style loads
        if (terrainRef.current.enabled) {
          applyTerrain(map, terrainRef.current.exaggeration)
        }
        if (projectionRef.current === 'globe') {
          map.setProjection('globe')
        }
        if (hillshadeRef.current) {
          applyHillshade(map)
        }
      })

      map.on('error', (e) => {
        console.error('[Mapbox]', e.error?.message ?? e)
      })
    } catch (e) {
      setError((e as Error).message)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setIsReady(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container])

  /** Helper: add DEM source + enable terrain */
  function applyTerrain(m: mapboxgl.Map, exaggeration: number) {
    if (!m.getSource('mapbox-dem')) {
      m.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })
    }
    m.setTerrain({ source: 'mapbox-dem', exaggeration })
    // Add sky layer for atmosphere (optional)
    if (!m.getLayer('sky')) {
      m.addLayer({
        id: 'sky',
        type: 'sky',
        paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun': [0.0, 90.0], 'sky-atmosphere-sun-intensity': 15 },
      })
    }
  }

  const setStyle = (id: MapboxStyleId) => {
    const m = mapRef.current
    if (!m) return
    // Toggle isReady false → true so onMapReady callback re-fires
    setIsReady(false)
    m.setStyle(MAPBOX_STYLES[id])
    m.once('style.load', () => {
      setIsReady(true)
      // Re-apply state after style change
      if (terrainRef.current.enabled) applyTerrain(m, terrainRef.current.exaggeration)
      if (projectionRef.current === 'globe') m.setProjection('globe')
      if (hillshadeRef.current) applyHillshade(m)
    })
  }

  const setTerrain = (enabled: boolean, exaggeration = 1.5) => {
    const m = mapRef.current
    if (!m) return
    terrainRef.current = { enabled, exaggeration }
    setTerrainEnabledState(enabled)
    if (enabled) {
      applyTerrain(m, exaggeration)
      // Tilt the camera to see 3D effect
      m.easeTo({ pitch: 60, duration: 800 })
    } else {
      m.setTerrain(null)
      // Remove sky layer
      if (m.getLayer('sky')) m.removeLayer('sky')
      // Reset camera pitch
      m.easeTo({ pitch: 0, duration: 800 })
    }
  }

  // ── Hillshade (kontur hiking overlay) ──
  function applyHillshade(m: mapboxgl.Map) {
    if (!m.getSource('mapbox-dem')) {
      m.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })
    }
    if (!m.getLayer('p4-hillshade')) {
      m.addLayer({
        id: 'p4-hillshade',
        type: 'hillshade',
        source: 'mapbox-dem',
        paint: {
          'hillshade-exaggeration': 0.6,
          'hillshade-shadow-color': '#2c3e50',
        },
      })
    }
  }

  function removeHillshade(m: mapboxgl.Map) {
    if (m.getLayer('p4-hillshade')) m.removeLayer('p4-hillshade')
    // Keep DEM source — may be used by terrain
  }

  const setHillshade = (enabled: boolean) => {
    const m = mapRef.current
    if (!m) return
    hillshadeRef.current = enabled
    setHillshadeEnabled(enabled)
    if (enabled) {
      applyHillshade(m)
    } else {
      removeHillshade(m)
    }
  }

  // ── Projection (Globe 3D) ──
  const setProjection = (p: 'mercator' | 'globe') => {
    const m = mapRef.current
    if (!m) return
    projectionRef.current = p
    m.setProjection(p)
  }

  return { map: mapRef.current, isReady, error, setStyle, setTerrain, terrainEnabled, setProjection, setHillshade, hillshadeEnabled }
}
