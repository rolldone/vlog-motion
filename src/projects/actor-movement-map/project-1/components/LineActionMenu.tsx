import { useState, type CSSProperties } from 'react'
import type { WalkingPoint } from '../types'

const LINE_COLORS = [
  '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#ec4899', '#0ea5e9', '#f97316', '#64748b', '#14b8a6',
]
const LINE_STYLES = [
  { id: 'solid' as const, label: 'Solid' },
  { id: 'dashed' as const, label: 'Dashed' },
  { id: 'dotted' as const, label: 'Dotted' },
]
const LINE_WIDTHS = [
  { id: 0.7, label: 'Thin' },
  { id: 1.2, label: 'Normal' },
  { id: 2.0, label: 'Thick' },
]

type LineStyleValue = { color?: string; lineStyle?: 'solid' | 'dashed' | 'dotted'; width?: number; opacity?: number; glow?: boolean }

type LineActionMenuProps = {
  label?: string
  /** Current line style values — if provided, enables inline style editor */
  lineStyle?: LineStyleValue
  onLineStyleChange?: (patch: LineStyleValue) => void
  onStartLine?: () => void
  onAddPoint?: () => void
  onConnect?: () => void
  onCheckpoint?: () => void
  onAddWalking?: () => void
  walkingPointCount?: number
  walkingPoints?: WalkingPoint[]
  onDeleteWalkingPoint?: (wpId: string) => void
  onDeletePoint?: () => void
  onDelete: () => void
  onClose: () => void
  style?: CSSProperties
}

export function LineActionMenu({
  label = 'Line action',
  lineStyle,
  onLineStyleChange,
  onStartLine,
  onAddPoint,
  onConnect,
  onCheckpoint,
  onAddWalking,
  walkingPointCount,
  walkingPoints,
  onDeleteWalkingPoint,
  onDeletePoint,
  onDelete,
  onClose,
  style: _style,
}: LineActionMenuProps) {
  const [showStyle, setShowStyle] = useState(false)
  const color = lineStyle?.color ?? '#10b981'
  const lineType = lineStyle?.lineStyle ?? 'solid'
  const width = lineStyle?.width ?? 0.9
  const opacity = lineStyle?.opacity ?? 1
  const glow = lineStyle?.glow ?? true

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
    <div
      className="min-w-44 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {onConnect ? (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Connect
          </button>
        ) : null}
        {onCheckpoint ? (
          <button
            type="button"
            onClick={onCheckpoint}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Checkpoint
          </button>
        ) : null}
        {onStartLine ? (
          <button
            type="button"
            onClick={onStartLine}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Start line
          </button>
        ) : null}
        {onAddPoint ? (
          <button
            type="button"
            onClick={onAddPoint}
            className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            Add point
          </button>
        ) : null}
        {onAddWalking ? (
          <button
            type="button"
            onClick={onAddWalking}
            className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
          >
            🚶 Add walking{walkingPointCount != null && walkingPointCount > 0 ? ` (${walkingPointCount})` : ''}
          </button>
        ) : null}
        {onDeletePoint ? (
          <button
            type="button"
            onClick={onDeletePoint}
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            Delete point
          </button>
        ) : null}
        {onLineStyleChange ? (
          <button
            type="button"
            onClick={() => setShowStyle((v) => !v)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              showStyle
                ? 'border-violet-400 bg-violet-500 text-white'
                : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
            }`}
          >
            🎨 Style
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Delete line
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {/* inline style editor */}
      {showStyle && onLineStyleChange ? (
        <div className="mt-2 border-t border-slate-100 pt-2">
          {/* color */}
          <div className="mb-2">
            <div className="mb-1 text-[10px] font-medium text-slate-400">Color</div>
            <div className="mb-1.5 flex flex-wrap gap-1">
              {LINE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onLineStyleChange({ color: c })}
                  className={`h-5 w-5 rounded-full border-2 transition ${
                    color === c ? 'border-slate-800 scale-110' : 'border-white hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={color}
                onChange={(e) => onLineStyleChange({ color: e.target.value })}
                className="h-5 w-5 cursor-pointer rounded border-0 p-0"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onLineStyleChange({ color: v })
                }}
                onBlur={(e) => {
                  if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onLineStyleChange({ color })
                }}
                className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 outline-none focus:border-sky-400"
                maxLength={7}
                spellCheck={false}
              />
            </div>
          </div>

          {/* style */}
          <div className="mb-2">
            <div className="mb-1 text-[10px] font-medium text-slate-400">Style</div>
            <div className="flex gap-1">
              {LINE_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onLineStyleChange({ lineStyle: s.id })}
                  className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                    lineType === s.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* opacity */}
          <div className="mb-2">
            <div className="mb-1 text-[10px] font-medium text-slate-400">Opacity</div>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => onLineStyleChange({ opacity: Number(e.target.value) })}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500"
              />
              <span className="w-9 rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5 text-center font-mono text-[10px] text-slate-700">{Math.round(opacity * 100)}%</span>
            </div>
          </div>
          <div className="mb-2">
            <div className="mb-1 text-[10px] font-medium text-slate-400">Glow</div>
            <button
              type="button"
              onClick={() => onLineStyleChange({ glow: !glow })}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${
                glow
                  ? 'bg-white text-slate-800 border border-slate-300 shadow-sm'
                  : 'bg-slate-100 text-slate-500 border border-transparent'
              }`}
            >
              {glow ? '✦ Glow ON' : '○ Glow OFF'}
            </button>
          </div>

          {/* width */}
          <div>
            <div className="mb-1 text-[10px] font-medium text-slate-400">Width</div>
            <div className="mb-1 flex gap-1">
              {LINE_WIDTHS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onLineStyleChange({ width: w.id })}
                  className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                    width === w.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={0.3}
                max={4}
                step={0.1}
                value={width}
                onChange={(e) => onLineStyleChange({ width: Number(e.target.value) })}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500"
              />
              <span className="w-9 rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5 text-center font-mono text-[10px] text-slate-700">{width.toFixed(1)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* walking points list */}
      {walkingPoints && walkingPoints.length > 0 ? (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <div className="mb-1 text-[10px] font-medium text-slate-400">Walking Points ({walkingPoints.length})</div>
          <div className="flex flex-col gap-1">
            {walkingPoints.map((wp, idx) => (
              <div key={wp.id} className="flex items-center justify-between gap-2 rounded-lg bg-purple-50 px-2 py-1">
                <span className="text-[11px] text-purple-700 font-medium">
                  WP{idx + 1} <span className="text-purple-400 font-normal">({wp.x.toFixed(1)}, {wp.y.toFixed(1)})</span>
                </span>
                {onDeleteWalkingPoint ? (
                  <button
                    type="button"
                    onClick={() => onDeleteWalkingPoint(wp.id)}
                    className="rounded-md px-1.5 py-0.5 text-[10px] text-red-500 hover:bg-red-100 transition"
                    title="Delete walking point"
                  >
                    🗑
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
    </div>
  )
}

