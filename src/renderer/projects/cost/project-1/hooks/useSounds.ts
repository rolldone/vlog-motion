import { useCallback } from 'react'

const CACHING_SOUND = '/sound/latent-rick-retro-cash-register-ka-ching-with-coin-drawer-1-546555.mp3'
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
      console.warn('[cost-sounds] no global audioMixer found — falling back to new Audio()')
    }
    return m
  }, [])

  /** Cash register ka-ching */
  const playDamage = useCallback(() => {
    const m = getMixer()
    if (!m) {
      const audio = new Audio(CACHING_SOUND)
      audio.volume = 0.7
      audio.play().catch(() => {})
      return
    }
    m.playBuffer(CACHING_SOUND, { volume: 0.7 })
  }, [getMixer])

  /** Open modal — page flip (sped up) */
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

  /** Close modal — book close (sped up) */
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

  return { playDamage, playOpen, playClose }
}
