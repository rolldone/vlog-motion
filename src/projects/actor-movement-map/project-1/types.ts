export type Point = {
  x: number
  y: number
}

export type Line = {
  id: string
  points: Point[]
  color?: string
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  width?: number
  opacity?: number
  glow?: boolean
  /** Invisible waypoints between checkpoints for actor step-by-step movement */
  walkingPoints?: WalkingPoint[]
}

export type MapPoint = {
  id: string
  x: number
  y: number
  label: string
}

/** Actor animation states */
export type ActorState = 'idle' | 'walking' | 'stop' | 'finish'

/** Invisible intermediate waypoint between checkpoints on a line */
export type WalkingPoint = {
  id: string
  lineId: string
  /** Resolved x,y coordinates (snapped to nearest line segment) */
  x: number
  y: number
}

/** Animation asset IDs (filenames) for each actor state, resolved via actorAssets.ts registry */
export type ActorAssets = {
  idle?: string
  walking?: string
  stop?: string
  finish?: string
}

export type Checkpoint = Point & {
  id: string
  label: string
  lineId: string
  pointIndex: number
  path: Point[]
  icon?: string
  shape?: 'circle' | 'square' | 'rounded' | 'diamond' | 'none'
  /** Size in px (wrapper diameter). Default 32. */
  size?: number
  border?: 'none' | 'thin' | 'normal' | 'thick'
  /** Actor state when arriving at this checkpoint (default: 'finish') */
  actorState?: ActorState
}
