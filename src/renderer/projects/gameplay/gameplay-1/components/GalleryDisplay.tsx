import { useState, useEffect, useCallback } from 'react'
import { loadGalleryImages, type GalleryImageEntry } from '../../../gallery/gallery-1/components/GallerySelector'

interface GalleryItem {
  id: string
  title: string
  src: string
}

export function GalleryDisplay({ embedded }: { embedded?: boolean }) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  const refresh = () => {
    try {
      const saved = localStorage.getItem('gallery-checked-ids')
      if (saved) setCheckedIds(new Set(JSON.parse(saved)))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    refresh()
    window.addEventListener('storage', refresh)
    const interval = setInterval(refresh, 2000)
    return () => {
      window.removeEventListener('storage', refresh)
      clearInterval(interval)
    }
  }, [])

  // Get the actual gallery items from localStorage (custom images only)
  const [allItems, setAllItems] = useState<GalleryItem[]>([])
  useEffect(() => {
    const customImgs = loadGalleryImages()
    const customItems: GalleryItem[] = customImgs.map((img: GalleryImageEntry) => ({
      id: img.id,
      title: img.title,
      src: img.path.startsWith('blob:') || img.path.startsWith('file:') || img.path.startsWith('http') ? img.path : `file://${img.path}`,
    }))
    setAllItems(customItems)
  }, [])

  const visibleItems = allItems.filter((g) => checkedIds.has(g.id))

  const openDetail = useCallback((item: GalleryItem) => setSelectedItem(item), [])
  const closeDetail = useCallback(() => setSelectedItem(null), [])
  const goNext = useCallback(() => {
    if (!selectedItem || visibleItems.length === 0) return
    const idx = visibleItems.findIndex((g) => g.id === selectedItem.id)
    const next = visibleItems[(idx + 1) % visibleItems.length]
    setSelectedItem(next)
  }, [selectedItem, visibleItems])
  const goPrev = useCallback(() => {
    if (!selectedItem || visibleItems.length === 0) return
    const idx = visibleItems.findIndex((g) => g.id === selectedItem.id)
    const prev = visibleItems[(idx - 1 + visibleItems.length) % visibleItems.length]
    setSelectedItem(prev)
  }, [selectedItem, visibleItems])

  // Keyboard nav
  useEffect(() => {
    if (!selectedItem) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') closeDetail()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedItem, goNext, goPrev, closeDetail])

  if (embedded) {
    return (
      <div className="p-5 pr-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🖼️</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-400">
              Gallery
            </p>
            <h2 className="text-lg font-semibold text-white">Photo Gallery</h2>
          </div>
          <p className="ml-auto text-xs text-slate-400">{visibleItems.length} foto</p>
        </div>

        {/* Grid — compact 2 col */}
        {visibleItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openDetail(item)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 transition hover:ring-2 hover:ring-pink-400"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="aspect-square w-full object-cover transition duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Belum ada foto. Tambah gambar di halaman Gallery dulu ya.
          </p>
        )}

        {/* Detail modal — fullscreen preview */}
        {selectedItem && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 animate-fade-in"
            onClick={closeDetail}
          >
            {/* Image — relative container for all overlays */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative inline-block"
            >
              <img
                src={selectedItem.src}
                alt={selectedItem.title}
                className="max-h-[70vh] max-w-[70vw] rounded-xl object-contain shadow-2xl"
              />

              {/* Dark overlay on image for readability */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none" />

              {/* Counter — top left inside image */}
              <div className="absolute left-3 top-3 z-30 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                {visibleItems.findIndex((g) => g.id === selectedItem.id) + 1} / {visibleItems.length}
              </div>

              {/* Close — top right inside image */}
              <button
                onClick={closeDetail}
                className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-base text-white transition hover:bg-white/20 hover:scale-110 active:scale-90 backdrop-blur-sm"
              >
                ✕
              </button>

              {/* Prev — left center inside image */}
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white transition hover:bg-white/20 hover:scale-110 active:scale-90 backdrop-blur-sm"
              >
                ‹
              </button>

              {/* Next — right center inside image */}
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white transition hover:bg-white/20 hover:scale-110 active:scale-90 backdrop-blur-sm"
              >
                ›
              </button>

              {/* Title — bottom center inside image */}
              <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center">
                <div className="rounded-full bg-black/60 px-5 py-2 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">{selectedItem.title}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Standalone mode
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-4 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">🖼️</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-400">Gallery</p>
          <p className="text-sm text-slate-300">{visibleItems.length} foto</p>
        </div>
      </div>
      {visibleItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {visibleItems.slice(0, 6).map((item) => (
            <img
              key={item.id}
              src={item.src}
              alt={item.title}
              className="aspect-square w-full rounded-lg object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  )
}
