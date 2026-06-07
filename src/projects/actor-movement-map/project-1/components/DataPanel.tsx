import type { Checkpoint, Line } from '../types'
import { getIconSrc } from './IconPicker'

type DataPanelProps = {
  lines: Line[]
  checkpoints: Checkpoint[]
  highlightedLineId: string | null
  highlightedCheckpointId: string | null
  onSelectLine: (lineId: string) => void
  onSelectCheckpoint: (cp: Checkpoint) => void
  onClose: () => void
}

/** Derive a friendly display name for a line from its connected checkpoints */
function lineDisplayName(line: Line, checkpoints: Checkpoint[], index: number): string {
  const cps = checkpoints
    .filter((cp) => cp.lineId === line.id)
    .sort((a, b) => a.pointIndex - b.pointIndex)
  if (cps.length >= 2) return `${cps[0].label} → ${cps[cps.length - 1].label}`
  if (cps.length === 1) return cps[0].label
  return `Line ${index + 1}`
}

/** Get endpoint labels of a line for compact info */
function lineEndpoints(line: Line, checkpoints: Checkpoint[]): string {
  const cps = checkpoints
    .filter((cp) => cp.lineId === line.id)
    .sort((a, b) => a.pointIndex - b.pointIndex)
  if (cps.length === 0) return `${line.points.length}pt`
  const first = cps[0]
  const last = cps[cps.length - 1]
  return `${first.label}–${last.label}`
}

export function DataPanel({
  lines,
  checkpoints,
  highlightedLineId,
  highlightedCheckpointId,
  onSelectLine,
  onSelectCheckpoint,
  onClose,
}: DataPanelProps) {
  return (
    <div
      id="data-panel"
      className="absolute left-3 bottom-3 z-50 max-h-[55vh] w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur"
      onClick={(e) => e.stopPropagation()}
    >
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-3 py-2.5 backdrop-blur">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Data</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      {/* lines section */}
      <div className="border-b border-slate-100 px-2 py-1.5">
        <p className="mb-0.5 px-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
          Lines · {lines.length}
        </p>
        {lines.length === 0 ? (
          <p className="py-1.5 text-center text-[10px] text-slate-400">—</p>
        ) : (
          <ul className="space-y-px">
            {lines.map((line, i) => {
              const name = lineDisplayName(line, checkpoints, i)
              const isHl = highlightedLineId === line.id
              return (
                <li key={line.id}>
                  <button
                    type="button"
                    onClick={() => onSelectLine(line.id)}
                    className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] transition ${
                      isHl ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: line.color ?? '#10b981' }} />
                    <span className="truncate font-medium">{name}</span>
                    <span className="ml-auto shrink-0 text-[9px] text-slate-400">
                      {lineEndpoints(line, checkpoints)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* checkpoints section */}
      <div className="px-2 py-1.5">
        <p className="mb-0.5 px-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-500">
          Checkpoints · {checkpoints.length}
        </p>
        {checkpoints.length === 0 ? (
          <p className="py-1.5 text-center text-[10px] text-slate-400">—</p>
        ) : (
          <ul className="space-y-px">
            {checkpoints.map((cp) => {
              const isHl = highlightedCheckpointId === cp.id
              const isFree = !cp.lineId
              return (
                <li key={cp.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCheckpoint(cp)}
                    className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] transition ${
                      isHl ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold overflow-hidden ${
                      isFree ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {getIconSrc(cp.icon) ? (
                        <img src={getIconSrc(cp.icon)} alt={cp.label} className="h-full w-full object-cover" />
                      ) : (
                        cp.label
                      )}
                    </span>
                    <span className="truncate font-medium">{cp.label}</span>
                    {isFree ? (
                      <span className="ml-auto shrink-0 text-[8px] font-medium text-amber-500">free</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
