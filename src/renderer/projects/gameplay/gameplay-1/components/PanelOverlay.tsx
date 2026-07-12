// ─── Panel overlay — wrapper untuk semua panel di fullscreen mode ───
// Menangani animasi fade + routing konten panel (tanpa backdrop)

import { InventoryPanel } from '../../../inventory/project-1/components/InventoryPanel'
import { CostDisplay } from './CostDisplay'
import { GalleryDisplay } from './GalleryDisplay'
import { BrowserPanel } from './BrowserPanel'
import { MapPanel } from './MapPanel'
import type { useInteractionRecorder } from '../hooks/useInteractionRecorder'

type Recorder = ReturnType<typeof useInteractionRecorder>

interface PanelOverlayProps {
  activePanel: string | null
  isClosing: boolean
  onClose: () => void
  recorder: Recorder
}

export function PanelOverlay({ activePanel, isClosing, onClose, recorder }: PanelOverlayProps) {
  if (!activePanel) return null

  return (
    <>
      {activePanel === 'browser' ? (
        /* ─── Browser — tanpa backdrop, slide dari kanan ─── */
        <div className={`absolute right-0 top-0 z-30 h-full w-full max-w-[70%] shadow-2xl ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <BrowserPanel
            onClosePanel={onClose}
            recorder={recorder}
          />
        </div>
      ) : (
        <div className={`absolute inset-0 z-30 flex items-center justify-center ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`relative backdrop-blur-2xl ${
            activePanel === 'gallery'
              ? `max-w-[32rem] w-full rounded-2xl border border-white/10 bg-zinc-900/95 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`
              : activePanel === 'map'
              ? `min-w-[50rem] max-w-[56rem] max-h-[85vh] w-full rounded-2xl border border-white/10 bg-zinc-900/95 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`
              : `min-w-[36rem] rounded-2xl border border-white/10 bg-zinc-900/95 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`
          }`}>
            <button
              data-recorder-handled
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
            {activePanel === 'inventory' && <InventoryPanel embedded />}
            {activePanel === 'cost' && <CostDisplay embedded />}
            {activePanel === 'gallery' && <GalleryDisplay embedded />}
          </div>
        </div>
      )}

      {/* ─── Map — always mounted (hidden when not active) biar gak reload ─── */}
      <div className={`absolute inset-0 z-30 flex items-center justify-center ${activePanel === 'map' ? (isClosing ? 'animate-fade-out' : 'animate-fade-in') : 'hidden'}`}>
        <div className="relative min-w-[50rem] max-w-[56rem] max-h-[85vh] w-full rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white/80">🗺️ Peta</h3>
            <button
              data-recorder-handled
              onClick={onClose}
              className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
          </div>
          <MapPanel embedded />
        </div>
      </div>
    </>
  )
}
