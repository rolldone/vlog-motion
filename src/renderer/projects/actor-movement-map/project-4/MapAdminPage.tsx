import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { lineLengthKm, parseRoute, type LngLat } from './geo'
import { MapView } from './components/MapView'
import { AdminPanel } from './components/AdminPanel'
import type { MapboxStyleId } from './mapbox-token'
import type { Checkpoint } from './types'

let idCounter = 0
const nextId = () => `cp-${++idCounter}`

/**
 * MapAdminPage — state owner / orchestrator.
 *
 * Layout: sidebar (admin panel) + main area (map preview).
 * Semua state management ada di sini, lalu di-pass ke
 * MapView (map render) dan AdminPanel (kontrol panel).
 */
function readJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch { return fallback }
}
function readNum(key: string, fallback: number): number {
  try {
    const saved = localStorage.getItem(key)
    return saved ? Number(saved) : fallback
  } catch { return fallback }
}
function readStr(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? v === 'true' : fallback
  } catch { return fallback }
}

export function MapAdminPage() {
  // ── Route state (init from localStorage biar gak ilang pas exit fullscreen) ─
  const [routeText, setRouteText] = useState(() => readStr('map-route-text', ''))
  const [fileName, setFileName] = useState(() => readStr('map-file-name', ''))
  const [coords, setCoords] = useState<LngLat[]>(() => readJson<LngLat[]>('map-route-coords', []))
  const [parseError, setParseError] = useState('')

  // ── Journey settings ───────────────────────────────────────
  const [totalKmOverride, setTotalKmOverride] = useState<number | ''>('')
  const [startKm, setStartKm] = useState(0)
  const [speed, setSpeed] = useState(1)

  // ── Checkpoints ────────────────────────────────────────────
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => readJson<Checkpoint[]>('map-checkpoints', []))
  const [newKm, setNewKm] = useState('')
  const [newLabel, setNewLabel] = useState('')

  // ── Simulation ─────────────────────────────────────────────
  const [currentKm, setCurrentKm] = useState(() => readNum('map-current-km', 0))
  const [isPlaying, setIsPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)

  // ── Map display ────────────────────────────────────────────
  const [mapStyle, setMapStyle] = useState<MapboxStyleId>(() => readStr('map-style', 'outdoors') as MapboxStyleId)
  const [terrainEnabled, setTerrainEnabled] = useState(() => readBool('map-terrain', true))
  const [globeEnabled, setGlobeEnabled] = useState(() => readBool('map-globe', false))
  const [konturEnabled, setKonturEnabled] = useState(() => readBool('map-kontur', false))
  const [viewMode, setViewMode] = useState<'free' | 'drive' | 'top'>('free')
  const [watermark, setWatermark] = useState(() => readStr('map-watermark', 'donis_outdoor<-'))

  const autoTotal = useMemo(() => (coords.length ? lineLengthKm(coords) : 0), [coords])
  const effectiveTotal = totalKmOverride === '' ? autoTotal : (totalKmOverride as number)
  const hasRoute = coords.length > 0

  // ── Persist to localStorage for fullscreen MapPanel ──────────
  useEffect(() => {
    localStorage.setItem('map-route-coords', JSON.stringify(coords))
  }, [coords])
  useEffect(() => {
    localStorage.setItem('map-checkpoints', JSON.stringify(checkpoints))
  }, [checkpoints])
  useEffect(() => {
    localStorage.setItem('map-current-km', String(currentKm))
  }, [currentKm])
  useEffect(() => {
    localStorage.setItem('map-total-km', String(effectiveTotal))
  }, [effectiveTotal])
  useEffect(() => {
    localStorage.setItem('map-style', mapStyle)
  }, [mapStyle])
  useEffect(() => {
    localStorage.setItem('map-terrain', String(terrainEnabled))
  }, [terrainEnabled])
  useEffect(() => {
    localStorage.setItem('map-globe', String(globeEnabled))
  }, [globeEnabled])
  useEffect(() => {
    localStorage.setItem('map-kontur', String(konturEnabled))
  }, [konturEnabled])
  useEffect(() => {
    localStorage.setItem('map-watermark', watermark)
  }, [watermark])
  useEffect(() => {
    localStorage.setItem('map-route-text', routeText)
  }, [routeText])
  useEffect(() => {
    localStorage.setItem('map-file-name', fileName)
  }, [fileName])

  // ── RAF simulation loop ────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !effectiveTotal) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setCurrentKm((prev) => {
        const next = prev + speed * dt
        if (next >= effectiveTotal) { setIsPlaying(false); return effectiveTotal }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying, effectiveTotal, speed])

  // ── File handling ──────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    applyRoute(text)
  }, [])

  const applyRoute = useCallback((text: string) => {
    setParseError('')
    try {
      const parsed = parseRoute(text)
      if (parsed.length < 2) throw new Error('Route kurang dari 2 titik')
      setCoords(parsed)
      setRouteText(text)
      setCurrentKm(0)
      setCheckpoints([])
      setTotalKmOverride('')
    } catch (e) {
      setParseError((e as Error).message)
    }
  }, [])

  // ── Checkpoint handlers ────────────────────────────────────
  const addCheckpoint = useCallback(() => {
    const km = parseFloat(newKm)
    if (!coords.length || Number.isNaN(km) || km < 0 || km > effectiveTotal) return
    setCheckpoints((prev) => [
      ...prev,
      { id: nextId(), km, label: newLabel.trim() || `Km ${km}` },
    ])
    setNewKm('')
    setNewLabel('')
  }, [newKm, newLabel, coords.length, effectiveTotal])

  const removeCheckpoint = useCallback((id: string) => {
    setCheckpoints((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // ── Simulation handlers ────────────────────────────────────
  const resetPreview = useCallback(() => {
    setIsPlaying(false)
    setCurrentKm(startKm)
  }, [startKm])

  const seekKm = useCallback((km: number) => {
    setIsPlaying(false)
    setCurrentKm(km)
  }, [])

  const setViewModeWithReset = useCallback((mode: 'free' | 'drive' | 'top') => {
    if (mode === 'free') {
      // Reset camera when going back to free — MapView handles pitch reset
    }
    setViewMode(mode)
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
          Project 4
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Route Progression
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Kelola rute perjalanan berbasis jarak (km) dari file GPX / GeoJSON.
        </p>
      </div>

      {/* Layout: vertical — admin on top, map below */}
      <div className="space-y-4">
        {/* Admin panel (top) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <AdminPanel
            routeText={routeText}
            setRouteText={setRouteText}
            fileName={fileName}
            coords={coords}
            autoTotal={autoTotal}
            parseError={parseError}
            onFile={handleFile}
            onApplyRoute={applyRoute}
            totalKmOverride={totalKmOverride}
            setTotalKmOverride={setTotalKmOverride}
            startKm={startKm}
            setStartKm={setStartKm}
            speed={speed}
            setSpeed={setSpeed}
            checkpoints={checkpoints}
            newKm={newKm}
            setNewKm={setNewKm}
            newLabel={newLabel}
            setNewLabel={setNewLabel}
            onAddCheckpoint={addCheckpoint}
            onRemoveCheckpoint={removeCheckpoint}
            hasRoute={hasRoute}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            terrainEnabled={terrainEnabled}
            setTerrainEnabled={setTerrainEnabled}
            globeEnabled={globeEnabled}
            setGlobeEnabled={setGlobeEnabled}
            konturEnabled={konturEnabled}
            setKonturEnabled={setKonturEnabled}
            watermark={watermark}
            setWatermark={setWatermark}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentKm={currentKm}
            effectiveTotal={effectiveTotal}
            viewMode={viewMode}
            setViewModeWithReset={setViewModeWithReset}
            onReset={resetPreview}
            onSeek={seekKm}
          />
        </div>

        {/* Map area (bottom, full width) */}
        <div className="min-h-[400px]">
          {!hasRoute ? (
            <div className="flex h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="text-center">
                <p className="text-2xl">🗺️</p>
                <p className="mt-2 text-sm font-medium text-slate-400">
                  Import file GPX / GeoJSON dulu
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  Map akan tampil setelah rute diparse
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[400px] overflow-hidden rounded-xl border border-slate-200 lg:h-[600px]">
              <MapView
                coords={coords}
                checkpoints={checkpoints}
                currentKm={currentKm}
                totalKm={effectiveTotal}
                viewMode={viewMode}
                isPlaying={isPlaying}
                terrainEnabled={terrainEnabled}
                globeEnabled={globeEnabled}
                konturEnabled={konturEnabled}
                mapStyle={mapStyle}
                watermark={watermark}
                onMapError={(err) => setParseError(err)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
