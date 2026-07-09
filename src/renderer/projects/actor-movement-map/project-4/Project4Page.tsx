import { useEffect, useMemo, useRef, useState } from 'react'
import {
  alongKm,
  getBounds,
  lineLengthKm,
  parseRoute,
  project,
  type Bounds,
  type LngLat,
} from './geo'

type Checkpoint = {
  id: string
  km: number
  label: string
}

let idCounter = 0
const nextId = () => `cp-${++idCounter}`

export function Project4Page() {
  const [routeText, setRouteText] = useState('')
  const [fileName, setFileName] = useState('')
  const [coords, setCoords] = useState<LngLat[]>([])
  const [parseError, setParseError] = useState('')

  const [totalKmOverride, setTotalKmOverride] = useState<number | ''>('')
  const [startKm, setStartKm] = useState(0)
  const [speed, setSpeed] = useState(1)

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [newKm, setNewKm] = useState('')
  const [newLabel, setNewLabel] = useState('')

  const [currentKm, setCurrentKm] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)

  const autoTotal = useMemo(() => (coords.length ? lineLengthKm(coords) : 0), [coords])
  const effectiveTotal = totalKmOverride === '' ? autoTotal : (totalKmOverride as number)

  const bounds: Bounds | null = useMemo(
    () => (coords.length ? getBounds(coords) : null),
    [coords],
  )

  const routePoints = useMemo(() => {
    if (!bounds) return ''
    return coords
      .map((c) => {
        const [x, y] = project(c, bounds)
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }, [coords, bounds])

  const checkpointPoints = useMemo(() => {
    if (!bounds) return []
    return checkpoints.map((cp) => ({
      ...cp,
      pos: project(alongKm(coords, cp.km), bounds),
    }))
  }, [checkpoints, coords, bounds])

  const actorPos = useMemo<[number, number] | null>(() => {
    if (!bounds || !coords.length) return null
    return project(alongKm(coords, currentKm), bounds)
  }, [currentKm, coords, bounds])

  useEffect(() => {
    if (!isPlaying || !effectiveTotal) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setCurrentKm((prev) => {
        const next = prev + speed * dt
        if (next >= effectiveTotal) {
          setIsPlaying(false)
          return effectiveTotal
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, effectiveTotal, speed])

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    applyRoute(text)
  }

  const applyRoute = (text: string) => {
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
  }

  const addCheckpoint = () => {
    const km = parseFloat(newKm)
    if (!coords.length || Number.isNaN(km) || km < 0 || km > effectiveTotal) return
    setCheckpoints((prev) => [
      ...prev,
      { id: nextId(), km, label: newLabel.trim() || `Km ${km}` },
    ])
    setNewKm('')
    setNewLabel('')
  }

  const removeCheckpoint = (id: string) => {
    setCheckpoints((prev) => prev.filter((c) => c.id !== id))
  }

  const resetPreview = () => {
    setIsPlaying(false)
    setCurrentKm(startKm)
  }

  return (
    <div className="space-y-4">
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

      <div className="space-y-4">
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
                  if (f) handleFile(f)
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
                onClick={() => applyRoute(routeText)}
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
      </div>

      <div className="space-y-4">
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
              onClick={addCheckpoint}
              disabled={!coords.length}
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
                  onClick={() => removeCheckpoint(cp.id)}
                  className="text-rose-500 hover:text-rose-700"
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-800">Preview</h3>
          <div className="mt-3">
            <svg
              viewBox="0 0 100 100"
              className="w-full rounded-xl border border-slate-200 bg-white"
              style={{ aspectRatio: '1 / 1' }}
            >
              {routePoints && (
                <polyline
                  points={routePoints}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {checkpointPoints.map((cp) => (
                <circle
                  key={cp.id}
                  cx={cp.pos[0]}
                  cy={cp.pos[1]}
                  r={2.2}
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth={0.6}
                />
              ))}
              {actorPos && (
                <circle cx={actorPos[0]} cy={actorPos[1]} r={2.6} fill="#ef4444" />
              )}
            </svg>
            {!coords.length && (
              <p className="mt-2 text-xs text-slate-400">Belum ada route untuk preview.</p>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                disabled={!coords.length}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={resetPreview}
                disabled={!coords.length}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-40"
              >
                Reset
              </button>
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
              onChange={(e) => {
                setIsPlaying(false)
                setCurrentKm(parseFloat(e.target.value))
              }}
              disabled={!coords.length}
              className="w-full"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
