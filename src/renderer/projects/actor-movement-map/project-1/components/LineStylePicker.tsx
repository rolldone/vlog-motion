import type { CSSProperties } from 'react'

const LINE_COLORS = [
  { id: '#10b981', label: 'Emerald' },
  { id: '#3b82f6', label: 'Blue' },
  { id: '#ef4444', label: 'Red' },
  { id: '#f59e0b', label: 'Amber' },
  { id: '#8b5cf6', label: 'Violet' },
  { id: '#ec4899', label: 'Pink' },
  { id: '#0ea5e9', label: 'Sky' },
  { id: '#f97316', label: 'Orange' },
  { id: '#64748b', label: 'Slate' },
  { id: '#14b8a6', label: 'Teal' },
]

const LINE_STYLES = [
  { id: 'solid' as const, label: 'Solid', dash: undefined },
  { id: 'dashed' as const, label: 'Dashed', dash: '6 4' },
  { id: 'dotted' as const, label: 'Dotted', dash: '2 3' },
]

const LINE_WIDTHS = [
  { id: 0.7, label: 'Thin' },
  { id: 1.2, label: 'Normal' },
  { id: 2.0, label: 'Thick' },
]

type LineStylePickerProps = {
  color: string
  lineStyle: string
  width: number
  onChange: (patch: { color?: string; lineStyle?: 'solid' | 'dashed' | 'dotted'; width?: number }) => void
  onClose: () => void
  style?: CSSProperties
}

export function LineStylePicker({ color, lineStyle, width, onChange, onClose, style }: LineStylePickerProps) {
  return (
    <div
      className="absolute z-40 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      style={style}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Line style
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      {/* color palette */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-medium text-slate-400">Color</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {LINE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange({ color: c.id })}
              className={`h-6 w-6 rounded-full border-2 transition ${
                color === c.id ? 'border-slate-800 scale-110' : 'border-white hover:border-slate-300'
              }`}
              style={{ backgroundColor: c.id }}
              title={c.label}
            />
          ))}
        </div>
        {/* custom color */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-6 w-6 cursor-pointer rounded border-0 p-0"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange({ color: v })
            }}
            onBlur={(e) => {
              if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange({ color })
            }}
            className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            maxLength={7}
            spellCheck={false}
          />
        </div>
      </div>

      {/* line style */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-medium text-slate-400">Style</div>
        <div className="flex gap-1">
          {LINE_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ lineStyle: s.id })}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                lineStyle === s.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* width */}
      <div>
        <div className="mb-1.5 text-[10px] font-medium text-slate-400">Width</div>
        <div className="mb-2 flex gap-1">
          {LINE_WIDTHS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onChange({ width: w.id })}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                width === w.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        {/* custom width slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.3}
            max={4}
            step={0.1}
            value={width}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:shadow"
          />
          <span className="w-10 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-[11px] text-slate-700">{width.toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}
