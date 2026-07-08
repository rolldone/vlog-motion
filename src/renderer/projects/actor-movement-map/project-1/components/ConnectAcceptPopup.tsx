import type { CSSProperties } from 'react'

type ConnectAcceptPopupProps = {
  sourceLabel: string
  targetLabel: string
  onAccept: () => void
  onClose: () => void
  style?: CSSProperties
}

export function ConnectAcceptPopup({
  sourceLabel,
  targetLabel,
  onAccept,
  onClose,
  style,
}: ConnectAcceptPopupProps) {
  return (
    <div
      className="absolute z-40 min-w-44 rounded-2xl border border-blue-200 bg-white p-3 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
      style={style}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
        Connect
      </div>
      <p className="mb-3 text-sm text-slate-600">
        Connect <span className="font-semibold text-slate-800">{sourceLabel}</span> →{' '}
        <span className="font-semibold text-slate-800">{targetLabel}</span>?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Accept
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
