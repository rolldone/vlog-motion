import type { LngLat } from './geo'

/** Checkpoint berbasis kilometer */
export type Checkpoint = {
  id: string
  km: number
  label: string
}

/** Data lengkap rute yang sudah diparse */
export type RouteData = {
  coords: LngLat[]
  fileName: string
  totalKm: number
}

/** Settings perjalanan */
export type JourneySettings = {
  startKm: number
  speed: number // km/detik
  totalKmOverride: number | '' // '' berarti pakai autoTotal
}

/** State simulasi */
export type SimulationState = 'idle' | 'playing' | 'paused' | 'finished'

/** Mapbox style yang didukung */
export type MapStyleId = 'streets' | 'satellite' | 'outdoors' | 'light' | 'dark'
