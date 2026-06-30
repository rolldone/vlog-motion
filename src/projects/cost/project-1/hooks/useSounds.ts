import { useCallback } from 'react'

const CACHING_SOUND = '/sound/latent-rick-retro-cash-register-ka-ching-with-coin-drawer-1-546555.mp3'
const OPEN_SOUND = '/sound/page-flip.mp3'
const CLOSE_SOUND = '/sound/book-close.mp3'

export function useSounds() {
  /** Cash register ka-ching (real mp3) */
  const playDamage = useCallback(() => {
    const audio = new Audio(CACHING_SOUND)
    audio.volume = 0.7
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  /** Open modal — page flip (sped up) */
  const playOpen = useCallback(() => {
    const audio = new Audio(OPEN_SOUND)
    audio.volume = 0.6
    audio.playbackRate = 1.8
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  /** Close modal — book close (sped up) */
  const playClose = useCallback(() => {
    const audio = new Audio(CLOSE_SOUND)
    audio.volume = 0.6
    audio.playbackRate = 1.8
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  return { playDamage, playOpen, playClose }
}
