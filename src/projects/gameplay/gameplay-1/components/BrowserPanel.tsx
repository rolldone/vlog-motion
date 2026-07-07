import { useState, useCallback } from 'react'
import { FloatingWindow } from './FloatingWindow'
import { BrowserStream } from './BrowserStream'

// Bookmark quick-links
const BOOKMARKS = [
  { label: 'Bing', url: 'https://www.bing.com', icon: '🔍' },
  { label: 'Bing Maps', url: 'https://www.bing.com/maps', icon: '🗺️' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org', icon: '📖' },
  { label: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
  { label: 'Reddit', url: 'https://www.reddit.com', icon: '🤖' },
]

export function BrowserPanel() {
  const [inputValue, setInputValue] = useState('https://www.bing.com')
  const [browserUrl, setBrowserUrl] = useState<string | null>(null)

  const normalizeUrl = useCallback((rawUrl: string) => {
    let finalUrl = rawUrl.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }
    return finalUrl
  }, [])

  const handleGo = useCallback(() => {
    setBrowserUrl(normalizeUrl(inputValue))
  }, [inputValue, normalizeUrl])

  const handleBookmark = useCallback((url: string) => {
    setInputValue(url)
    setBrowserUrl(url)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleGo()
    },
    [handleGo],
  )

  return (
    <>
      <div className="flex flex-col gap-4 p-6">
        <h2 className="text-xl font-bold text-orange-400">🌐 Browser</h2>

        {/* Bookmarks */}
        <div className="flex flex-wrap gap-2">
          {BOOKMARKS.map((bm) => (
            <button
              key={bm.label}
              onClick={() => handleBookmark(bm.url)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-orange-500/50 hover:bg-orange-500/20 hover:text-white"
            >
              <span>{bm.icon}</span>
              {bm.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          {/* URL bar */}
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
            <span className="shrink-0 text-xs text-white/40">🔒</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/30"
              placeholder="Ketik URL..."
            />
            <button
              onClick={handleGo}
              className="shrink-0 rounded-md bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-400"
            >
              Go
            </button>
          </div>
        </div>
        <p className="text-xs text-white/40">
          Klik bookmark atau ketik URL, lalu tekan Enter / Go. Real browser via headless Chromium.
        </p>
      </div>

      {/* Floating browser window — headless browser stream */}
      {browserUrl && (
        <FloatingWindow
          title="🌐 Browser"
          onClose={() => {
            setBrowserUrl(null)
            // Kill Chromium process
            fetch('/browser/close', { method: 'POST' }).catch(() => {})
          }}
        >
          <BrowserStream
            url={browserUrl}
            onUrlChange={(newUrl) => setInputValue(newUrl)}
          />
        </FloatingWindow>
      )}
    </>
  )
}
