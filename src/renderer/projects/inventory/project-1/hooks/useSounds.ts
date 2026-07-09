import { useCallback } from 'react'

/**
 * Sound effects — all routed through global AudioMixer so WebM recorder captures them.
 * Requires window.__audioMixer to be set by parent (GamePlay1Page).
 */
export function useSounds() {
  const getMixer = useCallback(() => {
    const m = (window as any).__audioMixer as { ensureCtx: () => AudioContext; getMasterInput: () => AudioNode; playBuffer: (url: string, opts?: { playbackRate?: number; volume?: number }) => void } | undefined
    if (!m) {
      console.warn('[inventory-sounds] no global audioMixer found — falling back to new Audio()')
    }
    return m
  }, [])

  /** Use button (percentage) — gun-reload.mp3, speed varies with amount */
  const playUse = useCallback((amount: number) => {
    const m = getMixer()
    if (!m) {
      const audio = new Audio('/sound/gun-reload.mp3')
      audio.playbackRate = amount === 100 ? 2.5 : amount === 50 ? 2.0 : 1.6
      audio.volume = 0.7
      audio.play().catch(() => {})
      return
    }
    const rate = amount === 100 ? 2.5 : amount === 50 ? 2.0 : 1.6
    m.playBuffer('/sound/gun-reload.mp3', { playbackRate: rate, volume: 0.7 })
  }, [getMixer])

  /** Single-use button — gun-reload.mp3, fast */
  const playSingleUse = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const audio = new Audio('/sound/gun-reload.mp3')
      audio.playbackRate = 2.5
      audio.volume = 0.7
      audio.play().catch(() => {})
      return
    }
    m.playBuffer('/sound/gun-reload.mp3', { playbackRate: 2.5, volume: 0.7 })
  }, [getMixer])

  /** Item depleted — sad descending tone */
  const playDepleted = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const ctx = new AudioContext()
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
      return
    }
    const ctx = m.ensureCtx()
    const master = m.getMasterInput()
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
      gain.connect(master)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.15)
    })
  }, [getMixer])

  /** Undo — reverse whoosh (ascending) */
  const playUndo = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const ctx = new AudioContext()
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
      return
    }
    const ctx = m.ensureCtx()
    const master = m.getMasterInput()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2)

    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(gain)
    gain.connect(master)
    osc.start(now)
    osc.stop(now + 0.25)
  }, [getMixer])

  /** Reset — swoosh noise burst */
  const playReset = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const ctx = new AudioContext()
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
      return
    }
    const ctx = m.ensureCtx()
    const master = m.getMasterInput()
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
    gain.connect(master)
    source.start(now)
  }, [getMixer])

  /** Open modal/page — page-flip.mp3, sped up */
  const playOpen = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const audio = new Audio('/sound/page-flip.mp3')
      audio.playbackRate = 2.0
      audio.volume = 0.7
      audio.play().catch(() => {})
      return
    }
    m.playBuffer('/sound/page-flip.mp3', { playbackRate: 2.0, volume: 0.7 })
  }, [getMixer])

  /** Close modal/page — book-close.mp3, sped up */
  const playClose = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const audio = new Audio('/sound/book-close.mp3')
      audio.playbackRate = 2.0
      audio.volume = 0.7
      audio.play().catch(() => {})
      return
    }
    m.playBuffer('/sound/book-close.mp3', { playbackRate: 2.0, volume: 0.7 })
  }, [getMixer])

  return { playUse, playSingleUse, playDepleted, playUndo, playReset, playOpen, playClose }
}
