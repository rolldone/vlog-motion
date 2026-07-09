// ─── GIF Recorder — desktopCapturer → video stream → canvas crop → GIF ───
// Usage: tekan R untuk start/stop recording
// Uses Electron desktopCapturer to capture the app window in real-time,
// crops each frame to the target element's screen coordinates, encodes to GIF via gifenc.
// Note: No transparency (desktopCapturer captures opaque screen pixels).

import { useRef, useState, useCallback } from 'react'
// @ts-ignore - gifenc has no type declarations
import { GIFEncoder, quantize, applyPalette } from 'gifenc'

const FPS = 30
const INTERVAL_MS = 1000 / FPS

export function useGifRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [framesCount, setFramesCount] = useState(0)
  const framesRef = useRef<ImageData[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sizeRef = useRef<{ w: number; h: number } | null>(null)
  const targetElRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const startRecording = useCallback(async (targetEl: HTMLElement) => {
    if (isRecording) return

    // ─── Get desktopCapturer source ID from main process ───
    const sourceId = await window.gifRecorder.getSource()
    if (!sourceId) {
      console.error('[gif-recorder] failed to get desktopCapturer source')
      return
    }

    // ─── Get video stream from the source ───
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore — Electron-specific chromeMediaSource constraint
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 4096,
            minHeight: 720,
            maxHeight: 2160,
          },
        },
      })
      streamRef.current = stream
    } catch (err) {
      console.error('[gif-recorder] getUserMedia failed:', err)
      return
    }

    // ─── Create hidden video element to hold the stream ───
    const video = document.createElement('video')
    video.srcObject = streamRef.current
    video.muted = true
    video.playsInline = true
    video.style.position = 'fixed'
    video.style.top = '-9999px'
    video.style.left = '-9999px'
    video.style.width = '2px'
    video.style.height = '2px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    document.body.appendChild(video)
    videoRef.current = video

    await video.play().catch((err) => console.warn('[gif-recorder] video.play() warning:', err))

    // ─── Setup canvas at target element size ───
    const rect = targetEl.getBoundingClientRect()
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)
    if (w === 0 || h === 0) {
      console.error('[gif-recorder] target element has zero size')
      // cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.remove()
        videoRef.current = null
      }
      return
    }
    sizeRef.current = { w, h }
    targetElRef.current = targetEl

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvasRef.current = canvas

    framesRef.current = []
    setFramesCount(0)
    setIsRecording(true)

    // ─── Capture loop: draw video frame → crop to target rect → store ImageData ───
    intervalRef.current = setInterval(() => {
      const v = videoRef.current
      const cvs = canvasRef.current
      const el = targetElRef.current
      const sz = sizeRef.current
      if (!v || !cvs || !el || !sz) return
      if (v.videoWidth === 0 || v.videoHeight === 0) return

      // Get target element's position relative to the screen
      // desktopCapturer captures the full window content area
      const elRect = el.getBoundingClientRect()

      // Scale factor: video stream resolution vs window inner size
      const scaleX = v.videoWidth / window.innerWidth
      const scaleY = v.videoHeight / window.innerHeight

      // Source coordinates in the video frame (crop region)
      const sx = elRect.left * scaleX
      const sy = elRect.top * scaleY
      const sw = elRect.width * scaleX
      const sh = elRect.height * scaleY

      const ctx = cvs.getContext('2d')!
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, sz.w, sz.h)

      try {
        ctx.drawImage(v, sx, sy, sw, sh, 0, 0, sz.w, sz.h)
        const imageData = ctx.getImageData(0, 0, sz.w, sz.h)
        framesRef.current.push(imageData)
        setFramesCount((c) => c + 1)
      } catch (err) {
        console.warn('[gif-recorder] frame draw error:', err)
      }
    }, INTERVAL_MS)
  }, [isRecording])

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording) return null
    setIsRecording(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const frames = framesRef.current
    const sz = sizeRef.current

    // Stop stream & remove video element
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.remove()
      videoRef.current = null
    }

    if (frames.length === 0 || !sz) {
      framesRef.current = []
      sizeRef.current = null
      return null
    }

    const { w, h } = sz
    console.log(`[gif-recorder] encoding ${frames.length} frames → GIF (${w}x${h})`)

    const gif = GIFEncoder()

    for (const frame of frames) {
      const rgba = frame.data
      const palette = quantize(rgba, 256, { format: 'rgba4444' })
      const index = applyPalette(rgba, palette, 'rgba4444')
      gif.writeFrame(index, w, h, {
        palette,
        delay: INTERVAL_MS,
      })
    }

    gif.finish()
    const bytes = gif.bytes()
    console.log(`[gif-recorder] done! ${(bytes.length / 1024).toFixed(1)} KB`)

    setFramesCount(0)
    framesRef.current = []
    sizeRef.current = null

    // Save via Electron dialog
    const defaultName = `gameplay-${Date.now()}.gif`
    const filePath = await window.gifRecorder.saveDialog(defaultName)

    if (filePath) {
      const saved = await window.gifRecorder.saveFile(filePath, bytes)
      if (saved) {
        console.log(`[gif-recorder] saved to ${filePath}`)
      } else {
        console.error('[gif-recorder] failed to save file')
      }
    } else {
      console.log('[gif-recorder] save cancelled')
    }

    return filePath
  }, [isRecording])

  const toggleRecording = useCallback((targetEl: HTMLElement | null) => {
    if (!targetEl) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording(targetEl)
    }
  }, [isRecording, startRecording, stopRecording])

  return { isRecording, framesCount, startRecording, stopRecording, toggleRecording }
}