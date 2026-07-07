import { useCallback, useState, useEffect, type ComponentType } from 'react'
import { GameHUD } from './components/GameHUD'
import { InventoryPanel } from './components/InventoryPanel'
import { MapPanel } from './components/MapPanel'
import { BrowserPanel } from './components/BrowserPanel'

const MENU_ITEMS = [
  { id: 'inventory', icon: '🎒', label: 'Inventory' },
  { id: 'map', icon: '🗺️', label: 'Peta' },
  { id: 'browser', icon: '🌐', label: 'Browser' },
]

const PANELS: Record<string, ComponentType> = {
  inventory: InventoryPanel,
  map: MapPanel,
  browser: BrowserPanel,
}

export function GamePlay1Page() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activePanel, setActivePanel] = useState<string | null>(null)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleMenuSelect = useCallback((id: string) => {
    setActivePanel((prev) => (prev === id ? null : id))
  }, [])

  // Sync state kalau user tekan Esc untuk keluar fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ─── Fullscreen mode: dashboard bersih tanpa admin chrome ───
  if (isFullscreen) {
    const ActiveComponent = activePanel ? PANELS[activePanel] : null

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
        {/* Top bar kecil — label saja */}
        <div className="flex items-center bg-black/80 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Gameplay 1
          </span>
        </div>

        {/* Area utama — video player + panel overlay */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Background: video player area */}
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold text-white/70">Video player area</p>
              <p className="mt-2 text-sm text-white/40">Video .mp4 akan di-load di sini</p>
            </div>
          </div>

          {/* Panel overlay — muncul di atas video */}
          {ActiveComponent && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl">
                <button
                  onClick={() => setActivePanel(null)}
                  className="absolute right-3 top-3 rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/20 hover:text-white"
                >
                  ✕
                </button>
                <ActiveComponent />
              </div>
            </div>
          )}
        </div>

        {/* Game HUD — menu bar di bawah */}
        <GameHUD items={MENU_ITEMS} activeId={activePanel} onSelect={handleMenuSelect} />
      </div>
    )
  }

  // ─── Admin mode: tampilan biasa dengan info + tombol fullscreen ───
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">Gameplay 1</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Interactive Video Dashboard.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Load video .mp4, tampilkan UI overlay interaktif, dan rekam pakai OBS.
            </p>
          </div>

          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            <span>⛶</span>
            Fullscreen
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <p className="text-sm text-slate-500">
          Klik <strong>Fullscreen</strong> untuk masuk ke dashboard gameplay.
        </p>
      </div>
    </div>
  )
}
