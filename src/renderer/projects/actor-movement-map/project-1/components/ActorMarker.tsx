import { forwardRef } from 'react'
import type { Point, ActorState, ActorAssets } from '../types'
import { getIconSrc, getShapeClass, getSizeStyle, getBorderClass } from './IconPicker'
import { resolveActorAsset } from '../actorAssets'

type ActorMarkerProps = {
  point: Point
  icon?: string
  shape?: 'circle' | 'square' | 'rounded' | 'diamond' | 'none'
  size?: number
  border?: 'none' | 'thin' | 'normal' | 'thick'
  actorState?: ActorState
  actorAssets?: ActorAssets
}

export const ActorMarker = forwardRef<HTMLDivElement, ActorMarkerProps>(function ActorMarker(
  { point, icon, shape = 'circle', size = 32, border = 'normal', actorState, actorAssets },
  ref,
) {
  // Resolve display icon: state-based asset (via registry) → default icon
  const stateAssetSrc = actorState && actorAssets?.[actorState] ? resolveActorAsset(actorAssets[actorState]) : undefined
  const displayIcon = stateAssetSrc ? undefined : icon  // if we have a sprite, skip the icon
  const iconSrc = stateAssetSrc ?? getIconSrc(displayIcon)
  const isNone = shape === 'none'
  const isDiamond = shape === 'diamond'
  const hasIcon = !!iconSrc
  const showWrapper = !isNone
  const hasBorder = border !== 'none'

  return (
    <div
      ref={ref}
      className={`absolute z-[100] flex items-center justify-center font-bold shadow-lg transition ${
        getBorderClass(border)} ${
        isDiamond ? 'rotate-45' : ''
      } ${
        showWrapper
          ? `${getShapeClass(shape)} ${hasBorder ? 'border-white' : ''} bg-white`
          : hasIcon
            ? ''
            : 'rounded-full border-0 bg-green-500'
      }`}
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
        transform: 'translate(-50%, -50%)',
        ...(!showWrapper && !hasIcon ? { width: Math.round(size * 0.6), height: Math.round(size * 0.6) } : {}),
        ...(showWrapper ? getSizeStyle(size) : {}),
      }}
    >
      {hasIcon ? (
        <img
          src={iconSrc}
          alt="Actor"
          className={`${isDiamond ? '-rotate-45 ' : ''}${
            showWrapper ? 'h-full w-full rounded-full object-cover p-0.5' : 'h-full w-full object-contain drop-shadow-md'
          }`}
        />
      ) : showWrapper ? (
        <span className={`${isDiamond ? '-rotate-45 ' : ''}text-green-500`}>●</span>
      ) : null}
    </div>
  )
})
