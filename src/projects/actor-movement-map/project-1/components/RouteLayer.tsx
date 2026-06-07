import type { Point, Line } from '../types'

type RouteLayerProps = {
  lines: Line[]
  activeLineId: string | null
  selectedLineId: string | null
  highlightedLineId?: string | null
}

const buildPointsString = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(' ')

const LINE_STYLE_MAP = {
  solid: undefined,
  dashed: '4 2',
  dotted: '1 2',
}

export function RouteLayer({ lines, activeLineId, selectedLineId, highlightedLineId }: RouteLayerProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines.map((line) => {
        if (line.points.length < 2) return null
        const isActive = line.id === activeLineId
        const isSelected = line.id === selectedLineId
        const isHighlighted = line.id === highlightedLineId
        const emphasized = isActive || isSelected || isHighlighted
        const pts = buildPointsString(line.points)

        const lineColor = line.color ?? '#10b981'
        const lineStyle = line.lineStyle ?? 'solid'
        const lineWidth = line.width ?? 0.9
        const lineOpacity = line.opacity ?? 1
        const lineGlow = line.glow ?? true
        const dashArray = isActive ? '6 4' : LINE_STYLE_MAP[lineStyle]
        const displayWidth = emphasized ? Math.max(lineWidth, 1.4) : lineWidth

        return (
          <g key={line.id}>
            {/* glow (only when enabled or highlighted) */}
            {(lineGlow || isHighlighted) && (
            <polyline
              points={pts}
              fill="none"
              stroke={isHighlighted ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.96)'}
              strokeWidth={String(displayWidth + (isHighlighted ? 1 : 0.5))}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            )}
            {/* colored line */}
            <polyline
              points={pts}
              fill="none"
              stroke={isHighlighted ? '#3b82f6' : lineColor}
              strokeWidth={String(displayWidth)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dashArray}
              strokeOpacity={emphasized ? 1 : lineOpacity}
            />
          </g>
        )
      })}
    </svg>
  )
}

