import type { Checkpoint, Line, MapPoint } from './project-1/types'

export type MapDataEntry = {
  id: string
  label: string
  backgroundId?: string
  backgroundColor?: string
  checkpoints: Checkpoint[]
  lines: Line[]
  mapPoints?: MapPoint[]
  actor?: {
    icon?: string
    shape?: 'circle' | 'square' | 'rounded' | 'diamond' | 'none'
    size?: number
    border?: 'none' | 'thin' | 'normal' | 'thick'
  }
}

// Import JSON from assets/datas/
import testData from './assets/datas/test.json'
import hartaKarun from './assets/datas/harta-karun.json'

// ── Register available map data here ──
export const AVAILABLE_DATAS: MapDataEntry[] = [
  { id: 'test', label: 'Test Map', ...(testData as Omit<MapDataEntry, 'id' | 'label'>) },
  { id: 'harta_karun', label: 'Harta Karun', ...(hartaKarun as Omit<MapDataEntry, 'id' | 'label'>) },
]
