import type { MapboxStyleId } from '../mapbox-token'
import type { Checkpoint } from '../types'
import type { LngLat } from '../geo'

// ── Props ────────────────────────────────────────────────────
export type AdminPanelProps = {
  /** Route state */
  routeText: string
  setRouteText: (v: string) => void
  fileName: string
  coords: LngLat[]
  autoTotal: number
  parseError: string
  onFile: (file: File) => void
  onApplyRoute: (text: string) => void

  /** Journey settings */
  totalKmOverride: number | ''
  setTotalKmOverride: (v: number | '') => void
  startKm: number
  setStartKm: (v: number) => void
  speed: number
  setSpeed: (v: number) => void

  /** Checkpoints */
  checkpoints: Checkpoint[]
  newKm: string
  setNewKm: (v: string) => void
  newLabel: string
  setNewLabel: (v: string) => void
  onAddCheckpoint: () => void
  onRemoveCheckpoint: (id: string) => void
  hasRoute: boolean

  /** Map modes */
  mapStyle: MapboxStyleId
  setMapStyle: (v: MapboxStyleId) => void
  terrainEnabled: boolean
  setTerrainEnabled: (v: boolean | ((p: boolean) => boolean)) => void
  globeEnabled: boolean
  setGlobeEnabled: (v: boolean | ((p: boolean) => boolean)) => void
  konturEnabled: boolean
  setKonturEnabled: (v: boolean | ((p: boolean) => boolean)) => void
  watermark: string
  setWatermark: (v: string) => void

  /** Simulation */
  isPlaying: boolean
  setIsPlaying: (v: boolean | ((p: boolean) => boolean)) => void
  currentKm: number
  effectiveTotal: number
  viewMode: 'free' | 'drive' | 'top'
  setViewModeWithReset: (mode: 'free' | 'drive' | 'top') => void
  onReset: () => void
  onSeek: (km: number) => void
}

/**
 * Admin panel — semua kontrol management rute, checkpoint,
 * style map, dan simulasi. Zero map logic, pure UI.
 */
