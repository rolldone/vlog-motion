// ─── Project File Type ─────────────────────────────────────────
// Ini adalah struktur file .donis yang akan di-save/load

export interface InventoryItemSnapshot {
  id: string
  icon: string
  label: string
  durability: number
  maxDurability: number
  useMode: 'multi' | 'single'
}

export interface CostEntrySnapshot {
  id: string
  icon: string
  label: string
  amount: number
  timestamp: number
}

export interface GalleryImageSnapshot {
  id: string
  title: string
  path: string
  size: string
}

export interface ProjectFile {
  /** Versi format file — buat backward compatibility nanti */
  version: 1
  /** Nama project (bisa beda dari nama file) */
  name: string
  /** Timestamp terakhir disave */
  savedAt: number
  /** Timestamp pertama kali dibuat */
  createdAt: number

  // ─── Video ───
  videoPath: string | null
  videoName: string | null
  videoSize: string | null
  videoTime: number
  isPlaying: boolean
  /** Posisi video terakhir saat exit fullscreen (session time) */
  videoSessionTime: number

  // ─── Inventory ───
  inventory: {
    items: InventoryItemSnapshot[]
    history: unknown[] // JSON-serializable history entries
    checkedIds: string[]
    customOrder: string[]
    sortMode: string
    bgColor: string
  }

  // ─── Cost ───
  cost: {
    total: number
    history: CostEntrySnapshot[]
    bgColor: string
  }

  // ─── Gallery ───
  gallery: {
    images: GalleryImageSnapshot[]
    checkedIds: string[]
    bgColor: string
  }
}

/** Recent file entry — disimpan di localStorage */
export interface RecentFile {
  name: string
  path: string
  lastOpened: number
}

export const RECENT_FILES_KEY = 'project-recent-files'
export const MAX_RECENT_FILES = 10
export const PROJECT_FILE_EXT = '.donis'
