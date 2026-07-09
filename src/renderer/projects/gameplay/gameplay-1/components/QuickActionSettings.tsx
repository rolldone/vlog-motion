// ─── Quick Action Settings — admin panel checkboxes ───
// Admin bisa centang action mana yang muncul di QuickActionModal

import { useState } from 'react'
import { DEFAULT_QUICK_ACTIONS } from './quickActions'

function loadEnabledIds(): string[] {
  try {
    const saved = localStorage.getItem('quick-action-enabled')
    if (saved) return JSON.parse(saved)
  } catch { /* fallback */ }
  return DEFAULT_QUICK_ACTIONS.filter((a) => a.enabled).map((a) => a.id)
}

export function QuickActionSettings() {
  const [enabledIds, setEnabledIds] = useState<string[]>(loadEnabledIds)

  const toggle = (id: string) => {
    const next = enabledIds.includes(id)
      ? enabledIds.filter((x) => x !== id)
      : [...enabledIds, id]
    localStorage.setItem('quick-action-enabled', JSON.stringify(next))
    setEnabledIds(next)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quick Actions</span>
        <span className="text-[10px] text-slate-400">
          Tekan <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-600">I</kbd> di fullscreen
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {DEFAULT_QUICK_ACTIONS.map((action) => {
          const checked = enabledIds.includes(action.id)
          return (
            <label
              key={action.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition ${
                checked
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(action.id)}
                className="h-3.5 w-3.5 rounded text-orange-500 focus:ring-orange-400"
              />
              <span className="text-base">{action.icon}</span>
              <span className="text-xs font-semibold text-slate-700">{action.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
