import { useCallback } from 'react'

const OPEN_SOUND = '/sound/page-flip.mp3'
const CLOSE_SOUND = '/sound/book-close.mp3'

export function useSounds() {
  /** Open modal — page flip */
  const playOpen = useCallback(() => {
    const audio = new Audio(OPEN_SOUND)
    audio.volume = 0.6
    audio.playbackRate = 1.8
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  /** Close modal — book close */
  const playClose = useCallback(() => {
    const audio = new Audio(CLOSE_SOUND)
    audio.volume = 0.6
    audio.playbackRate = 1.8
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  return { playOpen, playClose }
}
