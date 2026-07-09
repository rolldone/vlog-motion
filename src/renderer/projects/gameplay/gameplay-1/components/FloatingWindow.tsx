import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const HEADER_OFFSET_ESTIMATE = 96 // fallback estimate ~48+48px

interface TabInfo {
  id: string
  url: string
  title: string
}

interface Bookmark {
  label: string
  url: string
  icon: string
}

type FloatingWindowProps = {
  onClose: () => void
  onBoundsChange?: (bounds: { x: number; y: number; width: number; height: number }) => void
  tabs: TabInfo[]
  activeTabId: string | null
  onNewTab: () => void
  onCloseTab: (tabId: string) => void
  onSwitchTab: (tabId: string) => void
  // ─── URL bar ───
  inputValue: string
  onInputChange: (value: string) => void
  onGo: () => void
  // ─── Navigation ───
  onBack: () => void
  onForward: () => void
  onReload: () => void
  // ─── Loading ───
  loading: boolean
  // ─── Auto-focus trigger (incremented on new tab) ───
  focusKey: number
  // ─── Bookmarks (new tab page) ───
  bookmarks: Bookmark[]
  onBookmarkClick: (url: string) => void
}

export function FloatingWindow({
  onClose,
  onBoundsChange,
  tabs,
  activeTabId,
  onNewTab,
  onCloseTab,
  onSwitchTab,
  inputValue,
  onInputChange,
  onGo,
  onBack,
  onForward,
  onReload,
  loading,
  focusKey,
  bookmarks,
  onBookmarkClick,
}: FloatingWindowProps) {
  const urlInputRef = useRef<HTMLInputElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const addressBarRef = useRef<HTMLDivElement>(null)

  // ─── Auto-focus URL input on new tab ───
  useEffect(() => {
    if (focusKey > 0 && urlInputRef.current) {
      urlInputRef.current.focus()
      urlInputRef.current.select()
    }
  }, [focusKey])

  const [pos, setPos] = useState({ x: Math.round(window.innerWidth * 0.1), y: 60 })
  const [size, setSize] = useState({
    w: Math.round(window.innerWidth * 0.8),
    h: Math.round(window.innerHeight * 0.8),
  })
  const dragging = useRef(false)
  const resizing = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  // ─── Send content-area bounds to main process (WebContentsView) ───
  const sendBounds = useCallback(() => {
    const tabH = tabBarRef.current?.offsetHeight ?? 48
    const addrH = addressBarRef.current?.offsetHeight ?? 48
    const headerH = tabH + addrH
    const bounds = {
      x: pos.x,
      y: pos.y + headerH,
      width: size.w,
      height: size.h - headerH,
    }
    onBoundsChange?.(bounds)
  }, [pos, size, onBoundsChange])

  // ─── Drag ───
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }, [pos])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
      }
      if (resizing.current) {
        const dx = e.clientX - resizeStart.current.x
        const dy = e.clientY - resizeStart.current.y
        setSize({
          w: Math.max(400, resizeStart.current.w + dx),
          h: Math.max(300, resizeStart.current.h + dy),
        })
      }
    }
    const handleUp = () => {
      dragging.current = false
      resizing.current = false
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])

  // ─── Resize ───
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }
  }, [size])

  // ─── Sync bounds to main process whenever pos/size changes ───
  useEffect(() => {
    sendBounds()
  }, [sendBounds])

  // ─── Truncate tab title ───
  const truncate = (str: string, max: number) => {
    return str.length > max ? str.slice(0, max) + '…' : str
  }

  return createPortal(
    <div
      className="fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-2xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Tab bar — also acts as title bar (draggable), like modern Chrome/Edge */}
      <div
        ref={tabBarRef}
        onMouseDown={handleDragStart}
        className="flex cursor-grab items-center gap-1 overflow-x-auto bg-zinc-800 px-2 pt-1 pb-0.5 active:cursor-grabbing"
        style={{ height: 'auto' }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSwitchTab(tab.id)}
            className={`group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs transition ${
              tab.id === activeTabId
                ? 'bg-white/15 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
            style={{ height: '100%' }}
          >
            <span className="max-w-[120px] truncate">{truncate(tab.title, 20)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.id)
              }}
              className="rounded px-1 text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
        {/* New tab button */}
        <button
          onClick={onNewTab}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
          title="New tab"
        >
          +
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Close window button */}
        <button
          onClick={onClose}
          className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/60 transition hover:bg-red-500/80 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Address bar — ← → ⟳ | URL input | Go (all inline like real browser) */}
      <div
        ref={addressBarRef}
        className="flex items-center gap-1.5 bg-zinc-800 px-2 pb-1"
        style={{ height: 49 }}
      >
        <button
          onClick={onBack}
          disabled={!activeTabId}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
          title="Back"
        >
          ←
        </button>
        <button
          onClick={onForward}
          disabled={!activeTabId}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
          title="Forward"
        >
          →
        </button>
        <button
          onClick={onReload}
          disabled={!activeTabId}
          className={`shrink-0 rounded-md px-2 py-1 text-sm text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-25 ${
            loading ? 'animate-spin' : ''
          }`}
          title={loading ? 'Stop' : 'Reload'}
        >
          {loading ? '⏳' : '⟳'}
        </button>

        {/* URL input */}
        <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
          <span className="shrink-0 text-xs text-white/40">🔒</span>
          <input
            ref={urlInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onGo() }}
            className="flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/25"
            placeholder="Ketik URL atau search..."
          />
        </div>
      </div>

      {/* Loading progress bar — Chrome-style */}
      {loading && (
        <>
          <style>{`@keyframes sweep{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(400%)}}`}</style>
          <div className="h-0.5 w-full overflow-hidden bg-slate-700">
            <div
              className="h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-orange-400 to-transparent"
              style={{ animation: 'sweep 1.8s ease-in-out infinite' }}
            />
          </div>
        </>
      )}

      {/* Content area — black background (WebContentsView renders behind) + bookmark new-tab page */}
      <div className="relative flex-1 bg-black" style={{ minHeight: 0, pointerEvents: 'auto' }}>
        {/* Bookmark grid — only shown when active tab has no URL (blank new-tab page) */}
        {activeTabId && tabs.find((t) => t.id === activeTabId)?.url === '' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
            <div className="flex flex-col items-center gap-6">
              <h3 className="text-lg font-medium text-white/60">🌐 New Tab</h3>
              <div className="grid grid-cols-3 gap-3">
                {bookmarks.map((bm) => (
                  <button
                    key={bm.label}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onBookmarkClick(bm.url)
                    }}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-orange-500/40 hover:bg-orange-500/15 hover:scale-105"
                  >
                    <span className="text-2xl">{bm.icon}</span>
                    <span className="text-xs font-medium text-white/70">{bm.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
      />
    </div>,
    document.body,
  )
}
