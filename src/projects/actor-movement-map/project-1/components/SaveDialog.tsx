import { useState, useEffect, useRef } from 'react'

type SaveDialogProps = {
  onSave: (name: string) => void
  onClose: () => void
}

export function SaveDialog({ onSave, onClose }: SaveDialogProps) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) {
      onSave(trimmed)
    }
  }

  const safeName = name.trim().replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '-').toLowerCase()

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form
        onSubmit={handleSubmit}
        className="flex w-[340px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="text-sm font-bold text-slate-800">💾 Save Map Data</div>

        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Template Name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. rute-candi-prambanan"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          {name.trim() ? (
            <div className="mt-1 text-[10px] text-slate-400">
              Preview: <span className="font-mono text-slate-600">{safeName}.json</span>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-sky-500 px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40"
          >
            Save JSON
          </button>
        </div>
      </form>
    </div>
  )
}
