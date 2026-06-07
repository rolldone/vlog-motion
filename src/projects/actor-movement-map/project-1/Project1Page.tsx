import { MapCanvas } from './MapCanvas'

export function Project1Page() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Project 1</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Map workspace dan actor movement.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Lemari kerja untuk percobaan pertama: checkpoint, start point, dan perpindahan actor.
        </p>
      </div>

      <MapCanvas />
    </div>
  )
}

