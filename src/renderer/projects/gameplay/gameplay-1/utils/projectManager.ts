// ─── Project file utility: collect state → file, restore state ← file ───
import type { ProjectFile, RecentFile, InventoryItemSnapshot, CostEntrySnapshot, GalleryImageSnapshot } from '../types'
import { RECENT_FILES_KEY, MAX_RECENT_FILES } from '../types'

// ─── Collect all current state from localStorage → ProjectFile ───
export function collectProjectState(name: string, videoPath: string | null, videoName: string | null, videoSize: string | null, videoTime: number, isPlaying: boolean, videoSessionTime: number): ProjectFile {
  const now = Date.now()

  // Inventory
  let invItems: InventoryItemSnapshot[] = []
  let invHistory: unknown[] = []
  let invCheckedIds: string[] = []
  let invCustomOrder: string[] = []
  let invSortMode = 'default'
  let invBgColor = '#0f172a'
  try {
    invItems = JSON.parse(localStorage.getItem('inventory-items') || '[]')
    invHistory = JSON.parse(localStorage.getItem('inventory-history') || '[]')
    invCheckedIds = JSON.parse(localStorage.getItem('inventory-checked-ids') || '[]')
    invCustomOrder = JSON.parse(localStorage.getItem('inventory-custom-order') || '[]')
    invSortMode = localStorage.getItem('inventory-sort-mode') || 'default'
    invBgColor = localStorage.getItem('inventory-bg-color') || '#0f172a'
  } catch { /* ignore */ }

  // Cost
  let costTotal = 0
  let costHistory: CostEntrySnapshot[] = []
  let costBgColor = '#0f172a'
  try {
    costTotal = Number(localStorage.getItem('cost-total') || '0')
    costHistory = JSON.parse(localStorage.getItem('cost-history') || '[]')
    costBgColor = localStorage.getItem('cost-bg-color') || '#0f172a'
  } catch { /* ignore */ }

  // Gallery
  let galImages: GalleryImageSnapshot[] = []
  let galCheckedIds: string[] = []
  let galBgColor = '#0f172a'
  try {
    galImages = JSON.parse(localStorage.getItem('gallery-images') || '[]')
    galCheckedIds = JSON.parse(localStorage.getItem('gallery-checked-ids') || '[]')
    galBgColor = localStorage.getItem('gallery-bg-color') || '#0f172a'
  } catch { /* ignore */ }

  return {
    version: 1,
    name,
    savedAt: now,
    createdAt: now,
    videoPath,
    videoName,
    videoSize,
    videoTime,
    isPlaying,
    videoSessionTime,
    inventory: {
      items: invItems,
      history: invHistory,
      checkedIds: invCheckedIds,
      customOrder: invCustomOrder,
      sortMode: invSortMode,
      bgColor: invBgColor,
    },
    cost: {
      total: costTotal,
      history: costHistory,
      bgColor: costBgColor,
    },
    gallery: {
      images: galImages,
      checkedIds: galCheckedIds,
      bgColor: galBgColor,
    },
  }
}

// ─── Restore state from ProjectFile → localStorage ───
export function restoreProjectState(data: ProjectFile): void {
  // Inventory
  if (data.inventory) {
    localStorage.setItem('inventory-items', JSON.stringify(data.inventory.items))
    localStorage.setItem('inventory-history', JSON.stringify(data.inventory.history))
    localStorage.setItem('inventory-checked-ids', JSON.stringify(data.inventory.checkedIds))
    localStorage.setItem('inventory-custom-order', JSON.stringify(data.inventory.customOrder))
    localStorage.setItem('inventory-sort-mode', data.inventory.sortMode || 'default')
    localStorage.setItem('inventory-bg-color', data.inventory.bgColor)
  }

  // Cost
  if (data.cost) {
    localStorage.setItem('cost-total', String(data.cost.total))
    localStorage.setItem('cost-history', JSON.stringify(data.cost.history))
    localStorage.setItem('cost-bg-color', data.cost.bgColor)
  }

  // Gallery
  if (data.gallery) {
    localStorage.setItem('gallery-images', JSON.stringify(data.gallery.images || []))
    localStorage.setItem('gallery-checked-ids', JSON.stringify(data.gallery.checkedIds))
    localStorage.setItem('gallery-bg-color', data.gallery.bgColor)
  }

  // Video info (buat referensi kalau file missing)
  localStorage.setItem('project-video-name', data.videoName || '')
  localStorage.setItem('project-video-size', data.videoSize || '')
  localStorage.setItem('project-video-path', data.videoPath || '')
  // Session time video terakhir
  localStorage.setItem('project-video-session-time', String(data.videoSessionTime ?? 0))
}

// ─── Recent files management ───────────────────────────────────

export function getRecentFiles(): RecentFile[] {
  try {
    const raw = localStorage.getItem(RECENT_FILES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRecentFile(name: string, path: string): RecentFile[] {
  const files = getRecentFiles()
  // Remove existing entry with same path
  const filtered = files.filter((f) => f.path !== path)
  // Add to front
  const updated: RecentFile[] = [{ name, path, lastOpened: Date.now() }, ...filtered]
  // Trim
  const trimmed = updated.slice(0, MAX_RECENT_FILES)
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed))
  return trimmed
}

export function removeRecentFile(path: string): RecentFile[] {
  const files = getRecentFiles().filter((f) => f.path !== path)
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files))
  return files
}

export function clearRecentFiles(): void {
  localStorage.removeItem(RECENT_FILES_KEY)
}
