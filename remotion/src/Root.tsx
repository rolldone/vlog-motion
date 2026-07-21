import { Composition } from 'remotion'
import { Modal2Video } from './Modal2Video'

export function RemotionRoot() {
  return (
    <>
      {/* 30fps × 4s = 120 frames total */}
      <Composition
        id="Modal2Video"
        component={Modal2Video}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
