import { useCallback, useRef, useEffect } from 'react'
import { useMapbox, type UseMapboxOptions } from '../hooks/useMapbox'
import type { MapboxStyleId } from '../mapbox-token'
import 'mapbox-gl/dist/mapbox-gl.css'

export type MapboxMapProps = {
  styleId?: MapboxStyleId
  center?: [number, number]
  zoom?: number
  className?: string
  onMapReady?: (map: mapboxgl.Map) => void
  onMapError?: (error: string) => void
}

export function MapboxMap({
  styleId,
  center,
  zoom,
  className = '',
  onMapReady,
  onMapError,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
  }, [])

  const { map, isReady, error } = useMapbox({
    container: containerRef.current,
    styleId,
    center,
    zoom,
  })

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
    </div>
  )
}
