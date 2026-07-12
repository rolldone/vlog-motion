import { useCallback, useEffect, useRef, useState } from 'react'
import { useMapbox } from '../hooks/useMapbox'
import type { MapboxStyleId } from '../mapbox-token'
import 'mapbox-gl/dist/mapbox-gl.css'

// ── Sembunyikan attribution — paid account, private use ─────
const style = document.createElement('style')
style.textContent = '.mapboxgl-ctrl-attrib, .mapboxgl-ctrl-logo { display: none !important }'
document.head.appendChild(style)

export type MapboxMapProps = {
  styleId?: MapboxStyleId
  center?: [number, number]
  zoom?: number
  className?: string
  terrain?: boolean
  projection?: 'mercator' | 'globe'
  hillshade?: boolean
  watermark?: string
  onMapReady?: (map: mapboxgl.Map) => void
  onMapError?: (error: string) => void
}

export function MapboxMap({
  styleId,
  center,
  zoom,
  className = '',
  terrain,
  projection,
  hillshade,
  watermark,
  onMapReady,
  onMapError,
}: MapboxMapProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const handleContainer = useCallback((node: HTMLDivElement | null) => {
    setContainer(node)
  }, [])

  const { map, isReady, error, setStyle, setTerrain, terrainEnabled, setProjection, setHillshade, hillshadeEnabled } = useMapbox({
    container,
    styleId,
    center,
    zoom,
  })

  // Apply style changes when styleId prop changes
  const prevStyleIdRef = useRef(styleId)
  useEffect(() => {
    if (!map) return
    if (prevStyleIdRef.current === styleId) return
    prevStyleIdRef.current = styleId
    setStyle(styleId!)
  }, [styleId, map, setStyle])

  // Apply terrain changes
  useEffect(() => {
    if (!map || !isReady) return
    const shouldBeOn = terrain === true
    if (shouldBeOn !== terrainEnabled) {
      setTerrain(shouldBeOn)
    }
  }, [terrain, map, isReady, terrainEnabled, setTerrain])

  // Sync projection (Globe 3D)
  useEffect(() => {
    if (!map || !isReady) return
    setProjection(projection || 'mercator')
  }, [projection, map, isReady, setProjection])

  // Sync hillshade (kontur hiking)
  useEffect(() => {
    if (!map || !isReady) return
    const shouldBeOn = hillshade === true
    if (shouldBeOn !== hillshadeEnabled) {
      setHillshade(shouldBeOn)
    }
  }, [hillshade, map, isReady, hillshadeEnabled, setHillshade])

  useEffect(() => {
    if (isReady && map && onMapReady) {
      onMapReady(map)
    }
  }, [isReady, map, onMapReady])

  useEffect(() => {
    if (error && onMapError) {
      onMapError(error)
    }
  }, [error, onMapError])

  return (
    <div className={`relative ${className}`}>
      <div ref={handleContainer} className="h-full w-full" />

      {/* Error overlay */}
      {error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-slate-900/80 p-6 text-center">
          <p className="mb-2 text-lg">🗺️</p>
          <p className="mb-1 text-sm font-semibold text-white">Mapbox Error</p>
          <p className="max-w-xs text-[11px] text-slate-300">{error}</p>
        </div>
      ) : null}

      {/* Loading overlay */}
      {!isReady && !error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-100">
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <p className="text-[11px] text-slate-500">Loading map...</p>
          </div>
        </div>
      ) : null}

      {/* Controls hint (bottom-left) */}
      {isReady && !error ? (
        <div className="absolute bottom-2 left-2 z-10">
          <div className="group relative">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[11px] text-slate-500 shadow-sm backdrop-blur transition hover:bg-white/95 hover:text-slate-700"
              title="Mouse controls"
            >
              ?
            </button>
            <div className="pointer-events-none absolute bottom-8 left-0 w-44 origin-bottom-left scale-95 rounded-lg bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-lg opacity-0 backdrop-blur transition group-hover:scale-100 group-hover:opacity-100">
              <div className="space-y-1.5">
                <p><span className="font-semibold text-slate-800">Left drag</span> — Pan</p>
                <p><span className="font-semibold text-slate-800">Right drag</span> — Orbit 3D 🌀 <span className="text-[9px] text-slate-400">(tilt + rotate)</span></p>
                <p><span className="font-semibold text-slate-800">Scroll</span> — Zoom</p>
                <p><span className="font-semibold text-slate-800">Compass 🧭</span> — Reset north</p>
              </div>
              <div className="absolute -bottom-1 left-3 h-2 w-2 rotate-45 bg-white/95" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Custom watermark — menggantikan attribution */}
      {isReady && !error && watermark ? (
        <div className="absolute bottom-2 right-2 z-10 select-none rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/70 backdrop-blur">
          {watermark}
        </div>
      ) : null}
    </div>
  )
}
