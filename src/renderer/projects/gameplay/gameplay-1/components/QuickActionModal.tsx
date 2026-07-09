// ─── Quick Action Modal — carousel overlay di fullscreen ───
// Trigger: tombol I | Navigasi: arrow kiri/kanan | Pilih: click / Enter
// Pilih item → modal close (konten visual aja)
// Style: item statis, selected indicator yang geser (film strip style)

import { useEffect, useState, useCallback, useRef } from 'react'
import { DEFAULT_QUICK_ACTIONS, type QuickActionItem } from './quickActions'

interface QuickActionModalProps {
  onClose: () => void
}

function loadEnabled(): QuickActionItem[] {
  try {
    const saved = localStorage.getItem('quick-action-enabled')
    if (saved) {
      const enabledIds: string[] = JSON.parse(saved)
      return DEFAULT_QUICK_ACTIONS.filter((a) => enabledIds.includes(a.id))
    }
  } catch { /* fallback */ }
  return DEFAULT_QUICK_ACTIONS.filter((a) => a.enabled)
}

export function QuickActionModal({ onClose }: QuickActionModalProps) {
  const allEnabled = loadEnabled()
  const [selectedIdx, setSelectedIdx] = useState(-1)       // logical — drives scroll (-1 = hint card)
  const [visualIdx, setVisualIdx] = useState(-1)            // visual — drives styling (-1 = hint card)
  const [mounted, setMounted] = useState(false)
  const itemsRef = useRef<HTMLDivElement>(null)
  const selectedIdxRef = useRef(-1)                          // sync index for keyboard

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Simultaneous: old unstyle + new style bersamaan (CSS transition handle)
  const selectItem = useCallback((newIdx: number) => {
    if (newIdx === selectedIdxRef.current) return
    selectedIdxRef.current = newIdx
    setSelectedIdx(newIdx)       // start scroll
    setVisualIdx(newIdx)         // styling langsung pindah — transition handle crossfade
  }, [])

  // Keyboard navigasi — arrow geser selected, bukan page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        selectItem(Math.max(-1, selectedIdxRef.current - 1))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        selectItem(Math.min(allEnabled.length - 1, selectedIdxRef.current + 1))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        handleClose()
      }
      if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allEnabled.length, selectItem])

  // Auto-scroll selected ke center — smooth tanpa snap
  useEffect(() => {
    const container = itemsRef.current
    if (!container) return
    const selected = container.children[selectedIdx + 1] as HTMLElement | undefined
    if (!selected) return
    const containerCenter = container.offsetWidth / 2
    const itemCenter = selected.offsetLeft + selected.offsetWidth / 2
    container.scrollTo({
      left: itemCenter - containerCenter,
      behavior: 'smooth',
    })
  }, [selectedIdx])

  const handleClose = useCallback(() => {
    setMounted(false)
    setTimeout(onClose, 200)
  }, [onClose])

  return (
    <div
      className={`absolute inset-0 z-60 flex items-center justify-center transition-all duration-200 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex flex-col items-center gap-6 transition-all duration-200 ${
          mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}
      >
        {/* Wrapper box — title + film strip + dots */}
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/8 bg-black px-6 py-6 w-[620px] h-[400px]">
          <p className="text-sm font-semibold text-white/70 uppercase tracking-widest">
            ⚡ Quick Actions
          </p>

          {/* Film strip — all items visible, scrollable, centered selected */}
          <div className="relative w-full">
            {/* Scrollable items */}
            <div
              ref={itemsRef}
              className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-2 h-[256px]"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingLeft: 'calc(50% - 110px)',
                paddingRight: 'calc(50% - 110px)',
              }}
            >
              {/* Hint card — default selected */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  selectItem(-1)
                }}
                className={`flex shrink-0 flex-col items-center justify-center gap-3 w-[185px] rounded-3xl border-2 cursor-pointer transition-all duration-200 ${visualIdx === -1 ? 'h-[240px]' : 'h-[200px]'}`}
                style={{
                  backgroundColor: visualIdx === -1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  borderColor: visualIdx === -1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  boxShadow: visualIdx === -1 ? '0 8px 30px rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <span className={`transition-all duration-200 ${visualIdx === -1 ? 'text-8xl' : 'text-7xl'}`}>
                  ⌨️
                </span>
                <span className={`font-bold leading-tight text-center transition-all duration-200 ${visualIdx === -1 ? 'text-white text-xl' : 'text-white/60 text-lg'}`}>
                  ← → navigate<br />
                  Enter select<br />
                  I / Esc close
                </span>
              </button>

              {allEnabled.map((item, i) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    selectItem(i)
                    handleClose()
                  }}
                  className={`flex shrink-0 flex-col items-center justify-center gap-5 w-[185px] rounded-3xl border-2 cursor-pointer transition-all duration-200 ${i === visualIdx ? 'h-[240px]' : 'h-[200px]'}`}
                  style={{
                    backgroundColor: i === visualIdx
                      ? `${item.color}30`
                      : `${item.color}15`,
                    borderColor: i === visualIdx
                      ? `${item.colorAccent}CC`
                      : `${item.color}40`,
                    boxShadow: i === visualIdx
                      ? `0 8px 30px ${item.color}50`
                      : 'none',
                  }}
                >
                  <span className={`transition-all duration-200 ${i === visualIdx ? 'text-8xl' : 'text-7xl'}`}>
                    {item.icon}
                  </span>
                  <span className={`font-bold leading-tight transition-all duration-200 ${i === visualIdx ? 'text-white text-xl' : 'text-white/60 text-lg'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Page dots */}
          <div className="flex items-center gap-2">
            {/* Hint dot */}
            <button
              onClick={(e) => { e.stopPropagation(); selectItem(-1) }}
              className="h-2 rounded-full transition-all duration-100"
              style={{
                width: visualIdx === -1 ? 24 : 8,
                backgroundColor: visualIdx === -1 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
              }}
            />
            {allEnabled.map((item, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); selectItem(i) }}
                className="h-2 rounded-full transition-all duration-100"
                style={{
                  width: i === visualIdx ? 24 : 8,
                  backgroundColor: i === visualIdx ? item.colorAccent : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>



        </div>
      </div>
    </div>
  )
}