export function AdminPanel({
  routeText, setRouteText, fileName, coords, autoTotal, parseError,
  onFile, onApplyRoute,
  totalKmOverride, setTotalKmOverride, startKm, setStartKm, speed, setSpeed,
  checkpoints, newKm, setNewKm, newLabel, setNewLabel,
  onAddCheckpoint, onRemoveCheckpoint, hasRoute,
  mapStyle, setMapStyle, terrainEnabled, setTerrainEnabled,
  globeEnabled, setGlobeEnabled, konturEnabled, setKonturEnabled,
  watermark, setWatermark,
  isPlaying, setIsPlaying, currentKm, effectiveTotal,
  viewMode, setViewModeWithReset, onReset, onSeek,
}: AdminPanelProps) {
  return (
    <div className="space-y-4">
      {/* Route Input */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-800">Route Input</h3>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Upload file (.geojson / .gpx)</span>
            <input
              type="file"
              accept=".geojson,.json,.gpx,application/geo+json,application/gpx+xml"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onFile(f)
              }}
              className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-700"
            />
          </label>
          {fileName && (
            <p className="text-xs text-slate-500">File: {fileName}</p>
          )}
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Atau tempel GeoJSON/GPX</span>
            <textarea
              value={routeText}
              onChange={(e) => setRouteText(e.target.value)}
              rows={4}
              placeholder='{"type":"Feature",...}  atau  <gpx>...</gpx>'
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-mono text-[11px] text-slate-700"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onApplyRoute(routeText)}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Parse Route
            </button>
            {coords.length > 0 && (
              <span className="self-center text-xs text-emerald-600">
                {coords.length} titik · {autoTotal.toFixed(2)} km
              </span>
            )}
          </div>
          {parseError && (
            <p className="text-xs text-rose-600">{parseError}</p>
          )}
        </div>
      </section>

      {/* Journey Settings */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-800">Journey Settings</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Total distance (km)</span>
            <input
              type="number"
              step="0.01"
              value={totalKmOverride === '' ? autoTotal.toFixed(2) : totalKmOverride}
              onChange={(e) =>
                setTotalKmOverride(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Start km</span>
            <input
              type="number"
              step="0.01"
              value={startKm}
              onChange={(e) => setStartKm(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700"
            />
          </label>
          <label className="block col-span-2">
            <span className="text-xs font-medium text-slate-600">Speed (km/detik)</span>
            <input
              type="number"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700"
            />
          </label>
        </div>
      </section>

      {/* Checkpoints */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-800">Checkpoints (by km)</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="km"
            value={newKm}
            onChange={(e) => setNewKm(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 p-2 text-xs text-slate-700"
          />
          <input
            type="text"
            placeholder="label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 p-2 text-xs text-slate-700"
          />
          <button
            onClick={onAddCheckpoint}
            disabled={!hasRoute}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-40"
          >
            Add
          </button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {checkpoints.length === 0 && (
            <li className="text-xs text-slate-400">Belum ada checkpoint.</li>
          )}
          {checkpoints.map((cp) => (
            <li
              key={cp.id}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs text-slate-700"
            >
              <span>
                <span className="font-semibold text-sky-700">km {cp.km}</span> · {cp.label}
              </span>
              <button
                onClick={() => onRemoveCheckpoint(cp.id)}
                className="text-rose-500 hover:text-rose-700"
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Map mode controls */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-800">Map Display</h3>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Watermark</span>
            <input
              type="text"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
              placeholder="donis_outdoor<-"
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {(['streets', 'satellite', 'outdoors', 'light', 'dark'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setMapStyle(s)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
                mapStyle === s
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="mx-1 text-slate-200">|</span>
          <button
            type="button"
            onClick={() => setGlobeEnabled((p) => !p)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
              globeEnabled
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
            title={globeEnabled ? 'Kembali ke flat map' : 'Aktifkan globe 3D (seperti Google Earth)'}
          >
            🌍 Globe
          </button>
          <button
            type="button"
            onClick={() => setKonturEnabled((p) => !p)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
              konturEnabled
                ? 'bg-amber-700 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
            title={konturEnabled ? 'Nonaktifkan overlay kontur' : 'Tampilkan hillshade / kontur relief'}
          >
            🗺️ Kontur
          </button>
          <span className="mx-1 text-slate-200">|</span>
          <button
            type="button"
            onClick={() => setTerrainEnabled((p) => !p)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
              terrainEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
            title={terrainEnabled ? 'Nonaktifkan 3D terrain' : 'Aktifkan 3D terrain'}
          >
            🏔 3D Terrain
          </button>
        </div>
      </section>

      {/* Simulation controls */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-800">Simulation</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              disabled={!hasRoute}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={onReset}
              disabled={!hasRoute}
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-40"
            >
              ⏹ Reset
            </button>
            {/* View mode buttons */}
            <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewModeWithReset('drive')}
                disabled={!hasRoute}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                  viewMode === 'drive'
                    ? 'bg-amber-500 text-white shadow'
                    : 'text-slate-500 hover:text-slate-700'
                } disabled:opacity-40`}
                title='Drive view — follow actor (fixed angle, no rotation)'
              >
                🚗 Drive
              </button>
              <button
                type="button"
                onClick={() => setViewModeWithReset('top')}
                disabled={!hasRoute}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                  viewMode === 'top'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-500 hover:text-slate-700'
                } disabled:opacity-40`}
                title='Top-down view &ndash; bird&rsquo;s eye follow'
              >
                🛰️ Top
              </button>
              <button
                type="button"
                onClick={() => setViewModeWithReset('free')}
                disabled={!hasRoute}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                  viewMode === 'free'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-500 hover:text-slate-700'
                } disabled:opacity-40`}
                title='Free view — kontrol kamera bebas'
              >
                🖐 Free
              </button>
            </div>
            <span className="ml-auto text-xs text-slate-600">
              km {currentKm.toFixed(2)} / {effectiveTotal.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={effectiveTotal || 0}
            step={0.01}
            value={currentKm}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            disabled={!hasRoute}
            className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500"
          />
        </div>
      </section>
    </div>
  )
}
