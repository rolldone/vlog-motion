import { useCallback, useState, useEffect, useRef } from 'react'
import { GameHUD } from './components/GameHUD'
import { VideoSelector } from './components/VideoSelector'
import { BrowserGatewayModal } from './components/BrowserGatewayModal'
import { InventoryPanel } from '../../inventory/project-1/components/InventoryPanel'
import { CostPanel } from '../../cost/project-1/components/CostPanel'
import { GalleryPanel } from '../../gallery/gallery-1/components/GalleryPanel'
import { CostDisplay } from './components/CostDisplay'
import { GalleryDisplay } from './components/GalleryDisplay'
import { BrowserPanel } from './components/BrowserPanel'
import { CropOverlay } from './components/CropOverlay'
import { ProjectManager } from './components/ProjectManager'
import { collectProjectState, restoreProjectState } from './utils/projectManager'
import { useInteractionRecorder } from './hooks/useInteractionRecorder'
import { FakeCursor } from './components/FakeCursor'
import { HitDamageOverlay, DEFAULT_HIT_SETTINGS, type HitDamageSettings } from './components/HitDamageOverlay'

// ─── Helper: recursively copy computed styles from source → clone ───
function inlineStyles(source: Element, clone: Element) {
  const computed = window.getComputedStyle(source)
  ;(clone as HTMLElement).style.cssText = computed.cssText
  const srcChildren = source.children
  const clnChildren = clone.children
  for (let i = 0; i < srcChildren.length && i < clnChildren.length; i++) {
    inlineStyles(srcChildren[i], clnChildren[i])
  }
}

const MENU_ITEMS = [
  { id: 'inventory', icon: '🎒', label: 'Inventory' },
  { id: 'cost', icon: '💰', label: 'Cost' },
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'browser', icon: '🌐', label: 'Browser' },
]

