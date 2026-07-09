/**
 * Mapbox Access Token
 *
 * Dapatkan token gratis di https://account.mapbox.com/
 * - Bikin akun → Dashboard → Create a token
 * - Pilih scope minimal: "Public scopes" (tilesets:read, styles:read, fonts:read)
 * - Copy token ke bawah
 *
 * ⚠️ Untuk production, jangan hardcode — gunakan environment variable.
 *    Contoh: process.env.MAPBOX_TOKEN atau file .env
 */

export const MAPBOX_TOKEN: string =
  (typeof process !== 'undefined' && (process.env as Record<string, string>)['MAPBOX_TOKEN']) ||
  ''

export const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const

export type MapboxStyleId = keyof typeof MAPBOX_STYLES
