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
        attributionControl: true,
      })

      map.on('load', () => {
        mapRef.current = map
        setIsReady(true)
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

  const setStyle = (id: MapboxStyleId) => {
    const m = mapRef.current
    if (!m) return
    m.setStyle(MAPBOX_STYLES[id])
    m.once('style.load', () => {
      // re-add sources/layers after style change if needed
      setIsReady(true)
    })
  }

  return { map: mapRef.current, isReady, error, setStyle }
}
