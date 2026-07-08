type CheckpointModalProps = {
  open: boolean
  point: { x: number; y: number } | null
  label: string
  onChangeLabel: (value: string) => void
  onCancel: () => void
  onSave: () => void
}

export function CheckpointModal({ open, point, label, onChangeLabel, onCancel, onSave }: CheckpointModalProps) {
  if (!open || !point) {
    return null
  }

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Checkpoint modal</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Isi label checkpoint</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Posisi checkpoint tersimpan di {point.x.toFixed(1)}%, {point.y.toFixed(1)}%.
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Label</span>
          <input
            value={label}
            onChange={(event) => onChangeLabel(event.target.value)}
            placeholder="Contoh: A, B, C"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500"
          >
            Save checkpoint
          </button>
        </div>
      </form>
    </div>
  )
}
