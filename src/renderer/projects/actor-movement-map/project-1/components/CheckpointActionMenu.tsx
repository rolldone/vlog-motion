import type { Checkpoint } from '../types'

type CheckpointActionMenuProps = {
  checkpoint: Checkpoint
  onDelete: (checkpointId: string) => void
  onEditLabel: (checkpoint: Checkpoint) => void
  onChangeIcon?: () => void
  onConnect: (checkpointId: string) => void
  onAcceptConnect?: () => void
  onNewLine?: () => void
  onClose: () => void
}

export function CheckpointActionMenu({
  checkpoint,
  onDelete,
  onEditLabel,
  onChangeIcon,
  onConnect,
  onAcceptConnect,
  onNewLine,
  onClose,
}: CheckpointActionMenuProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
    <div
      className="min-w-44 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Checkpoint {checkpoint.label}
      </div>
      <div className="flex flex-wrap gap-2">
        {onAcceptConnect ? (
          <>
            <button
              type="button"
              onClick={onAcceptConnect}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Accept connect
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onConnect(checkpoint.id)}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Connect
            </button>
            {onNewLine ? (
              <button
                type="button"
                onClick={onNewLine}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                New line
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onEditLabel(checkpoint)}
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Edit label
            </button>
            {onChangeIcon ? (
              <button
                type="button"
                onClick={onChangeIcon}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                🎨 Icon
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDelete(checkpoint.id)}
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
          </>
        )}
      </div>
    </div>
    </div>
  )
}