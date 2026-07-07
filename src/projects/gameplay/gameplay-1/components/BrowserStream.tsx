import { useState, useEffect, useRef, useCallback } from 'react'

type BrowserStreamProps = {
  url: string
  onUrlChange?: (url: string) => void
}

export function BrowserStream({ url, onUrlChange }: BrowserStreamProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onUrlChangeRef = useRef(onUrlChange)
  const prevUrlRef = useRef<string | null>(null)
  const navigatingRef = useRef(false)

  // Keep ref in sync
  onUrlChangeRef.current = onUrlChange

  // Navigate ke URL baru (stable reference, no deps on onUrlChange)
  const navigate = useCallback(async (targetUrl: string) => {
    if (navigatingRef.current) return
    navigatingRef.current = true
    setLoading(true)
    try {
      await fetch('/browser/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })
      onUrlChangeRef.current?.(targetUrl)
    } catch (err) {
      console.error('[browser-stream] Navigate error:', err)
    } finally {
      navigatingRef.current = false
      setLoading(false)
    }
  }, [])

  // Start SSE stream
  useEffect(() => {
    const es = new EventSource('/browser/stream')
    es.onmessage = (e) => {
      if (e.data.startsWith('data:image/') || e.data.startsWith('image/')) {
        const dataUri = e.data.startsWith('data:') ? e.data : `data:${e.data}`
        setScreenshot(dataUri)
        setLoading(false)
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnect
    }

    return () => {
      es.close()
    }
  }, [])

  // Navigate saat URL prop berubah (hanya ketika url benar-benar berbeda)
  useEffect(() => {
    if (url && url !== prevUrlRef.current) {
      prevUrlRef.current = url
      navigate(url)
    }
  }, [url, navigate])

  // Klik — kirim koordinat ke server
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const scaleX = 1280 / rect.width
    const scaleY = 800 / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    try {
      await fetch('/browser/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y }),
      })
    } catch (err) {
      console.error('[browser-stream] Click error:', err)
    }
  }, [])

  // Scroll — kirim delta ke server
  const handleWheel = useCallback(async (e: React.WheelEvent) => {
    try {
      await fetch('/browser/scroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaX: e.deltaX, deltaY: e.deltaY }),
      })
    } catch (err) {
      console.error('[browser-stream] Scroll error:', err)
    }
  }, [])

  // Keyboard — type & key press
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    // Map key ke Puppeteer key names
    const keyMap: Record<string, string> = {
      'Enter': 'Enter',
      'Backspace': 'Backspace',
      'Tab': 'Tab',
      'Escape': 'Escape',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      ' ': 'Space',
    }

    const key = keyMap[e.key]

    if (key) {
      e.preventDefault()
      try {
        await fetch('/browser/key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      } catch (err) {
        console.error('[browser-stream] Key error:', err)
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Regular character — type it
      e.preventDefault()
      try {
        await fetch('/browser/type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: e.key }),
        })
      } catch (err) {
        console.error('[browser-stream] Type error:', err)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-white"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none' }}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800/50">
          <div className="text-sm text-white/70">Loading...</div>
        </div>
      )}

      {/* Screenshot */}
      {screenshot && (
        <img
          ref={imgRef}
          src={screenshot}
          alt="Browser"
          className="h-full w-full cursor-pointer select-none"
          style={{ objectFit: 'fill' }}
          onClick={handleClick}
          onWheel={handleWheel}
          draggable={false}
        />
      )}

      {/* Click hint */}
      <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-black/30">
        Click to interact · Scroll to scroll · Type to type
      </div>
    </div>
  )
}