// ─── Recording Event Types ───────────────────────────
export type RecordingEvent =
  | { t: number; type: 'mousemove'; x: number; y: number }
  | { t: number; type: 'click'; selector: string; label?: string; x: number; y: number }
  | { t: number; type: 'hud-select'; panelId: string }
  | { t: number; type: 'panel-close' }
  | { t: number; type: 'browser-navigate'; url: string }
  | { t: number; type: 'browser-show' }
  | { t: number; type: 'browser-hide' }
  | { t: number; type: 'browser-back' }
  | { t: number; type: 'browser-forward' }
  | { t: number; type: 'browser-reload' }
  | { t: number; type: 'browser-newtab'; url?: string }
  | { t: number; type: 'browser-closetab'; tabId: string }
  | { t: number; type: 'browser-switchtab'; tabId: string }
  | { t: number; type: 'video-play' }
  | { t: number; type: 'video-pause' }
  | { t: number; type: 'video-seek'; time: number }
  | { t: number; type: 'hit-damage' }

export interface RecordingSession {
  version: 1
  name: string
  createdAt: string
  videoName: string | null
  fps: number
  events: RecordingEvent[]
}

// ─── Distributive Omit — works with union types ───
export type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never

// ─── Event input type (RecordingEvent without 't') ───
export type RecordingEventInput = DistributiveOmit<RecordingEvent, 't'>

// ─── Generate stable CSS selector for element ────────
export function generateSelector(el: HTMLElement): string {
  // Priority 1: data-rec-id (kalau ada)
  if (el.dataset.recId) return `[data-rec-id="${el.dataset.recId}"]`

  // Priority 2: id
  if (el.id) return `#${el.id}`

  // Priority 3: data-testid
  if (el.dataset.testid) return `[data-testid="${el.dataset.testid}"]`

  // Priority 4: nth-of-type path (max depth 5)
  const parts: string[] = []
  let current: HTMLElement | null = el
  let depth = 0
  while (current && current !== document.body && depth < 5) {
    const tag = current.tagName.toLowerCase()
    const parent: HTMLElement | null = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === current!.tagName,
      )
      const index = siblings.indexOf(current)
      parts.unshift(index > 0 ? `${tag}:nth-of-type(${index + 1})` : tag)
    }
    current = parent
    depth++
  }
  return parts.join(' > ')
}

// ─── Export session as JSON string ───────────────────
export function exportSessionJSON(session: RecordingSession): string {
  return JSON.stringify(session, null, 2)
}

// ─── Parse JSON string → RecordingSession ────────────
export function parseSessionJSON(json: string): RecordingSession | null {
  try {
    const data = JSON.parse(json)
    if (data.version === 1 && Array.isArray(data.events)) {
      return data as RecordingSession
    }
    console.error('[recorder] Invalid session format')
    return null
  } catch {
    console.error('[recorder] Failed to parse session JSON')
    return null
  }
}

// ─── Download a string as a file ──────────────────────
export function downloadFile(content: string, filename: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}