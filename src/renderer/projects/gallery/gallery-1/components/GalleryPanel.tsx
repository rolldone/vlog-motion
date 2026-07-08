import { useState, useRef, useEffect, useCallback } from 'react'
import { animate } from '@motionone/dom'
import { useSounds } from '../hooks/useSounds'
import { GallerySelector, loadGalleryImages, saveGalleryImages, type GalleryImageEntry } from './GallerySelector'

export function GalleryPanel() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string; src: string } | null>(null)
  const [bgColor, setBgColor] = useState(() => {
    try { return localStorage.getItem('gallery-bg-color') || '#0f172a' } catch { return '#0f172a' }
  })
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('gallery-checked-ids')
      if (saved) return new Set(JSON.parse(saved))
    } catch { /* ignore */ }
    return new Set()
  })
  // Custom images dari localStorage
  const [customImages, setCustomImages] = useState<GalleryImageEntry[]>(() => loadGalleryImages())

  // Sinkronisasi custom images kalau localStorage berubah (misalnya habis load project)
  useEffect(() => {
    const sync = () => setCustomImages(loadGalleryImages())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  // Hanya custom images — tidak ada default items
  const allItems = customImages.map((img) => ({
    id: img.id,
    title: img.title,
    src: img.path.startsWith('blob:') || img.path.startsWith('file:') || img.path.startsWith('http') ? img.path : `file://${img.path}`,
  }))

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('gallery-checked-ids', JSON.stringify([...checkedIds]))
  }, [checkedIds])
  useEffect(() => {
    localStorage.setItem('gallery-bg-color', bgColor)
  }, [bgColor])

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ─── Custom images: add / remove / reorder ───
  const handleAddImages = useCallback((entries: GalleryImageEntry[]) => {
    setCustomImages((prev) => {
      const updated = [...prev, ...entries]
      saveGalleryImages(updated)
      return updated
    })
    // Auto-check gambar baru
    setCheckedIds((prev) => {
      const next = new Set(prev)
      entries.forEach((e) => next.add(e.id))
      return next
    })
  }, [])

  const handleRemoveImage = useCallback((id: string) => {
    setCustomImages((prev) => {
      const updated = prev.filter((img) => img.id !== id)
      saveGalleryImages(updated)
      return updated
    })
    // Uncheck gambar yang dihapus
    setCheckedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const handleReorderImage = useCallback((id: string, direction: 'up' | 'down') => {
    setCustomImages((prev) => {
      const idx = prev.findIndex((img) => img.id === id)
      if (idx < 0) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev
      const updated = [...prev]
      ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]
      saveGalleryImages(updated)
      return updated
    })
  }, [])

  const galleryItems = allItems.filter((g) => checkedIds.has(g.id))

  const panelRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  const { playOpen, playClose } = useSounds()

  // Animasi masuk fullscreen
  useEffect(() => {
    if (isFullscreen && panelRef.current) {
      animate(
        panelRef.current,
        { opacity: [0, 1] },
        { duration: 0.3, easing: 'ease-out' }
      )
    }
  }, [isFullscreen])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // ─── Open gallery modal ───
  const openGallery = useCallback(() => {
    setIsGalleryOpen(true)
    playOpen()
    requestAnimationFrame(() => {
      if (galleryRef.current) {
        animate(
          galleryRef.current,
          {
            opacity: [0, 1],
            transform: ['translateY(30px) scale(0.97)', 'translateY(0) scale(1)'],
          },
          { duration: 0.3, easing: 'ease-out' }
        )
      }
    })
  }, [playOpen])

  const closeGallery = useCallback(() => {
    if (galleryRef.current) {
      playClose()
      animate(
        galleryRef.current,
        {
          opacity: [1, 0],
          transform: ['translateY(0) scale(1)', 'translateY(20px) scale(0.97)'],
        },
        { duration: 0.15, easing: 'ease-in' }
      ).finished.then(() => {
        setIsGalleryOpen(false)
      })
    } else {
      setIsGalleryOpen(false)
    }
  }, [playClose])

  // ─── Open detail modal ───
  const openDetail = useCallback((item: GalleryItem) => {
    setSelectedItem(item)
    playOpen()
    requestAnimationFrame(() => {
      if (detailRef.current) {
        animate(
          detailRef.current,
          {
            opacity: [0, 1],
            transform: ['scale(0.92)', 'scale(1)'],
          },
          { duration: 0.3, easing: 'ease-out' }
        )
      }
    })
  }, [playOpen])

  const closeDetail = useCallback(() => {
    if (detailRef.current) {
      playClose()
      animate(
        detailRef.current,
        {
          opacity: [1, 0],
          transform: ['scale(1)', 'scale(0.95)'],
        },
        { duration: 0.15, easing: 'ease-in' }
      ).finished.then(() => {
        setSelectedItem(null)
      })
    } else {
      setSelectedItem(null)
    }
  }, [playClose])

  // ─── Pagination (filtered) ───
  const currentIndex = selectedItem
    ? galleryItems.findIndex((g) => g.id === selectedItem.id)
    : -1

  const goNext = useCallback(() => {
    if (currentIndex < 0 || galleryItems.length === 0) return
    const next = galleryItems[(currentIndex + 1) % galleryItems.length]
    setSelectedItem(next)
    playOpen()
    if (detailRef.current) {
      animate(
        detailRef.current,
        { opacity: [0.5, 1], transform: ['translateX(30px)', 'translateX(0)'] },
        { duration: 0.25, easing: 'ease-out' }
      )
    }
  }, [currentIndex, galleryItems, playOpen])

  const goPrev = useCallback(() => {
    if (currentIndex < 0 || galleryItems.length === 0) return
    const prev = galleryItems[(currentIndex - 1 + galleryItems.length) % galleryItems.length]
    setSelectedItem(prev)
    playOpen()
    if (detailRef.current) {
      animate(
        detailRef.current,
        { opacity: [0.5, 1], transform: ['translateX(-30px)', 'translateX(0)'] },
        { duration: 0.25, easing: 'ease-out' }
      )
    }
  }, [currentIndex, galleryItems, playOpen])

  // Keyboard nav for detail modal
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

  /* ─── Fullscreen mode ─── */
  if (isFullscreen) {
    return (
      <div
        ref={panelRef}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white cursor-pointer-all"
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🖼️</span>
              <h1 className="text-lg font-semibold text-white">Gallery</h1>

              {/* BG Color picker */}
              <div className="flex items-center gap-1.5 ml-3">
                {([
                  { color: '#0f172a', label: 'Dark' },
                  { color: '#00ff00', label: 'Green' },
                  { color: '#ffffff', label: 'Putih' },
                  { color: '#ef4444', label: 'Merah' },
                ] as const).map((opt) => (
                  <button
                    key={opt.color}
                    onClick={() => setBgColor(opt.color)}
                    className={`h-7 w-7 rounded-lg border-2 transition hover:scale-110 ${
                      bgColor === opt.color ? 'border-pink-400' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: opt.color }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openGallery}
                className="rounded-xl bg-pink-600 px-5 py-2 text-sm font-bold text-white uppercase tracking-wider transition hover:bg-pink-500 active:scale-95"
              >
                📸 Open Gallery
              </button>

              <button
                onClick={toggleFullscreen}
                className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                ✕ Close
              </button>
            </div>
          </header>

          {/* Center area */}
          <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: bgColor }} />
        </div>

        {/* Modal: Gallery View */}
        {isGalleryOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
            <div
              ref={galleryRef}
              className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-400">
                    Gallery
                  </p>
                  <h3 className="text-lg font-semibold text-white">Photo Gallery</h3>
                </div>
                <button
                  onClick={closeGallery}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[60vh] overflow-y-auto pr-1">
                {galleryItems.length === 0 ? (
                  <p className="col-span-full text-center text-sm text-slate-500 py-10">Tidak ada gambar. Tambah dan centang gambar di halaman utama dulu.</p>
                ) : galleryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openDetail(item)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition hover:ring-2 hover:ring-pink-400"
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      className="aspect-square w-full object-cover transition duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-xs font-semibold text-white">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Image Detail */}
        {selectedItem && (
          <div
            className="absolute inset-0 z-[70] flex items-center justify-center p-6"
            onClick={closeDetail}
          >
            <div
              ref={detailRef}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
            >
              {/* Prev button */}
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80 active:scale-90"
                title="Previous (←)"
              >
                ‹
              </button>
              {/* Next button */}
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80 active:scale-90"
                title="Next (→)"
              >
                ›
              </button>

              <div className="relative">
                <img
                  src={selectedItem.src}
                  alt={selectedItem.title}
                  className="w-full max-h-[70vh] object-contain bg-black"
                />
                <button
                  onClick={closeDetail}
                  className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-400">
                      Detail
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{selectedItem.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">ID: {selectedItem.id}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {currentIndex + 1} / {galleryItems.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─── Inline mode ─── */
  return (
    <div className="space-y-6">
      {/* Header card */}
      <div
        onClick={toggleFullscreen}
        className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">Gallery 1</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Photo Gallery
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Tambah gambar, centang yang ingin ditampilkan, lalu klik card ini untuk masuk fullscreen.
            </p>
          </div>
          <span className="rounded-full bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700 ring-1 ring-pink-200">
            {checkedIds.size} / {allItems.length} dipilih
          </span>
        </div>
      </div>

      {/* Image selector — list view dengan checkbox + reorder */}
      <GallerySelector
        customImages={customImages}
        checkedIds={checkedIds}
        onToggleCheck={toggleCheck}
        onAddImages={handleAddImages}
        onRemoveImage={handleRemoveImage}
        onReorderImage={handleReorderImage}
      />
    </div>
  )
}
