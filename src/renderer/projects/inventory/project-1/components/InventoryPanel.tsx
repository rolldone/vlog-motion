import { useState, useRef, useEffect, useCallback } from 'react'
import { animate } from '@motionone/dom'
import type { InventoryItem } from '../types'
import { INITIAL_ITEMS } from '../items'
import { useSounds } from '../hooks/useSounds'

type HistoryEntry = {
  itemId: string
  icon: string
  itemName: string
  amount: number
  previousDurability: number
  isReset?: boolean
  singleUse?: boolean
  snapshot?: InventoryItem[]
}

export function InventoryPanel({ embedded }: { embedded?: boolean }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [items, setItems] = useState<InventoryItem[]>((): InventoryItem[] => {
    try {
      const saved = localStorage.getItem('inventory-items')
      return saved ? JSON.parse(saved) : INITIAL_ITEMS
    } catch { return INITIAL_ITEMS }
  })
  const [history, setHistory] = useState<HistoryEntry[]>((): HistoryEntry[] => {
    try {
      const saved = localStorage.getItem('inventory-history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [bgColor, setBgColor] = useState(() => {
    try {
      return localStorage.getItem('inventory-bg-color') || '#0f172a'
    } catch { return '#0f172a' }
  })
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('inventory-checked-ids')
      if (saved) return new Set(JSON.parse(saved))
    } catch { /* ignore */ }
    return new Set(INITIAL_ITEMS.map((i) => i.id))
  })
  const [sortMode, setSortMode] = useState<'default' | 'name-asc' | 'name-desc' | 'dur-asc' | 'dur-desc' | 'custom'>(() => {
    try {
      const saved = localStorage.getItem('inventory-sort-mode')
      if (saved) return saved as 'default' | 'name-asc' | 'name-desc' | 'dur-asc' | 'dur-desc' | 'custom'
    } catch { /* ignore */ }
    return 'default'
  })
  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('inventory-custom-order')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return INITIAL_ITEMS.map((i) => i.id)
  })
  const historyListRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { playUse, playSingleUse, playDepleted, playUndo, playReset, playOpen, playClose } = useSounds()

  // Auto-scroll history ke bawah saat ada entry baru
  useEffect(() => {
    if (historyListRef.current) {
      historyListRef.current.scrollTop = historyListRef.current.scrollHeight
    }
  }, [history])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('inventory-items', JSON.stringify(items))
  }, [items])
  useEffect(() => {
    localStorage.setItem('inventory-history', JSON.stringify(history))
  }, [history])
  useEffect(() => {
    localStorage.setItem('inventory-bg-color', bgColor)
  }, [bgColor])
  useEffect(() => {
    localStorage.setItem('inventory-checked-ids', JSON.stringify([...checkedIds]))
  }, [checkedIds])
  useEffect(() => {
    localStorage.setItem('inventory-custom-order', JSON.stringify(customOrder))
  }, [customOrder])
  useEffect(() => {
    localStorage.setItem('inventory-sort-mode', sortMode)
  }, [sortMode])

  // Animasi masuk fullscreen
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isFullscreen && panelRef.current) {
      animate(
        panelRef.current,
        { opacity: [0, 1] },
        { duration: 0.3, easing: 'ease-out' }
      )
    }
  }, [isFullscreen])

  // Animasi dialog popup
  useEffect(() => {
    if (isDialogOpen && dialogRef.current) {
      animate(
        dialogRef.current,
        { opacity: [0, 1], transform: ['translateY(40px) scale(0.95)', 'translateY(0) scale(1)'] },
        { duration: 0.4, easing: [0.22, 1, 0.36, 1] }
      )
    }
  }, [isDialogOpen])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
    setIsDialogOpen(false)
  }, [])

  const openDialog = useCallback(() => {
    setIsDialogOpen(true)
    playOpen()
  }, [playOpen])

  const openDetail = useCallback(() => {
    setIsDetailOpen(true)
    playOpen()
  }, [playOpen])

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false)
    playClose()
  }, [playClose])

  const closeDialog = useCallback(() => {
    playClose()
    if (!dialogRef.current) {
      setIsDialogOpen(false)
      return
    }
    animate(
      dialogRef.current,
      { opacity: [1, 0], transform: ['translateY(0) scale(1)', 'translateY(30px) scale(0.95)'] },
      { duration: 0.25, easing: 'ease-in' }
    ).finished.then(() => setIsDialogOpen(false))
  }, [playClose])

  const moveItem = useCallback((dragId: string, dropId: string) => {
    setCustomOrder((prev) => {
      const next = [...prev]
      const fromIdx = next.indexOf(dragId)
      const toIdx = next.indexOf(dropId)
      if (fromIdx === -1 || toIdx === -1) return prev
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, dragId)
      return next
    })
    setSortMode('custom')
  }, [])

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleUse = useCallback((id: string, amount: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setHistory((prev) => [
      ...prev,
      { itemId: id, icon: item.icon, itemName: item.label, amount, previousDurability: item.durability, singleUse: item.useMode === 'single' },
    ])
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, durability: Math.max(0, i.durability - amount) }
          : i
      )
    )
    if (item.useMode === 'single') {
      playSingleUse()
    } else {
      playUse(amount)
      if (item.durability - amount <= 0) {
        setTimeout(() => playDepleted(), 250)
      }
    }
  }, [items, playUse, playDepleted, playSingleUse])

  const handleUndo = useCallback((index?: number) => {
    if (history.length === 0) return
    const target = index ?? history.length - 1
    const entry = history[target]

    if (entry.isReset && entry.snapshot) {
      setItems(entry.snapshot)
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.id === entry.itemId
            ? { ...i, durability: entry.previousDurability }
            : i
        )
      )
    }

    setHistory((prev) => prev.filter((_, i) => i !== target))
    playUndo()
  }, [history, playUndo])

  const handleReset = useCallback(() => {
    setItems(INITIAL_ITEMS)
    setHistory([])
    playReset()
  }, [playReset])

  const handleSlotClick = useCallback((_item: InventoryItem, slotEl: HTMLDivElement) => {
    animate(
      slotEl,
      { scale: [1, 1.08, 0.96, 1] },
      { duration: 0.35, easing: 'ease-out' }
    )
  }, [])

  const sortedItems = [...items].sort((a, b) => {
    switch (sortMode) {
      case 'name-asc': return a.label.localeCompare(b.label)
      case 'name-desc': return b.label.localeCompare(a.label)
      case 'dur-asc': return a.durability - b.durability
      case 'dur-desc': return b.durability - a.durability
      case 'custom': return customOrder.indexOf(a.id) - customOrder.indexOf(b.id)
      default: return 0
    }
  })

  const totalDurability = items.reduce((sum, i) => sum + i.durability, 0)
  const maxTotal = items.reduce((sum, i) => sum + i.maxDurability, 0)
  const overallPct = Math.round((totalDurability / maxTotal) * 100)

  /* ─── History panel (used in inline mode) ─── */
  const historyContent = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        History
        {history.length > 0 && (
          <span className="ml-1.5 text-amber-600">({history.length})</span>
        )}
      </p>

      <div
        ref={historyListRef}
        className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-1"
      >
        {history.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">Belum ada aksi</p>
        ) : (
          history.map((entry, i) => (
            <button
              key={i}
              onClick={() => handleUndo(i)}
              className="group flex w-full items-center gap-2 rounded-xl border border-transparent bg-white px-3 py-2 text-left text-xs transition hover:border-amber-200 hover:bg-amber-50"
            >
              <span className="shrink-0 text-amber-500 opacity-0 transition group-hover:opacity-100">
                ↩
              </span>
              <span className="flex-1 truncate text-slate-700">{entry.isReset ? '🔄 Reset semua' : entry.singleUse ? `${entry.icon} Use` : `${entry.icon} -${entry.amount}%`}</span>
              <span className="shrink-0 text-[10px] text-slate-400">#{i + 1}</span>
            </button>
          ))
        )}
      </div>

      {history.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={() => openDetail()}
            className="flex-1 rounded-lg py-1.5 text-[10px] font-semibold text-violet-600 transition hover:bg-violet-100 hover:text-violet-700"
          >
            📋 Detail
          </button>
          <button
            onClick={() => {
              setHistory([])
              setItems(INITIAL_ITEMS)
              localStorage.removeItem('inventory-items')
              localStorage.removeItem('inventory-history')
            }}
            className="flex-1 rounded-lg py-1.5 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )

  /* ─── Fullscreen mode (blank + popup dialog) ─── */
  if (isFullscreen) {
    return (
      <div
        ref={panelRef}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white cursor-pointer-all"
      >
        {/* Top bar — Open + Close */}
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <h1 className="text-lg font-semibold text-white">Inventory</h1>

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
                    bgColor === opt.color ? 'border-teal-400' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openDialog}
              className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-600 active:scale-95"
            >
              📦 Open Inventory
            </button>

            <button
              onClick={toggleFullscreen}
              className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              ✕ Close
            </button>
          </div>
        </header>

        {/* Blank area — greenscreen space */}
        <div className="flex-1" style={{ backgroundColor: bgColor }} />

        {/* Dialog popup (tanpa backdrop) */}
        {isDialogOpen && (
          <div
            ref={dialogRef}
            className="absolute inset-0 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              {/* Dialog header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎒</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">
                      Inventory
                    </p>
                    <h2 className="text-lg font-semibold text-white">Perlengkapan Hiking</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Kondisi</p>
                    <p className="text-lg font-bold text-white">{overallPct}%</p>
                  </div>

                  <button
                    onClick={() => handleUndo()}
                    disabled={history.length === 0}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      history.length === 0
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    }`}
                  >
                    ↩ Undo
                  </button>

                  <button
                    onClick={handleReset}
                    className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
                  >
                    Reset
                  </button>

                  <button
                    onClick={closeDialog}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Dialog body: Grid + History */}
              <div className="mt-5 flex gap-4">
                <main className="flex-1">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.filter(i => checkedIds.has(i.id)).map((item) => (
                      <InventoryCard
                        key={item.id}
                        item={item}
                        onUse={handleUse}
                        onClick={handleSlotClick}
                        dark
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-center text-xs text-slate-500">
                    Pilih -20%, -50%, atau -100% — item sekali pakai tinggal tekan Use
                  </p>
                </main>

                <aside className="w-52 shrink-0">
                  <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      History
                      {history.length > 0 && (
                        <span className="ml-1.5 text-amber-500">({history.length})</span>
                      )}
                    </p>

                    <div ref={historyListRef} className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-1">
                      {history.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-600">Belum ada aksi</p>
                      ) : (
                        history.map((entry, i) => (
                          <button
                            key={i}
                            onClick={() => handleUndo(i)}
                            className="group flex w-full items-center gap-2 rounded-xl border border-transparent bg-slate-700 px-3 py-2 text-left text-xs transition hover:border-amber-500/30 hover:bg-slate-700/80"
                          >
                            <span className="shrink-0 text-amber-500 opacity-0 transition group-hover:opacity-100">
                              ↩
                            </span>
                            <span className="flex-1 truncate text-slate-300">{entry.isReset ? '🔄 Reset semua' : entry.singleUse ? `${entry.icon} Use` : `${entry.icon} -${entry.amount}%`}</span>
                            <span className="shrink-0 text-[10px] text-slate-600">#{i + 1}</span>
                          </button>
                        ))
                      )}
                    </div>

                    {history.length > 1 && (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => openDetail()}
                          className="flex-1 rounded-lg py-1.5 text-[10px] font-semibold text-violet-400 transition hover:bg-slate-700 hover:text-violet-300"
                        >
                          📋 Detail
                        </button>
                        <button
                          onClick={() => {
                            setHistory([])
                            setItems(INITIAL_ITEMS)
                            localStorage.removeItem('inventory-items')
                            localStorage.removeItem('inventory-history')
                          }}
                          className="flex-1 rounded-lg py-1.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}

        {/* History Detail Modal */}
        {isDetailOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6" onClick={closeDetail}>
            <div
              className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">History Detail</p>
                  <h3 className="text-lg font-semibold text-white">{history.length} aksi tercatat</h3>
                </div>
                <button
                  onClick={closeDetail}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                {history.map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 transition hover:border-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">#{i + 1} — {entry.isReset ? 'Reset semua item' : entry.singleUse ? `${entry.itemName} Use` : `${entry.itemName} -${entry.amount}%`}</span>
                      <button
                        onClick={() => {
                          handleUndo(i)
                          closeDetail()
                        }}
                        className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/30"
                      >
                        ↩ Undo ke sini
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─── Embedded mode (dark, for gameplay overlay) ─── */
  if (embedded) {
    return (
      <div className="p-5 pr-14">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">
                Inventory
              </p>
              <h2 className="text-lg font-semibold text-white">Perlengkapan Hiking</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Kondisi total</p>
              <p className="text-lg font-bold text-white">{overallPct}%</p>
            </div>

            <button
              onClick={() => handleUndo()}
              disabled={history.length === 0}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
                history.length === 0
                  ? 'border-slate-700 bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'border-amber-500/30 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              }`}
            >
              ↩
            </button>
          </div>
        </div>

        {/* Body: Grid + History */}
        <div className="mt-5 flex gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.filter(i => checkedIds.has(i.id)).map((item) => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  onUse={handleUse}
                  onClick={handleSlotClick}
                  dark
                />
              ))}
            </div>
          </div>
          <div className="w-52 shrink-0">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                History
                {history.length > 0 && (
                  <span className="ml-1.5 text-amber-500">({history.length})</span>
                )}
              </p>

              <div ref={historyListRef} className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-600">Belum ada aksi</p>
                ) : (
                  history.map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => handleUndo(i)}
                      className="group flex w-full items-center gap-2 rounded-xl border border-transparent bg-slate-700/50 px-3 py-2 text-left text-xs transition hover:border-amber-500/30 hover:bg-slate-700/80"
                    >
                      <span className="shrink-0 text-amber-500 opacity-0 transition group-hover:opacity-100">↩</span>
                      <span className="flex-1 truncate text-slate-300">{entry.isReset ? '🔄 Reset semua' : entry.singleUse ? `${entry.icon} Use` : `${entry.icon} -${entry.amount}%`}</span>
                      <span className="shrink-0 text-[10px] text-slate-600">#{i + 1}</span>
                    </button>
                  ))
                )}
              </div>

              {history.length > 1 && (
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => openDetail()}
                    className="flex-1 rounded-lg py-1.5 text-[10px] font-semibold text-violet-400 transition hover:bg-slate-700 hover:text-violet-300"
                  >
                    📋 Detail
                  </button>
                  <button
                    onClick={() => {
                      setHistory([])
                      setItems(INITIAL_ITEMS)
                      localStorage.removeItem('inventory-items')
                      localStorage.removeItem('inventory-history')
                    }}
                    className="flex-1 rounded-lg py-1.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── Inline mode (inside admin page) ─── */
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-6">
      {/* Expand button */}
      <button
        onClick={toggleFullscreen}
        className="absolute -top-2 -right-2 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm shadow-md transition hover:bg-slate-50 hover:shadow-lg"
        title="Fullscreen"
      >
        ⛶
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎒</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-600">
              Inventory
            </p>
            <h2 className="text-lg font-semibold text-slate-900">Perlengkapan Hiking</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500">Kondisi total</p>
            <p className="text-lg font-bold text-slate-900">{overallPct}%</p>
          </div>

          <button
            onClick={() => handleUndo()}
            disabled={history.length === 0}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
              history.length === 0
                ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            ↩
          </button>
        </div>
      </div>

      {/* Body: List + History */}
      <div className="mt-5 flex gap-4">
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Sort:</span>
            <div className="flex gap-1">
              {([
                { key: 'default', label: 'Default' },
                { key: 'name-asc', label: 'A-Z' },
                { key: 'name-desc', label: 'Z-A' },
                { key: 'dur-asc', label: 'Dur ↑' },
                { key: 'dur-desc', label: 'Dur ↓' },
                { key: 'custom', label: 'Custom' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortMode(opt.key)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    sortMode === opt.key
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* List view */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {sortedItems.map((item) => {
              const isDepleted = item.durability <= 0
              const barColor =
                item.durability > 60 ? 'bg-emerald-400' : item.durability > 30 ? 'bg-amber-400' : 'bg-rose-400'
              return (
                <div
                  key={item.id}
                  draggable={sortMode === 'custom'}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id)
                    ;(e.currentTarget as HTMLElement).classList.add('opacity-50')
                  }}
                  onDragEnd={(e) => {
                    ;(e.currentTarget as HTMLElement).classList.remove('opacity-50')
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const dragId = e.dataTransfer.getData('text/plain')
                    if (dragId && dragId !== item.id) moveItem(dragId, item.id)
                  }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    isDepleted
                      ? 'border-slate-200 bg-slate-50 opacity-50'
                      : sortMode === 'custom'
                        ? 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm cursor-grab active:cursor-grabbing'
                        : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm'
                  }`}
                >
                  {/* Drag handle — only in custom mode */}
                  {sortMode === 'custom' && (
                    <span className="shrink-0 text-slate-300 cursor-grab active:cursor-grabbing select-none text-lg leading-none">
                      ⋮⋮
                    </span>
                  )}

                  {/* Checkbox */}
                  <label className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(item.id)}
                      onChange={() => toggleCheck(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                    />
                  </label>

                  {/* Icon + Name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`text-2xl shrink-0 ${isDepleted ? 'grayscale' : ''}`}>{item.icon}</span>
                    <span className="text-sm font-semibold text-slate-800 truncate">{item.label}</span>
                  </div>

                  {/* Durability bar */}
                  <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.durability}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-8 text-right">{item.durability}%</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5 shrink-0">
                    {item.useMode === 'single' ? (
                      <button
                        onClick={() => handleUse(item.id, 100)}
                        disabled={isDepleted}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isDepleted
                            ? 'cursor-not-allowed bg-slate-100 text-slate-300'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95'
                        }`}
                      >
                        Use
                      </button>
                    ) : (
                      <>
                        {[20, 50, 100].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => handleUse(item.id, amount)}
                            disabled={isDepleted}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                              isDepleted
                                ? 'cursor-not-allowed bg-slate-100 text-slate-300'
                                : amount === 100
                                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 active:scale-95'
                                  : amount === 50
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95'
                                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200 active:scale-95'
                            }`}
                          >
                            -{amount}%
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="w-56 shrink-0">
          {historyContent}
        </div>
      </div>

      {/* History Detail Modal */}
      {isDetailOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm p-6" onClick={closeDetail}>
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-600">History Detail</p>
                <h3 className="text-lg font-semibold text-slate-900">{history.length} aksi tercatat</h3>
              </div>
              <button
                onClick={closeDetail}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
              {history.map((entry, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-violet-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">#{i + 1} — {entry.isReset ? 'Reset semua item' : entry.singleUse ? `${entry.itemName} Use` : `${entry.itemName} -${entry.amount}%`}</span>
                    <button
                      onClick={() => {
                        handleUndo(i)
                        closeDetail()
                      }}
                      className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                    >
                      ↩ Undo ke sini
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Pilih -20%, -50%, atau -100% — item sekali pakai tinggal tekan Use
        </p>
        <button
          onClick={handleReset}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Reset Semua
        </button>
      </div>
    </div>
  )
}

/* ─── Single inventory card ─── */

type CardProps = {
  item: InventoryItem
  onUse: (id: string, amount: number) => void
  onClick: (item: InventoryItem, el: HTMLDivElement) => void
  dark?: boolean
  showCheckbox?: boolean
  checked?: boolean
  onToggleCheck?: (id: string) => void
}

function InventoryCard({ item, onUse, onClick, dark, showCheckbox, checked, onToggleCheck }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const isDepleted = item.durability <= 0

  const handleUse = useCallback(
    (amount: number) => {
      if (isDepleted) return

      if (cardRef.current) onClick(item, cardRef.current)

      if (barRef.current) {
        const nextPct = Math.max(0, item.durability - amount)
        animate(barRef.current, { width: `${nextPct}%` }, { duration: 0.3, easing: 'ease-out' })
      }

      onUse(item.id, amount)
    },
    [isDepleted, item, onClick, onUse],
  )

  const barColor =
    item.durability > 60
      ? 'bg-emerald-400'
      : item.durability > 30
        ? 'bg-amber-400'
        : 'bg-rose-400'

  if (dark) {
    return (
      <div
        ref={cardRef}
        className={`relative flex flex-col items-center gap-2 rounded-2xl border p-5 transition ${
          isDepleted
            ? 'border-slate-700 bg-slate-800/50 opacity-50 grayscale'
            : 'border-slate-700 bg-slate-800 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10'
        }`}
      >
        {/* Checkbox — admin selection for fullscreen visibility */}
        {showCheckbox && (
          <label className="absolute top-2 right-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleCheck?.(item.id)}
              className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
            />
          </label>
        )}
        <span className={`text-5xl ${isDepleted ? 'grayscale' : ''}`}>{item.icon}</span>
        <span className="text-sm font-semibold text-slate-200">{item.label}</span>

        <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
          <div ref={barRef} className={`h-full rounded-full ${barColor}`} style={{ width: `${item.durability}%` }} />
        </div>

        <span className="text-xs font-medium text-slate-400">{item.durability}%</span>

        <div className="mt-2 flex w-full gap-2">
          {item.useMode === 'single' ? (
            <button
              onClick={() => handleUse(100)}
              disabled={isDepleted}
              className={`w-full rounded-xl px-2 py-2 text-sm font-semibold transition ${
                isDepleted
                  ? 'cursor-not-allowed bg-slate-700 text-slate-600'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 active:scale-95'
              }`}
            >
              Use
            </button>
          ) : (
            <>
              {[20, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleUse(amount)}
                  disabled={isDepleted}
                  className={`flex-1 rounded-xl px-2 py-2 text-sm font-semibold transition ${
                    isDepleted
                      ? 'cursor-not-allowed bg-slate-700 text-slate-600'
                      : amount === 100
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 active:scale-95'
                        : amount === 50
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 active:scale-95'
                          : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 active:scale-95'
                  }`}
                >
                  -{amount}%
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  // Light mode (inline)
  return (
    <div
      ref={cardRef}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
        isDepleted
          ? 'border-slate-200 bg-slate-100 opacity-50 grayscale'
          : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-md'
      }`}
    >
      {/* Checkbox — admin selection for fullscreen visibility */}
      {showCheckbox && (
        <label className="absolute top-2 right-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggleCheck?.(item.id)}
            className="h-4 w-4 rounded border-slate-300 bg-white text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
          />
        </label>
      )}
      <span className={`text-4xl ${isDepleted ? 'grayscale' : ''}`}>{item.icon}</span>
      <span className="text-sm font-semibold text-slate-800">{item.label}</span>

      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div ref={barRef} className={`h-full rounded-full ${barColor}`} style={{ width: `${item.durability}%` }} />
      </div>

      <span className="text-xs font-medium text-slate-500">{item.durability}%</span>

      <div className="mt-2 flex w-full gap-2">
        {item.useMode === 'single' ? (
          <button
            onClick={() => handleUse(100)}
            disabled={isDepleted}
            className={`w-full rounded-xl px-2 py-2 text-sm font-semibold transition ${
              isDepleted
                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
            }`}
          >
            Use
          </button>
        ) : (
          <>
            {[20, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => handleUse(amount)}
                disabled={isDepleted}
                className={`flex-1 rounded-xl px-2 py-2 text-sm font-semibold transition ${
                  isDepleted
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                    : amount === 100
                      ? 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95'
                      : amount === 50
                        ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                        : 'bg-violet-500 text-white hover:bg-violet-600 active:scale-95'
                }`}
              >
                -{amount}%
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
