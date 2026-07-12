// ─── Map Panel — menampilkan MapView read-only di fullscreen ───
// Data bersumber dari localStorage yang diisi oleh MapAdminPage (admin mode)

import { MapView } from '../../../actor-movement-map/project-4/components/MapView'
import type { LngLat } from '../../../actor-movement-map/project-4/geo'
import type { MapboxStyleId } from '../../../actor-movement-map/project-4/mapbox-token'
import type { Checkpoint } from '../../../actor-movement-map/project-4/types'

type MapPanelProps = {
  embedded?: boolean
}

export function MapPanel({ embedded }: MapPanelProps) {
  // ── Helper baca dari localStorage ────────────────────────────
  const read = (key: string, fallback: string) => {
    try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
  }
  const readBool = (key: string, fallback: boolean) => {
    try {
      const v = localStorage.getItem(key)
      return v !== null ? v === 'true' : fallback
    } catch { return fallback }
  }
  const readJson = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? (JSON.parse(saved) as T) : fallback
    } catch { return fallback }
  }

  // Baca data dari localStorage (diisi oleh MapAdminPage)
  const coords: LngLat[] = readJson<LngLat[]>('map-route-coords', [])
  const checkpoints: Checkpoint[] = readJson<Checkpoint[]>('map-checkpoints', [])
  const currentKm = Number(read('map-current-km', '0'))
  const totalKm = Number(read('map-total-km', '0'))

  // Baca display settings dari localStorage
  const mapStyle = read('map-style', 'outdoors') as MapboxStyleId
  const terrainEnabled = readBool('map-terrain', false)
  const globeEnabled = readBool('map-globe', false)
  const konturEnabled = readBool('map-kontur', false)
  const watermark = read('map-watermark', 'donis_outdoor<-')

  // Kalo belum ada rute
  if (!coords.length) {
    return (
      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-5xl text-white/20">🗺️</span>
        <p className="text-sm font-semibold text-white/60">Belum ada rute</p>
        <p className="max-w-xs text-xs text-white/30">
          Atur rute di admin dulu ya (tab Map).
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 pt-2">
      {/* Header info */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <span className="font-semibold text-orange-400">🗺️ Route</span>
        <span className="text-white/30">|</span>
        <span>{totalKm.toFixed(1)} km</span>
        <span className="text-white/30">|</span>
        <span>Pos: {currentKm.toFixed(1)} km</span>
      </div>

      {/* Map view — read-only */}
      <div className="h-[34rem] overflow-hidden rounded-xl border border-white/10">
        <MapView
          coords={coords}
          checkpoints={checkpoints}
          currentKm={currentKm}
          totalKm={totalKm}
          viewMode="free"
          isPlaying={false}
          terrainEnabled={terrainEnabled}
          globeEnabled={globeEnabled}
          konturEnabled={konturEnabled}
          mapStyle={mapStyle}
          watermark={watermark}
        />
      </div>
    </div>
  )
}
