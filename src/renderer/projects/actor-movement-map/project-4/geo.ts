import { along, bearing, length, lineString } from '@turf/turf'

export type LngLat = [number, number]

function toLine(coords: LngLat[]) {
  return lineString(coords)
}

export function lineLengthKm(coords: LngLat[]): number {
  if (coords.length < 2) return 0
  return length(toLine(coords), { units: 'kilometers' })
}

export function alongKm(coords: LngLat[], km: number): LngLat {
  if (coords.length === 0) return [0, 0]
  if (coords.length === 1) return coords[0]
  const clamped = Math.max(0, km)
  const pt = along(toLine(coords), clamped, { units: 'kilometers' })
  return pt.geometry.coordinates as LngLat
}

export function bearingAtKm(coords: LngLat[], km: number, lookAhead = 0.1): number {
  if (coords.length < 2) return 0
  const a = alongKm(coords, km)
  const b = alongKm(coords, km + lookAhead)
  return bearing(a, b)
}

export type Bounds = {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

export function getBounds(coords: LngLat[]): Bounds {
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  }
}

export function project(
  c: LngLat,
  b: Bounds,
  w = 100,
  h = 100,
  pad = 5,
): [number, number] {
  const dx = b.maxLng - b.minLng || 1
  const dy = b.maxLat - b.minLat || 1
  const x = pad + ((c[0] - b.minLng) / dx) * (w - 2 * pad)
  const y = h - pad - ((c[1] - b.minLat) / dy) * (h - 2 * pad)
  return [x, y]
}

export function parseGeoJSON(text: string): LngLat[] {
  const gj = JSON.parse(text)
  const lines: LngLat[][] = []
  const collect = (geom: any) => {
    if (!geom) return
    if (geom.type === 'LineString') lines.push(geom.coordinates)
    else if (geom.type === 'MultiLineString') geom.coordinates.forEach((c: any) => lines.push(c))
    else if (geom.type === 'Feature') collect(geom.geometry)
    else if (geom.type === 'FeatureCollection') geom.features.forEach((f: any) => collect(f.geometry))
    else if (geom.type === 'GeometryCollection') geom.geometries.forEach(collect)
  }
  collect(gj)
  if (lines.length === 0) throw new Error('No LineString found in GeoJSON')
  return lines[0]
}

export function parseGpx(text: string): LngLat[] {
  const tagRe = /<trkpt[^>]*>/g
  const coords: LngLat[] = []
  let m
  while ((m = tagRe.exec(text))) {
    const tag = m[0]
    const lat = /lat="([-\d.]+)"/.exec(tag)
    const lon = /lon="([-\d.]+)"/.exec(tag)
    if (lat && lon) coords.push([parseFloat(lon[1]), parseFloat(lat[1])])
  }
  return coords
}

export function parseRoute(text: string): LngLat[] {
  const t = text.trim()
  if (t.startsWith('{') || t.startsWith('[')) return parseGeoJSON(t)
  if (/<gpx|<trkpt/i.test(t)) return parseGpx(t)
  throw new Error('Format tidak dikenali (bukan GeoJSON/GPX)')
}
