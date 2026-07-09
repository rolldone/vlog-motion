// ─── WebM Recorder — desktopCapturer → canvas crop → MediaRecorder → WebM ───
// Records video (canvas) and audio (AudioMixer) in SEPARATE streams,
// then merges via FFmpeg for perfect A/V sync (no clock drift).
// Usage: tekan W untuk start/stop recording

import { useRef, useState, useCallback } from 'react'

const FPS = 30

export function useWebmRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const targetElRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasStreamRef = useRef<MediaStream | null>(null)
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const audioChunksRef = useRef<Blob[]>([])
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const videoBlobRef = useRef<Blob | null>(null)

  // Track how many recorders have stopped (need both before merge)
  const stopCountRef = useRef(0)

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop()
    }
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop()
    }
    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach((t) => t.stop())
      canvasStreamRef.current = null
    }
    audioStreamRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.remove()
      videoRef.current = null
    }
    canvasRef.current = null
    targetElRef.current = null
  }, [])

  const startRecording = useCallback(async (targetEl: HTMLElement, audioStream?: MediaStream | null) => {
    if (isRecording) return

    // ─── Get desktopCapturer source ID from main process ───
    const sourceId = await window.gifRecorder.getSource()
    if (!sourceId) {
      console.error('[webm-recorder] failed to get desktopCapturer source')
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
      console.error('[webm-recorder] getUserMedia failed:', err)
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

    await video.play().catch((err) => console.warn('[webm-recorder] video.play() warning:', err))

    // ─── Setup canvas at target element size ───
    const rect = targetEl.getBoundingClientRect()
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)
    if (w === 0 || h === 0) {
      console.error('[webm-recorder] target element has zero size')
      cleanup()
      return
    }
    targetElRef.current = targetEl

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d')!

    // ─── Capture canvas as stream at fixed FPS ───
    const canvasStream = canvas.captureStream(FPS)
    canvasStreamRef.current = canvasStream

    // ─── Draw loop: rAF ───
    const draw = () => {
      const v = videoRef.current
      const cvs = canvasRef.current
      const el = targetElRef.current
      if (!v || !cvs || !el) return
      if (v.videoWidth === 0 || v.videoHeight === 0) return

      const elRect = el.getBoundingClientRect()
      const scaleX = v.videoWidth / window.innerWidth
      const scaleY = v.videoHeight / window.innerHeight
      const sx = elRect.left * scaleX
      const sy = elRect.top * scaleY
      const sw = elRect.width * scaleX
      const sh = elRect.height * scaleY

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, cvs.width, cvs.height)
      try {
        ctx.drawImage(v, sx, sy, sw, sh, 0, 0, cvs.width, cvs.height)
      } catch (err) {
        // ignore
      }
    }
    let drawRafId = 0
    const drawLoop = () => {
      draw()
      drawRafId = requestAnimationFrame(drawLoop)
    }
    draw()
    drawRafId = requestAnimationFrame(drawLoop)
    rafRef.current = drawRafId

    // ─── VIDEO Recorder (canvas only, no audio) ───
    const videoMimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    const videoMimeType = videoMimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm'

    const videoRecorder = new MediaRecorder(canvasStream, {
      mimeType: videoMimeType,
      videoBitsPerSecond: 8_000_000,
    })
    videoChunksRef.current = []

    videoRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data)
    }

    videoRecorder.onstop = async () => {
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' })
      videoChunksRef.current = []
      videoBlobRef.current = blob
      console.log(`[webm-recorder] video done: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)

      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const tempPath = await window.gifRecorder.saveTemp(bytes)
      stopCountRef.current++
      tryFinish(tempPath, 'video')
    }

    videoRecorderRef.current = videoRecorder

    // ─── AUDIO Recorder (audio only, if provided) ───
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      audioStreamRef.current = audioStream

      const audioMimeTypes = ['audio/webm;codecs=opus', 'audio/webm']
      const audioMimeType = audioMimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'audio/webm'

      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: audioMimeType,
        audioBitsPerSecond: 128_000,
      })
      audioChunksRef.current = []

      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      audioRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []
        console.log(`[webm-recorder] audio done: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)

        const buffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        const tempPath = await window.gifRecorder.saveTemp(bytes)
        stopCountRef.current++
        tryFinish(tempPath, 'audio')
      }

      audioRecorderRef.current = audioRecorder
    } else {
      // No audio — will merge immediately when video stops
      stopCountRef.current = 1
    }

    // ─── Shared merge logic: called by both onstop handlers ───
    const pendingTempPaths: (string | null)[] = [null, null]
    let alreadySaving = false

    const tryFinish = async (tempPath: string | null, type: 'video' | 'audio') => {
      if (type === 'video') pendingTempPaths[0] = tempPath
      else pendingTempPaths[1] = tempPath

      // Wait until both recorders have stopped AND both temp files are saved
      const expectedStops = audioRecorderRef.current ? 2 : 1
      if (stopCountRef.current < expectedStops) return
      const videoTempPath = pendingTempPaths[0]
      const audioTempPath = pendingTempPaths[1]
      // If we expect audio, make sure the audio temp path is set too
      if (audioRecorderRef.current && (!videoTempPath || !audioTempPath)) return
      if (alreadySaving) return
      alreadySaving = true

      // Show save dialog FIRST
      const defaultName = `gameplay-${Date.now()}.webm`
      const savePath = await window.gifRecorder.saveDialogWebm(defaultName)
      if (!savePath) {
        console.log('[webm-recorder] save cancelled')
        doCleanup()
        return
      }

      // If no audio, save video blob directly
      if (!audioTempPath && videoBlobRef.current) {
        const buf = await videoBlobRef.current.arrayBuffer()
        const saved = await window.gifRecorder.saveFile(savePath, new Uint8Array(buf))
        if (saved) {
          console.log(`[webm-recorder] saved to ${savePath}`)
        } else {
          console.error('[webm-recorder] save failed')
        }
        doCleanup()
        return
      }

      // Merge video + audio via FFmpeg directly to savePath
      if (videoTempPath && audioTempPath) {
        console.log('[webm-recorder] merging with FFmpeg...')
        let ok = await window.gifRecorder.mergeWebm(videoTempPath, audioTempPath, savePath)
        // Fallback: if merge fails, try saving video only
        if (!ok && videoBlobRef.current) {
          console.warn('[webm-recorder] merge failed, saving video only')
          const buf = await videoBlobRef.current.arrayBuffer()
          ok = await window.gifRecorder.saveFile(savePath, new Uint8Array(buf))
        }
        if (ok) {
          console.log(`[webm-recorder] saved to ${savePath}`)
        } else {
          console.error('[webm-recorder] save failed')
        }
        doCleanup()
      }
    }

    const doCleanup = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (canvasStreamRef.current) {
        canvasStreamRef.current.getTracks().forEach((t) => t.stop())
        canvasStreamRef.current = null
      }
      audioStreamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.remove()
        videoRef.current = null
      }
      canvasRef.current = null
      targetElRef.current = null
    }

    // ─── Start both recorders ───
    videoRecorder.start(1000)
    if (audioRecorderRef.current) {
      audioRecorderRef.current.start(1000)
    }

    setRecordSeconds(0)
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1)
    }, 1000)
    setIsRecording(true)
    console.log(`[webm-recorder] recording ${w}x${h} @ ${FPS}fps (video: ${videoMimeType}${audioRecorderRef.current ? ', audio: opus' : ', no audio'})`)
  }, [isRecording, cleanup])

  const stopRecording = useCallback(() => {
    if (!isRecording) return
    setIsRecording(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    stopCountRef.current = 0
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop()
    }
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop()
    }
  }, [isRecording])

  const toggleRecording = useCallback((targetEl: HTMLElement | null, audioStream?: MediaStream | null) => {
    if (!targetEl) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording(targetEl, audioStream)
    }
  }, [isRecording, startRecording, stopRecording])

  return { isRecording, recordSeconds, startRecording, stopRecording, toggleRecording }
}