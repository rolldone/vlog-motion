import type { CSSProperties } from 'react'
import type { MapPoint } from '../types'

type PointPopupProps = {
  mapPoint: MapPoint
  onConnect: (mapPointId: string) => void
  onEditLabel: (mapPoint: MapPoint) => void
  onDelete: (mapPointId: string) => void
  onClose: () => void
  style?: CSSProperties
}

export function PointPopup({
  mapPoint,
  onConnect,
  onEditLabel,
  onDelete,
  onClose,
  style,
}: PointPopupProps) {
  return (
    <div
      className="absolute z-40 min-w-44 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
      style={style}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Point {mapPoint.label}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onConnect(mapPoint.id)}
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Connect
        </button>
        <button
          type="button"
          onClick={() => onEditLabel(mapPoint)}
          className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
        >
          Edit label
        </button>
        <button
          type="button"
          onClick={() => onDelete(mapPoint.id)}
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Close
        </button>
      </div>
    </div>
  )
}
