import type { Checkpoint } from '../types'
import { getIconSrc, getShapeClass, getSizeStyle, getBorderClass } from './IconPicker'

type CheckpointLayerProps = {
  checkpoints: Checkpoint[]
  activeCheckpointId: 'start' | string
  isEditorEnabled: boolean
  highlightedCheckpointId?: string | null
  onOpenCheckpointMenu: (checkpoint: Checkpoint) => void
  onSelectCheckpoint: (checkpoint: Checkpoint) => void
}

export function CheckpointLayer({
  checkpoints,
  activeCheckpointId,
  isEditorEnabled,
  highlightedCheckpointId,
  onOpenCheckpointMenu,
  onSelectCheckpoint,
}: CheckpointLayerProps) {
  return (
    <>
      {checkpoints.map((checkpoint) => {
        const isActive = activeCheckpointId === checkpoint.id
        const isHighlighted = highlightedCheckpointId === checkpoint.id
        const shape = checkpoint.shape ?? 'circle'
        const size = checkpoint.size ?? 32
        const isNone = shape === 'none'
        const isDiamond = shape === 'diamond'
        const hasIcon = !!getIconSrc(checkpoint.icon)
        const hasShadow = checkpoint.border !== 'none'

        return (
          <div
            key={checkpoint.id}
            className="absolute z-50"
            style={{ left: `${checkpoint.x}%`, top: `${checkpoint.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Checkpoint marker */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()

                if (isEditorEnabled) {
                  onOpenCheckpointMenu(checkpoint)
                  return
                }

                onSelectCheckpoint(checkpoint)
              }}
              className={`relative z-10 flex items-center justify-center px-2 font-bold transition ${
                hasShadow ? 'shadow' : 'shadow-none'} ${
                isDiamond ? 'rotate-45' : ''}
              ${
                isNone
                  ? 'rounded-md bg-transparent border-0'
                  : `${getShapeClass(shape)} ${getBorderClass(checkpoint.border)} ${
                      isHighlighted
                        ? 'text-white border-blue-300 bg-blue-500 ring-4 ring-blue-100'
                        : isActive
                          ? 'text-white border-white bg-sky-500 ring-4 ring-sky-100'
                          : 'text-white border-white bg-sky-600 hover:bg-sky-500'
                    }`
              }`}
              style={{ ...getSizeStyle(size), fontSize: Math.round(size * 0.38) }}
              title={
                isEditorEnabled
                  ? `Click to open actions for checkpoint ${checkpoint.label}`
                  : `Checkpoint ${checkpoint.label}`
              }
            >
              {hasIcon ? (
                <img
                  src={getIconSrc(checkpoint.icon)}
                  alt={checkpoint.label}
                  className={`${isNone ? 'h-[70%] w-[70%] drop-shadow-lg' : 'w-[65%] h-[65%]'} object-contain ${isDiamond ? '-rotate-45' : ''}`}
                />
              ) : (
                <span className={isDiamond ? '-rotate-45' : ''}>{checkpoint.label}</span>
              )}
            </button>
          </div>
        )
      })}
    </>
  )
}
