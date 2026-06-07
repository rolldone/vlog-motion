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
}

export type MapPoint = {
  id: string
  x: number
  y: number
  label: string
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
}
