/**
 * Mapbox Access Token
 *
 * Diambil dari environment variable `VITE_MAPBOX_TOKEN` (via `.env` file).
 * Isi di `.env` di root project:
 *   VITE_MAPBOX_TOKEN=pk.ey...
 */

export const MAPBOX_TOKEN: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env as Record<string, string>)['VITE_MAPBOX_TOKEN']) ||
  ''

export const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const

export type MapboxStyleId = keyof typeof MAPBOX_STYLES
