import { useState, useEffect, useCallback } from 'react'

interface TabInfo {
  id: string
  url: string
  title: string
}

interface Props {
  onOpenBrowser: () => void
  onClose: () => void
}

export function BrowserGatewayModal({ onOpenBrowser, onClose }: Props) {
  const [tabs, setTabs] = useState<TabInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(onClose, 200)
  }, [onClose])

  // Fetch existing tabs
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const list = await window.browser.getTabs()
      if (!cancelled) {
        setTabs(list)
        setLoading(false)
        // Kalau belum ada tab, langsung buka browser
        if (list.length === 0) {
          onOpenBrowser()
        }
      }
    })()
    return () => { cancelled = true }
  }, [onOpenBrowser])

  const handleSwitchTab = useCallback(async (tabId: string) => {
    await window.browser.switchTab(tabId)
    onOpenBrowser()
  }, [onOpenBrowser])

  const handleCloseTab = useCallback(async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await window.browser.closeTab(tabId)
    const remaining = await window.browser.getTabs()
    setTabs(remaining)
    if (remaining.length === 0) {
      handleClose()
    }
  }, [handleClose])

  const handleNewTab = useCallback(async () => {
    await window.browser.createTab()
    onOpenBrowser()
  }, [onOpenBrowser])

  const hasTabs = tabs.length > 0

  return (
    <div
      className={`absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl backdrop-blur-2xl ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">🌐 Browser</h2>
          <button
            onClick={handleClose}
            className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/60 transition hover:bg-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-white/40">Loading tabs...</p>
          </div>
        ) : hasTabs ? (
          <>
            <p className="mb-3 text-xs text-white/50">
              {tabs.length} tab{tabs.length > 1 ? 's' : ''} open
            </p>
            <div className="mb-4 max-h-60 space-y-1 overflow-y-auto">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/10"
                >
                  <span className="shrink-0 text-lg">
                    {tab.url ? '🌐' : '🆕'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/80">
                      {tab.title || (tab.url ? new URL(tab.url).hostname : 'New Tab')}
                    </p>
                    {tab.url && (
                      <p className="truncate text-xs text-white/40">{tab.url}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="shrink-0 rounded-lg p-1 text-white/30 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                    title="Close tab"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* New tab button */}
            <button
              onClick={handleNewTab}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2.5 text-sm text-white/50 transition hover:border-white/30 hover:text-white/80"
            >
              <span>＋</span>
              New Tab
            </button>
          </>
        ) : (
          // No tabs — sudah auto-open browser, ini cuma fallback
          <button
            onClick={handleNewTab}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-6 text-sm text-white/50 transition hover:border-white/30 hover:text-white/80"
          >
            <span>🌐</span>
            Open Browser
          </button>
        )}
      </div>
    </div>
  )
}
