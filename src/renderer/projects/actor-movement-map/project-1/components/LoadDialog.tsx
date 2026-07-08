import { useState, useEffect, useRef } from 'react'

type LoadDialogProps = {
  availableFiles: string[]
  onLoad: (fileName: string) => void
  onClose: () => void
}

export function LoadDialog({ availableFiles, onLoad, onClose }: LoadDialogProps) {
  const [selected, setSelected] = useState('')
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    selectRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex w-[340px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="text-sm font-bold text-slate-800">📂 Load Map Data</div>

        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Select Data File</label>
          {availableFiles.length > 0 ? (
            <select
              ref={selectRef}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              <option value="" disabled>Choose a file…</option>
              {availableFiles.map((name) => (
                <option key={name} value={name}>{name}.json</option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
              No data files found in assets/datas/
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => { if (selected) onLoad(selected) }}
            className="rounded-lg bg-sky-500 px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40"
          >
            Load
          </button>
        </div>
      </div>
    </div>
  )
}
