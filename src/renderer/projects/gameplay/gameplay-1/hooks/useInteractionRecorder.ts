import { useRef, useState, useCallback, useEffect } from 'react'
import {
  type RecordingEvent,
  type RecordingSession,
  type RecordingEventInput,
  generateSelector,
  exportSessionJSON,
  parseSessionJSON,
  downloadFile,
} from '../utils/recorder'

// ─── Replay handlers interface ───
export interface ReplayHandlers {
  onHudSelect: (panelId: string) => void
  onPanelClose: () => void
  onVideoPlay: () => void
  onVideoPause: () => void
  onVideoSeek: (time: number) => void
  onBrowserNavigate: (url: string) => void
  onBrowserShow: () => void
  onBrowserHide: () => void
  onBrowserBack: () => void
  onBrowserForward: () => void
  onBrowserReload: () => void
  onBrowserNewTab: (url?: string) => void
  onBrowserCloseTab: (tabId: string) => void
  onBrowserSwitchTab: (tabId: string) => void
  onHitDamage: () => void
}

export function useInteractionRecorder(videoName: string | null, recordCursor = true) {
  const [isRecording, setIsRecording] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [lastSession, setLastSession] = useState<RecordingSession | null>(null)

  const eventsRef = useRef<RecordingEvent[]>([])
  const startTimeRef = useRef(0)
  const videoNameRef = useRef(videoName)
  videoNameRef.current = videoName

  // ─── Replay state ───
  const replayTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const replayHandlersRef = useRef<ReplayHandlers | null>(null)

  const setReplayHandlers = useCallback((handlers: ReplayHandlers) => {
    replayHandlersRef.current = handlers
  }, [])

  // ─── Record a single event ───
  const recordEvent = useCallback(
    (e: RecordingEventInput) => {
      if (!isRecording) return
      const t = Date.now() - startTimeRef.current
      eventsRef.current.push({ ...e, t } as RecordingEvent)
    },
    [isRecording],
  )

  // ─── Start recording ───
  const startRecording = useCallback(() => {
    eventsRef.current = []
    startTimeRef.current = Date.now()
    setIsRecording(true)
    console.log('[recorder] started')
  }, [])

  // ─── Stop recording → return session ───
  const stopRecording = useCallback((): RecordingSession | null => {
    setIsRecording(false)
    const session: RecordingSession = {
      version: 1,
      name: `Recording ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      videoName: videoNameRef.current,
      fps: 30,
      events: [...eventsRef.current],
    }
    setLastSession(session)
    console.log('[recorder] stopped', session.events.length, 'events')
    return session
  }, [])

  // ─── Export session as JSON file download ───
  const exportSession = useCallback((session: RecordingSession) => {
    const json = exportSessionJSON(session)
    const filename = `${session.name.replace(/[^a-z0-9]/gi, '_')}.json`
    downloadFile(json, filename)
  }, [])

  // ─── Load session from JSON file ───
  const loadSession = useCallback((file: File): Promise<RecordingSession | null> => {
    return file.text().then((text) => {
      const session = parseSessionJSON(text)
      if (session) setLastSession(session)
      return session
    })
  }, [])

  // ─── Stop replay — clear all pending timeouts ───
  const stopReplay = useCallback(() => {
    replayTimeoutsRef.current.forEach(clearTimeout)
    replayTimeoutsRef.current = []
    setIsReplaying(false)
    setCursorVisible(false)
    setCursorPos(null)
    console.log('[replay] stopped')
  }, [])

  // ─── Start replay — jalankan events sesuai timing ───
  const startReplay = useCallback(
    (session: RecordingSession) => {
      const handlers = replayHandlersRef.current
      if (!handlers) {
        console.error('[replay] No handlers registered')
        return
      }

      stopReplay()
      setIsReplaying(true)
      console.log('[replay] started', session.events.length, 'events')

      const replayStart = Date.now()

      for (const e of session.events) {
        const delay = e.t
        const timeout = setTimeout(() => {
          switch (e.type) {
            case 'mousemove':
              setCursorPos({ x: e.x, y: e.y })
              setCursorVisible(true)
              break
            case 'click':
              setCursorPos({ x: e.x, y: e.y })
              setCursorVisible(true)
              // Simulate click at coordinates — try elementFromPoint first
              let clickEl = document.elementFromPoint(e.x, e.y) as HTMLElement | null
              // Walk up to nearest clickable element
              if (clickEl) {
                const clickable = clickEl.closest('button, a, [role="button"], [onclick]') as HTMLElement | null
                if (clickable) clickEl = clickable
              }
              // Fallback: try selector if elementFromPoint failed
              if (!clickEl && e.selector) {
                clickEl = document.querySelector(e.selector) as HTMLElement | null
              }
              if (clickEl) {
                console.log('[replay] click:', e.label, '→', clickEl.tagName, clickEl.textContent?.slice(0, 30))
                clickEl.click()
              } else {
                console.warn('[replay] click: element not found at', e.x, e.y, 'selector:', e.selector)
              }
              break
            case 'hud-select':
              handlers.onHudSelect(e.panelId)
              break
            case 'panel-close':
              handlers.onPanelClose()
              break
            case 'video-play':
              handlers.onVideoPlay()
              break
            case 'video-pause':
              handlers.onVideoPause()
              break
            case 'video-seek':
              handlers.onVideoSeek(e.time)
              break
            case 'browser-navigate':
              handlers.onBrowserNavigate(e.url)
              break
            case 'browser-show':
              handlers.onBrowserShow()
              break
            case 'browser-hide':
              handlers.onBrowserHide()
              break
            case 'browser-back':
              handlers.onBrowserBack()
              break
            case 'browser-forward':
              handlers.onBrowserForward()
              break
            case 'browser-reload':
              handlers.onBrowserReload()
              break
            case 'browser-newtab':
              handlers.onBrowserNewTab(e.url)
              break
            case 'browser-closetab':
              handlers.onBrowserCloseTab(e.tabId)
              break
            case 'browser-switchtab':
              handlers.onBrowserSwitchTab(e.tabId)
              break
            case 'hit-damage':
              handlers.onHitDamage()
              break
          }
        }, delay)
        replayTimeoutsRef.current.push(timeout)
      }

      // End replay after last event + 1s buffer
      const lastT = session.events.length > 0
        ? session.events[session.events.length - 1].t
        : 0
      const endTimeout = setTimeout(() => {
        setIsReplaying(false)
        setCursorVisible(false)
        console.log('[replay] finished')
      }, lastT + 1000)
      replayTimeoutsRef.current.push(endTimeout)
    },
    [stopReplay],
  )

  // ─── Global click + mousemove listener (active only during recording) ───
  useEffect(() => {
    if (!isRecording) return

    // Throttle mousemove to ~60fps (16ms)
    let lastMove = 0
    const onMouseMove = (e: MouseEvent) => {
      if (!recordCursor) return // skip cursor recording jika dimatikan
      const now = Date.now()
      if (now - lastMove < 16) return
      lastMove = now
      recordEvent({ type: 'mousemove', x: e.clientX, y: e.clientY })
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      // Skip clicks on recorder UI itself
      if (target.closest('[data-recorder-ui]')) return
      // Skip clicks on elements already handled by dedicated events (hud-select, panel-close, etc.)
      if (target.closest('[data-recorder-handled]')) return

      // Walk up to nearest clickable element (button, a, [role=button], [onclick])
      const clickable = target.closest('button, a, [role="button"], [onclick]') as HTMLElement | null
      const recordTarget = clickable || target

      const selector = generateSelector(recordTarget)
      const label =
        recordTarget.title || recordTarget.textContent?.slice(0, 30) || undefined
      console.log('[recorder] click recorded:', label, 'at', e.clientX, e.clientY, 'selector:', selector)
      recordEvent({ type: 'click', selector, label, x: e.clientX, y: e.clientY })

      // Visual flash indicator — brief red ring at click position
      const flash = document.createElement('div')
      flash.style.cssText = `position:fixed;left:${e.clientX-20}px;top:${e.clientY-20}px;width:40px;height:40px;border:3px solid #ef4444;border-radius:50%;pointer-events:none;z-index:99999;transition:opacity 0.3s,transform 0.3s;opacity:0.8`
      document.body.appendChild(flash)
      requestAnimationFrame(() => {
        flash.style.opacity = '0'
        flash.style.transform = 'scale(1.5)'
      })
      setTimeout(() => flash.remove(), 300)
    }

    document.addEventListener('mousemove', onMouseMove, true)
    document.addEventListener('click', onClick, true) // capture phase
    return () => {
      document.removeEventListener('mousemove', onMouseMove, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [isRecording, recordEvent, recordCursor])

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      replayTimeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  return {
    // Recording
    isRecording,
    startRecording,
    stopRecording,
    recordEvent,
    exportSession,
    loadSession,
    lastSession,
    // Replay
    isReplaying,
    startReplay,
    stopReplay,
    setReplayHandlers,
    // Cursor
    cursorPos,
    cursorVisible,
  }
}