export function GamePlay1Page() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [cropDataUrl, setCropDataUrl] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoName, setVideoName] = useState<string | null>(() => {
    return localStorage.getItem('project-video-name') || null
  })
  const [videoSize, setVideoSize] = useState<string | null>(() => {
    return localStorage.getItem('project-video-size') || null
  })
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoMissing, setVideoMissing] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [showBrowserGate, setShowBrowserGate] = useState(false)
  const [videoTime, setVideoTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('video-volume')
    return saved ? Number(saved) : 1.0
  })
  const [lastSessionTime, setLastSessionTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('project-video-session-time')
    return saved ? Number(saved) : null
  })
  // ─── Video visibility & chroma key background ───
  const [videoVisible, setVideoVisible] = useState(() => {
    return localStorage.getItem('video-visible') !== 'false' // default true
  })
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [chromaBgColor, setChromaBgColor] = useState<string | null>(() => {
    return localStorage.getItem('chroma-bg-color') || null
  })
  // ─── Project file management ───
  const [projectName, setProjectName] = useState(() => {
    return localStorage.getItem('project-name') || 'Untitled'
  })
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(() => {
    return localStorage.getItem('project-path') || null
  })
  const isModifiedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // ─── Interaction recorder (record & replay) ───
  const [recordCursor, setRecordCursor] = useState(() => {
    return localStorage.getItem('record-cursor') !== 'false' // default true
  })
  const recorder = useInteractionRecorder(videoName, recordCursor)

  // ─── Hit damage overlay ───
  const [hitTrigger, setHitTrigger] = useState(0)
  const [hitSettings, setHitSettings] = useState<HitDamageSettings>(() => {
    try {
      const saved = localStorage.getItem('hit-damage-settings')
      return saved ? { ...DEFAULT_HIT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_HIT_SETTINGS
    } catch { return DEFAULT_HIT_SETTINGS }
  })

  // ─── Heartbeat sound (lub-dub 2x) via Web Audio API ───
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastHeartbeatRef = useRef(0)

  const playHeartbeat = useCallback(() => {
    // Throttle: minimum 350ms antar heartbeat
    const now = performance.now()
    if (now - lastHeartbeatRef.current < 350) return
    lastHeartbeatRef.current = now

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      // Master gain + lowpass filter untuk boost bass
      const master = ctx.createGain()
      master.gain.value = 2.0
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 120 // cut everything above 120Hz — pure bass
      lowpass.Q.value = 2 // slight resonance untuk thump lebih punchy
      master.connect(lowpass).connect(ctx.destination)

      // Helper: single thump (sine + sub-bass sine untuk thump yang lebih ngebass)
      const thump = (t0: number, freq: number, dur: number, gain: number) => {
        // Sine utama
        const osc = ctx.createOscillator()
        const env = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t0)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + dur)
        env.gain.setValueAtTime(0, t0)
        env.gain.linearRampToValueAtTime(gain, t0 + 0.008) // attack 8ms
        env.gain.exponentialRampToValueAtTime(0.001, t0 + dur) // decay
        osc.connect(env).connect(master)
        osc.start(t0)
        osc.stop(t0 + dur + 0.02)

        // Sub-bass (frekuensi 0.5x) untuk thump lebih dalam
        const sub = ctx.createOscillator()
        const subEnv = ctx.createGain()
        sub.type = 'sine'
        sub.frequency.setValueAtTime(freq * 0.5, t0)
        sub.frequency.exponentialRampToValueAtTime(freq * 0.25, t0 + dur)
        subEnv.gain.setValueAtTime(0, t0)
        subEnv.gain.linearRampToValueAtTime(gain * 0.7, t0 + 0.01)
        subEnv.gain.exponentialRampToValueAtTime(0.001, t0 + dur * 0.8)
        sub.connect(subEnv).connect(master)
        sub.start(t0)
        sub.stop(t0 + dur + 0.02)
      }

      // Lub (lebih rendah, lebih lama) lalu Dub (lebih tinggi, lebih pendek)
      thump(ctx.currentTime, 45, 0.25, 1.0) // lub — deeper bass
      thump(ctx.currentTime + 0.22, 65, 0.15, 0.85) // dub
    } catch (err) {
      console.warn('[heartbeat] audio error:', err)
    }
  }, [])

  const triggerHit = useCallback(() => {
    playHeartbeat()
    setHitTrigger((v) => v + 1)
  }, [playHeartbeat])

  // Persist hit settings to localStorage
  useEffect(() => {
    localStorage.setItem('hit-damage-settings', JSON.stringify(hitSettings))
  }, [hitSettings])

  // ─── Auto-load video dari saved path pas mount / reload ───
  useEffect(() => {
    const savedPath = localStorage.getItem('project-video-path')
    console.log('[auto-load] savedPath:', savedPath, 'videoFile:', videoFile)
    if (!savedPath || videoFile) return // kalau sudah ada file terpilih, skip

    window.project.fileExists(savedPath).then((exists) => {
      console.log('[auto-load] fileExists:', exists, 'path:', savedPath)
      if (exists) {
        const url = `file://${savedPath}`
        console.log('[auto-load] setting videoUrl:', url)
        setVideoUrl(url)
        setVideoMissing(false)
      } else {
        console.log('[auto-load] file missing!')
        setVideoMissing(true)
      }
    }).catch((err) => {
      console.log('[auto-load] error:', err)
      setVideoMissing(true)
    })
  }, [videoFile])

  // Revoke blob URL when component unmounts
  useEffect(() => () => {
    if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl)
  }, [videoUrl])
  const gameplayRef = useRef<HTMLDivElement>(null)

  // ─── Video time tracking — re-attach saat masuk fullscreen ───
  useEffect(() => {
    if (!isFullscreen) return
    const v = videoRef.current
    if (!v) return
    const onTime = () => setVideoTime(v.currentTime)
    const onMeta = () => {
      setVideoDuration(v.duration)
      // ─── Restore session time: set currentTime ke posisi terakhir ───
      const saved = localStorage.getItem('project-video-session-time')
      if (saved) {
        const t = Number(saved)
        if (t > 0 && t < v.duration) {
          v.currentTime = t
          console.log('[video] restored session time:', t)
        }
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
    }
  }, [isFullscreen, videoUrl])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
    } else {
      v.pause()
    }
  }, [])

  // ─── Keyboard: Space = play/pause ───
  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      // Jangan tangkap kalau user lagi mengetik di input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
      // 'd' = trigger hit damage
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        recorder.recordEvent({ type: 'hit-damage' })
        triggerHit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen, togglePlay, triggerHit, recorder])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const time = Number(e.target.value)
    recorder.recordEvent({ type: 'video-seek', time })
    v.currentTime = time
  }, [recorder])

  // ─── Volume control — apply ke video element + persist ───
  // Re-apply saat volume berubah ATAU saat video element baru dibuat (masuk fullscreen / ganti video)
  useEffect(() => {
    const v = videoRef.current
    if (v) v.volume = volume
    localStorage.setItem('video-volume', String(volume))
  }, [volume, isFullscreen, videoUrl])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }, [])

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // ─── Sound FX ───
  const playOpenSound = useCallback(() => {
    const audio = new Audio('/sound/page-flip.mp3')
    audio.playbackRate = 2.0
    audio.volume = 0.7
    audio.play().catch(() => {})
  }, [])

  const playCloseSound = useCallback(() => {
    const audio = new Audio('/sound/book-close.mp3')
    audio.playbackRate = 2.0
    audio.volume = 0.7
    audio.play().catch(() => {})
  }, [])

  const doClose = useCallback(() => {
    playCloseSound()
    setIsClosing(true)
    setTimeout(() => {
      setActivePanel(null)
      setIsClosing(false)
    }, 200)
  }, [playCloseSound])

  const handleClosePanel = useCallback(() => {
    recorder.recordEvent({ type: 'panel-close' })
    doClose()
  }, [recorder, doClose])

  const handleMenuSelect = useCallback((id: string) => {
    recorder.recordEvent({ type: 'hud-select', panelId: id })
    if (id === 'browser') {
      setActivePanel(null)
      playOpenSound()
      setShowBrowserGate(true)
    } else {
      setActivePanel((prev) => {
        if (prev === id) {
          doClose()
          return prev // keep id agar animasi fade-out bisa jalan
        }
        playOpenSound()
        return id
      })
    }
  }, [recorder, doClose, playOpenSound])

  const handleVideoSelect = useCallback((file: File | null) => {
    setVideoFile(file)
    if (file) {
      const name = file.name
      const size = (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      setVideoName(name)
      setVideoSize(size)
      setVideoMissing(false)
      // Revoke previous blob URL
      if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl)
      setVideoUrl(URL.createObjectURL(file))
      localStorage.setItem('project-video-name', name)
      localStorage.setItem('project-video-size', size)
      try {
        const path = window.project.getFilePath(file)
        console.log('[video-select] getFilePath:', path)
        if (path) localStorage.setItem('project-video-path', path)
      } catch (err) {
        console.log('[video-select] getFilePath error:', err)
      }
    } else {
      setVideoName(null)
      setVideoSize(null)
      setVideoUrl(null)
      setVideoMissing(false)
      localStorage.removeItem('project-video-name')
      localStorage.removeItem('project-video-size')
      localStorage.removeItem('project-video-path')
    }
  }, [videoUrl])

  // Pause video when any panel is opened or browser gateway shows — only in admin mode
  useEffect(() => {
    if (!isFullscreen && (activePanel || showBrowserGate) && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [activePanel, showBrowserGate, isFullscreen])

  const handleOpenBrowser = useCallback(() => {
    recorder.recordEvent({ type: 'browser-show' })
    playOpenSound()
    setShowBrowserGate(false)
    setActivePanel('browser')
  }, [recorder, playOpenSound])

  const handleCloseBrowserGate = useCallback(() => {
    playCloseSound()
    setShowBrowserGate(false)
  }, [playCloseSound])

  // ─── Screenshot crop — capture gameplay area (DOM → canvas → dataURL) ───
  const triggerCrop = useCallback(async () => {
    const el = gameplayRef.current
    if (!el) return
    try {
      // Pause video otomatis biar frame stabil pas crop
      const videoEl = el.querySelector('video')
      if (videoEl && !videoEl.paused) videoEl.pause()

      const rect = el.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w === 0 || h === 0) return

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)

      // ─── Cek apakah ada <video> di dalam area ───
      if (videoEl && videoEl.videoWidth > 0) {
        // Draw video frame langsung — object-contain fit
        const vw = videoEl.videoWidth
        const vh = videoEl.videoHeight
        const scale = Math.min(w / vw, h / vh)
        const drawW = vw * scale
        const drawH = vh * scale
        const dx = (w - drawW) / 2
        const dy = (h - drawH) / 2
        ctx.drawImage(videoEl, dx, dy, drawW, drawH)
      } else {
        // Fallback: DOM clone via SVG foreignObject (untuk placeholder text)
        const clone = el.cloneNode(true) as HTMLElement
        inlineStyles(el, clone)
        const data = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">${clone.outerHTML}</div>
            </foreignObject>
          </svg>`
        const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to render'))
          img.src = url
        })
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
      }

      setCropDataUrl(canvas.toDataURL('image/png'))
      playOpenSound()
    } catch {
      // Silently fail — user will try again
    }
  }, [playOpenSound])

  const handleCropDone = useCallback(async (croppedDataUrl: string) => {
    setCropDataUrl(null)
    // Copy to clipboard (like Windows 11 Snipping Tool — paste anywhere)
    try {
      const blob = await (await fetch(croppedDataUrl)).blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch {
      // Fallback: save to disk if clipboard fails
      await window.browser.saveImage(croppedDataUrl)
    }
  }, [])

  const handleCropCancel = useCallback(() => setCropDataUrl(null), [])

  // ─── Project save/load handlers ────────────
  const handleCollectState = useCallback(() => {
    let videoPath: string | null = null
    if (videoFile) {
      try {
        videoPath = window.project.getFilePath(videoFile) || null
      } catch {
        videoPath = localStorage.getItem('project-video-path') || null
      }
    }
    if (!videoPath) {
      videoPath = localStorage.getItem('project-video-path') || null
    }
    console.log('[collect-state] videoPath:', videoPath, 'videoName:', videoName, 'videoSize:', videoSize)
    const sessionTime = Number(localStorage.getItem('project-video-session-time') || '0')
    const data = collectProjectState(projectName, videoPath, videoName, videoSize, videoTime, isPlaying, sessionTime)
    return JSON.stringify(data, null, 2)
  }, [projectName, videoFile, videoName, videoSize, videoTime, isPlaying])

  const handleRestore = useCallback((json: string) => {
    try {
      const data = JSON.parse(json)
      console.log('[restore] videoPath:', data.videoPath, 'videoName:', data.videoName, 'videoSize:', data.videoSize)
      restoreProjectState(data)
      console.log('[restore] localStorage video-path:', localStorage.getItem('project-video-path'))
      const restoredSessionTime = (data.videoSessionTime as number) ?? 0
      setLastSessionTime(restoredSessionTime || null)
      return {
        videoPath: data.videoPath as string | null,
        videoTime: (data.videoTime as number) ?? 0,
        isPlaying: (data.isPlaying as boolean) ?? false,
      }
    } catch (err) {
      console.log('[restore] error:', err)
      return { videoPath: null, videoTime: 0, isPlaying: false }
    }
  }, [])

  const handleLoadSuccess = useCallback((_videoPath: string | null, _videoTime: number, _isPlaying: boolean) => {
    // Reload halaman agar semua komponen anak membaca ulang localStorage
    window.location.reload()
  }, [])

  // Track perubahan — set isModified = true tiap ada perubahan di localStorage
  useEffect(() => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key: string, value: string) => {
      if (key.startsWith('inventory-') || key.startsWith('cost-') || key.startsWith('gallery-')) {
        isModifiedRef.current = true
      }
      return originalSetItem(key, value)
    }
    return () => { localStorage.setItem = originalSetItem }
  }, [])

  // Track video/playback changes
  useEffect(() => {
    if (videoFile !== undefined) isModifiedRef.current = true
  }, [videoFile])

  const isModified = isModifiedRef.current
  const clearModified = useCallback(() => { isModifiedRef.current = false }, [])

  // Sync state kalau user tekan Esc untuk keluar fullscreen
  useEffect(() => {
    const handler = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)
      // Kalau user tekan Esc (keluar fullscreen) — tanya dulu
      if (!isNowFullscreen) {
        // Simpan session time video terakhir
        const currentTime = videoRef.current?.currentTime ?? 0
        const sessionTime = videoUrl ? currentTime : 0
        localStorage.setItem('project-video-session-time', String(sessionTime))
        setLastSessionTime(sessionTime || null)
        setShowExitConfirm(true)
      }
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [videoUrl])

  // ─── Register replay handlers — dipanggil oleh replay engine ───
  useEffect(() => {
    recorder.setReplayHandlers({
      onHudSelect: (panelId: string) => handleMenuSelect(panelId),
      onPanelClose: () => handleClosePanel(),
      onVideoPlay: () => videoRef.current?.play(),
      onVideoPause: () => videoRef.current?.pause(),
      onVideoSeek: (time: number) => {
        if (videoRef.current) videoRef.current.currentTime = time
      },
      onBrowserNavigate: (url: string) => {
        // Browser navigate di-handle via window.browser API
        ;(window as any).__activeTabId &&
          window.browser.navigate((window as any).__activeTabId, url)
      },
      onBrowserShow: () => {
        window.browser.show({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight })
      },
      onBrowserHide: () => {
        window.browser.hide()
      },
      onBrowserBack: () => {
        ;(window as any).__activeTabId && window.browser.goBack((window as any).__activeTabId)
      },
      onBrowserForward: () => {
        ;(window as any).__activeTabId && window.browser.goForward((window as any).__activeTabId)
      },
      onBrowserReload: () => {
        ;(window as any).__activeTabId && window.browser.reload((window as any).__activeTabId)
      },
      onBrowserNewTab: (url?: string) => {
        // Trigger via global function yang BrowserPanel sediakan
        ;(window as any).__browserNewTab?.(url)
      },
      onBrowserCloseTab: (tabId: string) => {
        ;(window as any).__browserCloseTab?.(tabId)
      },
      onBrowserSwitchTab: (tabId: string) => {
        ;(window as any).__browserSwitchTab?.(tabId)
      },
      onHitDamage: () => {
        triggerHit()
      },
    })
  }, [recorder, handleMenuSelect, handleClosePanel, triggerHit])

  // ─── Replay file input ref ───
  const replayFileRef = useRef<HTMLInputElement>(null)

  const handleReplayFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const session = await recorder.loadSession(file)
    if (session) {
      toggleFullscreen()
      // Tunggu fullscreen selesai, lalu start replay
      setTimeout(() => {
        recorder.startReplay(session)
      }, 500)
    }
    e.target.value = '' // reset input
  }, [recorder, toggleFullscreen])

  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false)
  }, [])

  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false)
    // Kembali ke fullscreen
    document.documentElement.requestFullscreen().catch(() => {})
  }, [])

  // ─── Render ───
  return (
    <>
      {/* Exit fullscreen confirm modal — renders above both modes */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center shadow-2xl animate-fade-in">
            <p className="text-3xl">🚪</p>
            <h2 className="mt-3 text-lg font-semibold text-white">Keluar dari mode fullscreen?</h2>
            <p className="mt-1 text-sm text-white/50">Kamu akan kembali ke dashboard admin.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Tetap di sini
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 active:scale-95"
              >
                Ya, keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {isFullscreen ? (
        /* ─── Fullscreen mode ─── */
        <div className="fixed inset-0 z-50 cursor-crosshair text-white" style={{ backgroundColor: (!videoVisible && chromaBgColor) ? chromaBgColor : '#000000' }}>
          {/* Video player — edge-to-edge fullscreen */}
          <div ref={gameplayRef} className="absolute inset-0 flex items-center justify-center">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className={`h-full w-full object-contain ${videoVisible ? '' : 'hidden'}`}
                  onError={(e) => console.log('[video] error:', e.currentTarget.error, 'src:', videoUrl)}
                  onLoadedData={() => console.log('[video] loaded data OK:', videoUrl)}
                  onCanPlay={() => console.log('[video] can play:', videoUrl)}
                />

                {/* Custom control bar — persistent, hanya muncul kalau showControls on DAN video visible */}
                {videoVisible && showControls && (
                  <div
                    className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-4 pt-12"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {/* Seek bar */}
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 0}
                      step={0.1}
                      value={videoTime}
                      onChange={handleSeek}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="mb-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-orange-400 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Play / Pause */}
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePlay() }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20"
                        >
                          {isPlaying ? '⏸' : '▶️'}
                        </button>

                        {/* Time */}
                        <span className="font-mono text-sm text-white/80">
                          {formatTime(videoTime)} / {formatTime(videoDuration)}
                        </span>

                        {/* Volume control */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setVolume(volume > 0 ? 0 : 1) }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm transition hover:bg-white/20"
                          >
                            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            onChange={handleVolumeChange}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-orange-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : videoVisible ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-white/70">Video player area</p>
                <p className="mt-2 text-sm text-white/40">Pilih video .mp4 di dashboard admin dulu ya.</p>
              </div>
            ) : null}
          </div>

          {/* Left sidebar hover zone — invisible trigger area di tepi kiri */}
          <div
            className="absolute left-0 top-0 z-20 h-full w-4"
            onMouseEnter={() => setSidebarHovered(true)}
          />

          {/* Left sidebar HUD — auto-hide dengan animasi slide */}
          <div
            className="absolute left-4 top-1/2 z-20"
            style={{
              opacity: sidebarHovered ? 1 : 0,
              transform: sidebarHovered ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-30px)',
              pointerEvents: sidebarHovered ? 'auto' : 'none',
              transition: 'opacity 300ms ease-out, transform 300ms ease-out',
            }}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            <GameHUD
              items={MENU_ITEMS}
              activeId={activePanel}
              onSelect={handleMenuSelect}
              onCropScreenshot={triggerCrop}
              showControls={showControls}
              onToggleControls={() => setShowControls((v) => !v)}
            />
          </div>

          {/* Browser gateway modal — muncul sebelum browser */}
          {showBrowserGate && (
            <BrowserGatewayModal
              onOpenBrowser={handleOpenBrowser}
              onClose={handleCloseBrowserGate}
            />
          )}

          {/* Panel overlay */}
          {activePanel && (
            <div className={`absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
              <div className={`relative shadow-2xl backdrop-blur-2xl ${
                activePanel === 'browser'
                  ? `w-full rounded-2xl border border-white/10 bg-white/5 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`
                  : activePanel === 'gallery'
                    ? `max-w-[32rem] w-full rounded-2xl border border-white/10 bg-zinc-900/95 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`
                    : `min-w-[36rem] rounded-2xl border border-white/10 bg-zinc-900/95 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`
              }`}>
                {activePanel !== 'browser' && (
                  <button
                    data-recorder-handled
                    onClick={handleClosePanel}
                    className="absolute right-3 top-3 z-10 rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/20 hover:text-white"
                  >
                    ✕
                  </button>
                )}
                {activePanel === 'inventory' && <InventoryPanel embedded />}
                {activePanel === 'cost' && <CostDisplay embedded />}
                {activePanel === 'gallery' && <GalleryDisplay embedded />}
                {activePanel === 'browser' && (
                  <BrowserPanel
                    onClosePanel={handleClosePanel}
                    recorder={recorder}
                  />
                )}
              </div>
            </div>
          )}

          {/* Screenshot crop overlay */}
          {cropDataUrl && (
            <CropOverlay
              imageDataUrl={cropDataUrl}
              onCrop={handleCropDone}
              onCancel={handleCropCancel}
            />
          )}

          {/* Fake cursor — tampil saat replay */}
          <FakeCursor
            x={recorder.cursorPos?.x ?? 0}
            y={recorder.cursorPos?.y ?? 0}
            visible={recorder.cursorVisible}
          />

          {/* Hit damage overlay — trigger dengan tombol 'D' */}
          <HitDamageOverlay trigger={hitTrigger} settings={hitSettings} />

          {/* Replay indicator */}
          {recorder.isReplaying && (
            <div data-recorder-ui className="absolute right-4 top-4 z-50 flex items-center gap-2 rounded-xl bg-blue-500/90 px-3 py-2 text-sm font-semibold text-white shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Replaying...
              <button
                onClick={recorder.stopReplay}
                className="ml-2 rounded-lg bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
              >
                Stop
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ─── Admin mode ─── */
        <div className="space-y-3">

          {/* Project header — Option B: 2-row layout */}
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
            {/* Row 1: Badge + Project Name + Fullscreen */}
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span className="shrink-0 rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">Gameplay</span>
                <span className="truncate text-sm font-semibold text-slate-800" title={projectName}>{projectName}</span>
                {isModified && <span className="text-orange-500 text-sm">*</span>}
              </div>
              <button
                onClick={toggleFullscreen}
                className="ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-400 active:scale-95"
              >
                ⛶ Fullscreen
              </button>
            </div>
            {/* Row 2: Session time + action buttons */}
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                {lastSessionTime !== null && lastSessionTime > 0 && (
                  <p className="text-[10px] text-slate-400">
                    Sesi terakhir: <span className="font-mono font-semibold text-orange-500">{formatTime(lastSessionTime)}</span>
                  </p>
                )}
              </div>
              <ProjectManager
                projectName={projectName}
                onRenameProject={setProjectName}
                currentFilePath={currentFilePath}
                onFilePathChange={setCurrentFilePath}
                onCollectState={handleCollectState}
                onRestore={handleRestore}
                isModified={isModified}
                onClearModified={clearModified}
                onLoadSuccess={handleLoadSuccess}
                mode="buttons-only"
              />
            </div>
          </div>

          {/* Toolbar — grouped actions in one compact row */}
          <div data-recorder-ui className="flex items-center rounded-xl border border-slate-200 bg-white px-2 py-1.5">
            {/* Group: Recording */}
            <div className="flex items-center gap-1">
              {!recorder.isRecording ? (
                <button
                  onClick={() => {
                    recorder.startRecording()
                    toggleFullscreen()
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Record
                </button>
              ) : (
                <button
                  onClick={() => {
                    const session = recorder.stopRecording()
                    if (session) recorder.exportSession(session)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-100 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-200"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Stop
                </button>
              )}
              <button
                onClick={() => replayFileRef.current?.click()}
                disabled={recorder.isRecording}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-40"
              >
                ▶ Replay
              </button>
              <input ref={replayFileRef} type="file" accept=".json" onChange={handleReplayFileSelect} className="hidden" />
            </div>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-slate-200" />

            {/* Group: Settings */}
            <div className="flex items-center gap-1">
              <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordCursor}
                  onChange={(e) => {
                    setRecordCursor(e.target.checked)
                    localStorage.setItem('record-cursor', String(e.target.checked))
                  }}
                  className="h-3.5 w-3.5 rounded text-orange-500 focus:ring-orange-400"
                />
                Cursor
              </label>
            </div>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-slate-200" />

            {/* Group: Settings */}
            <div className="flex items-center gap-1">
              <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordCursor}
                  onChange={(e) => {
                    setRecordCursor(e.target.checked)
                    localStorage.setItem('record-cursor', String(e.target.checked))
                  }}
                  className="h-3.5 w-3.5 rounded text-orange-500 focus:ring-orange-400"
                />
                Cursor
              </label>
            </div>
          </div>

          {/* VFX / Hit Damage — its own section */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Hit Damage</span>
                <button
                  onClick={triggerHit}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-red-100"
                >
                  💥 Test
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Tekan <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-600">D</kbd> di fullscreen
              </p>
            </div>

            {/* Toggle effects */}
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 transition ${
                  hitSettings.vignette
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={hitSettings.vignette}
                  onChange={(e) => setHitSettings((s) => ({ ...s, vignette: e.target.checked }))}
                  className="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Red Vignette</p>
                  <p className="text-[10px] text-slate-400">Flash merah dari tepi</p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 transition ${
                  hitSettings.bloodSplatter
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={hitSettings.bloodSplatter}
                  onChange={(e) => setHitSettings((s) => ({ ...s, bloodSplatter: e.target.checked }))}
                  className="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Blood Splatter</p>
                  <p className="text-[10px] text-slate-400">Bercak darah di layar</p>
                </div>
              </label>
            </div>

            {/* Blood splatter parameters */}
            {hitSettings.bloodSplatter && (
              <div className="mt-2 grid grid-cols-3 gap-3 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
                <div>
                  <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                    <span>Bercak/hit</span>
                    <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{hitSettings.splatterCount}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={hitSettings.splatterCount}
                    onChange={(e) => setHitSettings((s) => ({ ...s, splatterCount: Number(e.target.value) }))}
                    className="mt-1 w-full accent-red-600"
                  />
                  <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                    <span>1</span><span>20</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                    <span>Durasi</span>
                    <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{(hitSettings.splatterDuration / 1000).toFixed(1)}s</span>
                  </label>
                  <input
                    type="range"
                    min={1000}
                    max={10000}
                    step={500}
                    value={hitSettings.splatterDuration}
                    onChange={(e) => setHitSettings((s) => ({ ...s, splatterDuration: Number(e.target.value) }))}
                    className="mt-1 w-full accent-red-600"
                  />
                  <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                    <span>1s</span><span>10s</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                    <span>Ukuran</span>
                    <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{hitSettings.splatterSize.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={hitSettings.splatterSize}
                    onChange={(e) => setHitSettings((s) => ({ ...s, splatterSize: Number(e.target.value) }))}
                    className="mt-1 w-full accent-red-600"
                  />
                  <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                    <span>0.5x</span><span>3.0x</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vignette parameters */}
            {hitSettings.vignette && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Warna:</span>
                  <button
                    onClick={() => setHitSettings((s) => ({ ...s, vignetteColor: 'red' }))}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                      hitSettings.vignetteColor === 'red'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white text-slate-500 hover:bg-red-50'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    Merah
                  </button>
                  <button
                    onClick={() => setHitSettings((s) => ({ ...s, vignetteColor: 'white' }))}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                      hitSettings.vignetteColor === 'white'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-300" />
                    Putih
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                      <span>Intensitas</span>
                      <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{Math.round(hitSettings.vignetteIntensity * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0.05}
                      max={0.3}
                      step={0.01}
                      value={hitSettings.vignetteIntensity}
                      onChange={(e) => setHitSettings((s) => ({ ...s, vignetteIntensity: Number(e.target.value) }))}
                      className="mt-1 w-full accent-red-600"
                    />
                    <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                      <span>5%</span><span>30%</span>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                      <span>Spread</span>
                      <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{hitSettings.vignetteSpread}%</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={5}
                      value={hitSettings.vignetteSpread}
                      onChange={(e) => setHitSettings((s) => ({ ...s, vignetteSpread: Number(e.target.value) }))}
                      className="mt-1 w-full accent-red-600"
                    />
                    <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                      <span>10%</span><span>60%</span>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                      <span>Durasi</span>
                      <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{(hitSettings.vignetteDuration / 1000).toFixed(1)}s</span>
                    </label>
                    <input
                      type="range"
                      min={1000}
                      max={10000}
                      step={500}
                      value={hitSettings.vignetteDuration}
                      onChange={(e) => setHitSettings((s) => ({ ...s, vignetteDuration: Number(e.target.value) }))}
                      className="mt-1 w-full accent-red-600"
                    />
                    <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                      <span>1s</span><span>10s</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Source */}
          <VideoSelector
            onSelect={handleVideoSelect}
            initialFile={videoFile}
            fallbackName={videoName}
            fallbackSize={videoSize}
            fallbackUrl={videoUrl}
            videoVisible={videoVisible}
            onToggleVideoVisible={(v) => {
              setVideoVisible(v)
              localStorage.setItem('video-visible', String(v))
            }}
            chromaBgColor={chromaBgColor}
            onChromaBgColorChange={(c) => {
              setChromaBgColor(c)
              if (c) localStorage.setItem('chroma-bg-color', c)
              else localStorage.removeItem('chroma-bg-color')
            }}
          />

          {/* Missing video warning */}
          {videoMissing && videoName && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-800">File video tidak ditemukan</p>
                <p className="text-[10px] text-amber-600 truncate">
                  {videoName}{videoSize ? ` (${videoSize})` : ''}
                </p>
              </div>
              <span className="text-[10px] text-amber-400">Pilih ulang</span>
            </div>
          )}

          {/* Inventory Setup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <InventoryPanel />
          </div>

          {/* Cost Setup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <CostPanel />
          </div>

          {/* Gallery Setup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <GalleryPanel />
          </div>
          {/* Screenshot crop overlay — triggered from HUD toolbar or browser */}
          {cropDataUrl && (
            <CropOverlay
              imageDataUrl={cropDataUrl}
              onCrop={handleCropDone}
              onCancel={handleCropCancel}
            />
          )}
        </div>
      )}
    </>
  )
}
