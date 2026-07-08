import { useRef, useCallback } from 'react'

export interface GalleryImageEntry {
  id: string
  title: string
  path: string
  size: string
}

const STORAGE_KEY = 'gallery-images'

/** Baca daftar gambar custom dari localStorage */
export function loadGalleryImages(): GalleryImageEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

/** Simpan daftar gambar custom ke localStorage */
export function saveGalleryImages(images: GalleryImageEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images))
}

interface GallerySelectorProps {
  /** Daftar gambar custom dari parent */
  customImages: GalleryImageEntry[]
  /** Set ID yang tercentang */
  checkedIds: Set<string>
  /** Toggle checkbox */
  onToggleCheck: (id: string) => void
  /** Tambah gambar baru */
  onAddImages: (entries: GalleryImageEntry[]) => void
  /** Hapus gambar custom */
  onRemoveImage: (id: string) => void
  /** Reorder gambar custom */
  onReorderImage: (id: string, direction: 'up' | 'down') => void
}

export function GallerySelector({
  customImages,
  checkedIds,
  onToggleCheck,
  onAddImages,
  onRemoveImage,
  onReorderImage,
}: GallerySelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newEntries: GalleryImageEntry[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      let path = ''
      try {
        path = window.project.getFilePath(file)
      } catch {
        path = URL.createObjectURL(file)
      }

      newEntries.push({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: file.name,
        path,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      })
    }

    if (newEntries.length > 0) {
      onAddImages(newEntries)
    }

    if (inputRef.current) inputRef.current.value = ''
  }, [onAddImages])

  // Build src URL untuk display
  const getSrc = (path: string) =>
    path.startsWith('blob:') || path.startsWith('file:') || path.startsWith('http')
      ? path
      : `file://${path}`

  // Hanya custom images — tidak ada default items lagi
  const allItems = customImages.map((img) => ({
    id: img.id,
    title: img.title,
    src: getSrc(img.path),
  }))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🖼️</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
              Gallery Images
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Daftar Gambar</h3>
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-pink-500 active:scale-95"
        >
          + Tambah Gambar
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      {/* List view */}
      {allItems.length > 0 ? (
        <div className="mt-4 space-y-2">
          {allItems.map((item, index) => {
            const checked = checkedIds.has(item.id)

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl border-2 p-2.5 transition ${
                  checked ? 'border-pink-400 bg-pink-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => onToggleCheck(item.id)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                    checked
                      ? 'border-pink-500 bg-pink-500 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked && (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Thumbnail */}
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />

                {/* Title + size */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{customImages[index]?.size ?? ''}</p>
                </div>

                {/* Reorder + remove */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onReorderImage(item.id, 'up')}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Pindah ke atas"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => onReorderImage(item.id, 'down')}
                    disabled={index === allItems.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Pindah ke bawah"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRemoveImage(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-100"
                    title="Hapus gambar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 transition hover:border-pink-400 hover:bg-pink-50/30"
        >
          <span className="text-4xl">📸</span>
          <p className="mt-3 text-sm font-semibold text-slate-600">Klik untuk pilih gambar</p>
          <p className="mt-1 text-xs text-slate-400">JPG, PNG, GIF, WebP — bisa pilih banyak sekaligus</p>
        </div>
      )}
    </div>
  )
}