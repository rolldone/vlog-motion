// ─── Shared AudioContext + MediaStreamAudioDestinationNode ───
// All app sounds route through this mixer so the WebM recorder can capture audio.
// Usage:
//   const mixer = useAudioMixer()
//   mixer.playBuffer(buffer, { playbackRate, volume })
//   mixer.playOscillator(...)  // for synthesized sounds like heartbeat
//   mixer.stream  → MediaStream audio track for MediaRecorder

import { useRef, useCallback, useEffect } from 'react'

export function useAudioMixer() {
  const ctxRef = useRef<AudioContext | null>(null)
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map())
  const sampleRateRef = useRef<number>(0)

  // ─── Lazy init AudioContext + destination + master gain ───
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      // Force 48kHz to match WebM/opus standard — prevents pitch/speed shift in recording
      try {
        ctxRef.current = new Ctx({ sampleRate: 48000 })
      } catch {
        ctxRef.current = new Ctx() // fallback if 48kHz not supported
      }
      sampleRateRef.current = ctxRef.current.sampleRate
      console.log(`[audio-mixer] AudioContext created @ ${sampleRateRef.current}Hz`)

      destRef.current = ctxRef.current.createMediaStreamDestination()
      masterGainRef.current = ctxRef.current.createGain()
      masterGainRef.current.gain.value = 1.0
      // Master gain → both speakers AND recording destination
      masterGainRef.current.connect(ctxRef.current.destination)
      masterGainRef.current.connect(destRef.current)
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }, [])

  // ─── Get audio stream for MediaRecorder ───
  const getAudioStream = useCallback(() => {
    ensureCtx()
    return destRef.current?.stream ?? null
  }, [ensureCtx])

  // ─── Get master gain node (connect your audio nodes here) ───
  const getMasterInput = useCallback(() => {
    ensureCtx()
    return masterGainRef.current!
  }, [ensureCtx])

  // ─── Play an audio buffer (for sound effects like page-flip, book-close) ───
  // Buffers are cached after first decode so repeated plays have zero latency.
  const playBuffer = useCallback(async (url: string, opts?: { playbackRate?: number; volume?: number }) => {
    const ctx = ensureCtx()
    const rate = opts?.playbackRate ?? 1.0
    const vol = opts?.volume ?? 1.0

    try {
      // Use cached buffer if available
      let audioBuf = bufferCacheRef.current.get(url) ?? null
      if (!audioBuf) {
        const res = await fetch(url)
        const arrayBuf = await res.arrayBuffer()
        audioBuf = await ctx.decodeAudioData(arrayBuf)
        bufferCacheRef.current.set(url, audioBuf)
      }

      const src = ctx.createBufferSource()
      src.buffer = audioBuf
      src.playbackRate.value = rate

      const gain = ctx.createGain()
      gain.gain.value = vol

      src.connect(gain).connect(masterGainRef.current!)
      src.start()
      src.onended = () => {
        src.disconnect()
        gain.disconnect()
      }
    } catch (err) {
      console.warn('[audio-mixer] failed to play buffer:', url, err)
    }
  }, [ensureCtx])

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      bufferCacheRef.current.clear()
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close()
      }
      ctxRef.current = null
      destRef.current = null
      masterGainRef.current = null
    }
  }, [])

  return {
    ensureCtx,
    getAudioStream,
    getMasterInput,
    playBuffer,
  }
}