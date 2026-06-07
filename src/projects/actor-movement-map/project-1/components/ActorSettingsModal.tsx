import { useState } from 'react'
import { CHECKPOINT_ICONS } from './IconPicker'
import { BACKGROUND_LIST } from '../backgrounds'

type Tab = 'actor' | 'background'

type ActorSettingsModalProps = {
  actorIcon?: string
  actorShape: 'circle' | 'square' | 'rounded' | 'diamond' | 'none'
  actorSize: number
  actorBorder: 'none' | 'thin' | 'normal' | 'thick'
  backgroundId: string
  backgroundColor: string
  onChangeIcon: (icon: string | null) => void
  onChangeShape: (shape: 'circle' | 'square' | 'rounded' | 'diamond' | 'none') => void
  onChangeSize: (size: number) => void
  onChangeBorder: (border: 'none' | 'thin' | 'normal' | 'thick') => void
  onChangeBackground: (id: string) => void
  onChangeBackgroundColor: (color: string) => void
  onClose: () => void
}

const SHAPES = [
  { id: 'circle' as const, label: '●', title: 'Circle' },
  { id: 'square' as const, label: '■', title: 'Square' },
  { id: 'rounded' as const, label: '▢', title: 'Rounded' },
  { id: 'diamond' as const, label: '◆', title: 'Diamond' },
  { id: 'none' as const, label: '✕', title: 'No wrapper' },
]
const BORDERS = [
  { id: 'none' as const, label: '✕', title: 'No border' },
  { id: 'thin' as const, label: '—', title: 'Thin' },
  { id: 'normal' as const, label: '━', title: 'Normal' },
  { id: 'thick' as const, label: '▬', title: 'Thick' },
]

const COLOR_PRESETS = [
  { id: '#ffffff', label: 'White' },
  { id: '#f3f4f6', label: 'Gray-100' },
  { id: '#e5e7eb', label: 'Gray-200' },
  { id: '#000000', label: 'Black' },
  { id: '#dcfce7', label: 'Green' },
  { id: '#dbeafe', label: 'Blue' },
  { id: '#fef3c7', label: 'Amber' },
  { id: '#fde68a', label: 'Yellow' },
  { id: '#fed7aa', label: 'Orange' },
  { id: '#e9d5ff', label: 'Purple' },
  { id: '#fecdd3', label: 'Rose' },
  { id: '#d1fae5', label: 'Emerald' },
]

export function ActorSettingsModal({
  actorIcon,
  actorShape,
  actorSize,
  actorBorder,
  backgroundId,
  backgroundColor,
  onChangeIcon,
  onChangeShape,
  onChangeSize,
  onChangeBorder,
  onChangeBackground,
  onChangeBackgroundColor,
  onClose,
}: ActorSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('actor')

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onMouseUp={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex w-[360px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ⚙️ Settings
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* tab bar */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {([
            { id: 'actor' as const, label: '🎭 Actor' },
            { id: 'background' as const, label: '🎨 Background' },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Actor Tab ── */}
        {activeTab === 'actor' && (
          <>
            {/* icon grid */}
            <div>
              <div className="mb-1.5 text-[10px] font-medium text-slate-400">Icon</div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeIcon(null)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xs font-bold transition ${
                    !actorIcon
                      ? 'border-green-400 bg-green-50 text-green-600'
                      : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                  title="Default (green dot)"
                >
                  ●
                </button>
                {CHECKPOINT_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => onChangeIcon(icon.id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 p-1 transition ${
                      actorIcon === icon.id
                        ? 'border-green-400 bg-green-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    title={icon.label}
                  >
                    <img src={icon.src} alt={icon.label} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* shape */}
            <div>
              <div className="mb-1.5 text-[10px] font-medium text-slate-400">Shape</div>
              <div className="flex gap-1">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChangeShape(s.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 text-sm transition ${
                      actorShape === s.id
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    title={s.title}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* size */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400">Size</span>
                <span className="text-[11px] font-semibold tabular-nums text-slate-600">{actorSize}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={200}
                value={actorSize}
                onChange={(e) => onChangeSize(Number(e.target.value))}
                className="w-full accent-slate-800"
              />
            </div>

            {/* border */}
            <div>
              <div className="mb-1.5 text-[10px] font-medium text-slate-400">Border</div>
              <div className="flex gap-1">
                {BORDERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onChangeBorder(b.id)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                      actorBorder === b.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={b.title}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Background Tab ── */}
        {activeTab === 'background' && (
          <>
            {/* color picker */}
            <div>
              <div className="mb-1.5 text-[10px] font-medium text-slate-400">Background Color</div>
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onChangeBackgroundColor(c.id)}
                    className={`h-8 w-full rounded-lg border-2 transition ${
                      backgroundColor === c.id
                        ? 'border-slate-800 ring-2 ring-slate-300'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: c.id }}
                    title={c.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => onChangeBackgroundColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => { if (/^#[0-9a-f]{0,6}$/i.test(e.target.value)) onChangeBackgroundColor(e.target.value) }}
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-mono uppercase outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  placeholder="#ffffff"
                  maxLength={7}
                />
              </div>
            </div>

            {/* image */}
            <div>
              <div className="mb-1.5 text-[10px] font-medium text-slate-400">Background Image</div>
              <select
                value={backgroundId}
                onChange={(e) => onChangeBackground(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                {BACKGROUND_LIST.map((bg) => (
                  <option key={bg.id} value={bg.id}>{bg.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* close */}
        <div className="flex justify-end pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
