import { useCallback } from 'react'

const OPEN_SOUND = '/sound/page-flip.mp3'
const CLOSE_SOUND = '/sound/book-close.mp3'

/**
 * Sound effects — all routed through global AudioMixer so WebM recorder captures them.
 * Requires window.__audioMixer to be set by parent (GamePlay1Page).
 */
export function useSounds() {
  const getMixer = useCallback(() => {
    const m = (window as any).__audioMixer
    if (!m) {
      console.warn('[gallery-sounds] no global audioMixer found — falling back to new Audio()')
    }
    return m
  }, [])

  /** Open modal — page flip */
  const playOpen = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const audio = new Audio(OPEN_SOUND)
      audio.volume = 0.6
      audio.playbackRate = 1.8
      audio.play().catch(() => {})
      return
    }
    m.playBuffer(OPEN_SOUND, { playbackRate: 1.8, volume: 0.6 })
  }, [getMixer])

  /** Close modal — book close */
  const playClose = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const audio = new Audio(CLOSE_SOUND)
      audio.volume = 0.6
      audio.playbackRate = 1.8
      audio.play().catch(() => {})
      return
    }
    m.playBuffer(CLOSE_SOUND, { playbackRate: 1.8, volume: 0.6 })
  }, [getMixer])

  return { playOpen, playClose }
}
