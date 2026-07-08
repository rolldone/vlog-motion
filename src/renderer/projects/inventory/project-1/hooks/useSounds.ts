import { useRef, useCallback } from 'react'

/**
 * Sound effects — mix of real MP3s and Web Audio API.
 */
export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  /** Use button (percentage) — gun-reload.mp3, speed varies with amount */
  const playUse = useCallback((amount: number) => {
    const audio = new Audio('/sound/gun-reload.mp3')
    audio.playbackRate = amount === 100 ? 2.5 : amount === 50 ? 2.0 : 1.6
    audio.volume = 0.7
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  /** Single-use button — gun-reload.mp3, fast */
  const playSingleUse = useCallback(() => {
    const audio = new Audio('/sound/gun-reload.mp3')
    audio.playbackRate = 2.5
    audio.volume = 0.7
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  /** Item depleted — sad descending tone */
  const playDepleted = useCallback(() => {
    const ctx = getCtx()
    const now = ctx.currentTime

    const notes = [440, 350, 260]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + i * 0.12)

      gain.gain.setValueAtTime(0.35, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.15)
    })
  }, [getCtx])

  /** Undo — reverse whoosh (ascending) */
  const playUndo = useCallback(() => {
    const ctx = getCtx()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2)

    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.25)
  }, [getCtx])

  /** Reset — swoosh noise burst */
  const playReset = useCallback(() => {
    const ctx = getCtx()
    const now = ctx.currentTime

    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1000, now)
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.15)
    filter.Q.value = 0.5

    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start(now)
  }, [getCtx])

  /** Open modal/page — page-flip.mp3, sped up */
  const playOpen = useCallback(() => {
    const audio = new Audio('/sound/page-flip.mp3')
    audio.playbackRate = 2.0
    audio.volume = 0.7
    audio.play().catch(() => {})
  }, [])

  /** Close modal/page — book-close.mp3, sped up */
  const playClose = useCallback(() => {
    const audio = new Audio('/sound/book-close.mp3')
    audio.playbackRate = 2.0
    audio.volume = 0.7
    audio.play().catch(() => {})
  }, [])

  return { playUse, playSingleUse, playDepleted, playUndo, playReset, playOpen, playClose }
}
