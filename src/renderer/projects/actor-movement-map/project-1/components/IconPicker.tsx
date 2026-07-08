import type { CSSProperties } from 'react'
import heroIcon from '../../assets/checkpoints/hero.png'
import reactIcon from '../../assets/checkpoints/react.svg'
import viteIcon from '../../assets/checkpoints/vite.svg'

export const CHECKPOINT_ICONS: { id: string; label: string; src: string }[] = [
  { id: 'hero', label: 'Hero', src: heroIcon },
  { id: 'react', label: 'React', src: reactIcon },
  { id: 'vite', label: 'Vite', src: viteIcon },
]

const SHAPES = [
  { id: 'circle' as const, label: '●', title: 'Circle' },
  { id: 'square' as const, label: '■', title: 'Square' },
  { id: 'rounded' as const, label: '▢', title: 'Rounded' },
  { id: 'diamond' as const, label: '◆', title: 'Diamond' },
  { id: 'none' as const, label: '✕', title: 'No wrapper' },
]

const SIZE_MIN = 16
const SIZE_MAX = 200

const BORDERS = [
  { id: 'none' as const, label: '✕', title: 'No border' },
  { id: 'thin' as const, label: '—', title: 'Thin' },
  { id: 'normal' as const, label: '━', title: 'Normal' },
  { id: 'thick' as const, label: '▬', title: 'Thick' },
]

type IconPickerProps = {
  selectedIcon?: string
  selectedShape?: string
  selectedSize?: number
  selectedBorder?: string
  onSelectIcon: (icon: string | null) => void
  onSelectShape: (shape: 'circle' | 'square' | 'rounded' | 'diamond' | 'none') => void
  onSelectSize: (size: number) => void
  onSelectBorder: (border: 'none' | 'thin' | 'normal' | 'thick') => void
  onClose: () => void
  style?: CSSProperties
}

export function IconPicker({ selectedIcon, selectedShape, selectedSize, selectedBorder, onSelectIcon, onSelectShape, onSelectSize, onSelectBorder, onClose }: IconPickerProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
    <div
      className="w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Checkpoint style
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      {/* icon grid */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-medium text-slate-400">Icon</div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => onSelectIcon(null)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xs font-bold transition ${
              !selectedIcon
                ? 'border-sky-400 bg-sky-50 text-sky-600'
                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100'
            }`}
            title="Default (label only)"
          >
            ✕
          </button>
          {CHECKPOINT_ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              onClick={() => onSelectIcon(icon.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 p-1 transition ${
                selectedIcon === icon.id
                  ? 'border-sky-400 bg-sky-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
              title={icon.label}
            >
              <img src={icon.src} alt={icon.label} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      </div>

      {/* shape selector */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-medium text-slate-400">Shape</div>
        <div className="flex gap-1">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectShape(s.id)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 text-sm transition ${
                (selectedShape ?? 'circle') === s.id
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

      {/* size slider */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-400">Size</span>
          <span className="text-[11px] font-semibold tabular-nums text-slate-600">{selectedSize ?? 32}px</span>
        </div>
        <input
          type="range"
          min={SIZE_MIN}
          max={SIZE_MAX}
          value={selectedSize ?? 32}
          onChange={(e) => onSelectSize(Number(e.target.value))}
          className="w-full accent-slate-800"
        />
      </div>

      {/* border selector */}
      <div>
        <div className="mb-1.5 text-[10px] font-medium text-slate-400">Border</div>
        <div className="flex gap-1">
          {BORDERS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBorder(b.id)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                (selectedBorder ?? 'normal') === b.id
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
    </div>
    </div>
  )
}

/** Resolve icon id to src */
export function getIconSrc(iconId?: string): string | undefined {
  if (!iconId) return undefined
  return CHECKPOINT_ICONS.find((i) => i.id === iconId)?.src
}

/** Shape → CSS class */
export function getShapeClass(shape?: string): string {
  switch (shape) {
    case 'square': return 'rounded-md'
    case 'rounded': return 'rounded-2xl'
    case 'diamond': return 'rounded-md rotate-45'
    case 'none': return ''
    default: return 'rounded-full'
  }
}

/** Size → inline CSS style (px) */
export function getSizeStyle(size?: number): React.CSSProperties {
  const px = size ?? 32
  return { width: px, height: px }
}

/** Border → CSS class */
export function getBorderClass(border?: string): string {
  switch (border) {
    case 'none': return 'border-0'
    case 'thin': return 'border'
    case 'thick': return 'border-[3px]'
    default: return 'border-2'
  }
}
