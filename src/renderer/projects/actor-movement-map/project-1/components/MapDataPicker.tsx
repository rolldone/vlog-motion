import { useState, useEffect, useRef } from 'react'
import type { MapDataEntry } from '../../data'

type MapDataPickerProps = {
  availableData: MapDataEntry[]
  onSave: (name: string) => void
  onLoad: (id: string) => void
  onClose: () => void
}

export function MapDataPicker({ availableData, onSave, onLoad, onClose }: MapDataPickerProps) {
  const [tab, setTab] = useState<'load' | 'save'>('load')
  const [templateName, setTemplateName] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (tab === 'save') inputRef.current?.focus()
    else selectRef.current?.focus()
  }, [tab])

  const safeName = templateName.trim().replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '-').toLowerCase()

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex w-[360px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        {/* tabs */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setTab('load')}
            className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
              tab === 'load'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📂 Load
          </button>
          <button
            type="button"
            onClick={() => setTab('save')}
            className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
              tab === 'save'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💾 Save
          </button>
        </div>

        {/* load tab */}
        {tab === 'load' ? (
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-medium text-slate-400">Select Map Data</label>
            {availableData.length > 0 ? (
              <select
                ref={selectRef}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="" disabled>Choose a map…</option>
                {availableData.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
                No map data available yet.<br />Save some data first or add entries in data.ts.
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedId}
                onClick={() => { if (selectedId) { onLoad(selectedId); onClose() } }}
                className="rounded-lg bg-sky-500 px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40"
              >
                Load
              </button>
            </div>
          </div>
        ) : (
          /* save tab */
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-medium text-slate-400">Template Name</label>
            <input
              ref={inputRef}
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. rute-candi-prambanan"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            {templateName.trim() ? (
              <div className="text-[10px] text-slate-400">
                Preview: <span className="font-mono text-slate-600">{safeName}.json</span>
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                disabled={!templateName.trim()}
                onClick={() => { if (templateName.trim()) { onSave(templateName.trim()); onClose() } }}
                className="rounded-lg bg-sky-500 px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40"
              >
                Save JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
