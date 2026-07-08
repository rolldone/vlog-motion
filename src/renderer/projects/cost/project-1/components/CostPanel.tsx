import { useState, useRef, useEffect, useCallback } from 'react'
import { animate } from '@motionone/dom'
import { useSounds } from '../hooks/useSounds'

const formatRp = (n: number) =>
  'Rp ' + n.toLocaleString('id-ID')

type DamagePopup = {
  id: string
  amount: number
  label: string
}

export function CostPanel({ embedded }: { embedded?: boolean }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [labelValue, setLabelValue] = useState('')
  const [popups, setPopups] = useState<DamagePopup[]>([])
  const [history, setHistory] = useState<DamagePopup[]>((): DamagePopup[] => {
    try {
      const saved = localStorage.getItem('cost-history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bgColor, setBgColor] = useState(() => {
    try {
      return localStorage.getItem('cost-bg-color') || '#0f172a'
    } catch { return '#0f172a' }
  })
  const [totalCost, setTotalCost] = useState<number>((): number => {
    try {
      const saved = localStorage.getItem('cost-total')
      return saved ? JSON.parse(saved) : 0
    } catch { return 0 }
  })

  const panelRef = useRef<HTMLDivElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const { playDamage, playOpen, playClose } = useSounds()

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cost-history', JSON.stringify(history))
  }, [history])
  useEffect(() => {
    localStorage.setItem('cost-total', JSON.stringify(totalCost))
  }, [totalCost])
  useEffect(() => {
    localStorage.setItem('cost-bg-color', bgColor)
  }, [bgColor])

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

  // ─── Trigger damage number ───
  const handleHit = useCallback(() => {
    const amount = parseInt(inputValue, 10)
    if (!amount || amount <= 0) return

    const id = crypto.randomUUID()
    const entry = { id, amount, label: labelValue.trim() || 'Pengeluaran' }
    setPopups((prev) => [...prev, entry])
    setHistory((prev) => [...prev, entry])
    setTotalCost((prev) => prev + amount)
    setInputValue('')
    setLabelValue('')

    // Screen shake
    if (shakeRef.current) {
      animate(
        shakeRef.current,
        { x: [0, -8, 8, -5, 5, 0] },
        { duration: 0.4, easing: 'ease-out' }
      )
    }

    playDamage()

    // Remove popup after animation
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id))
    }, 2000)
  }, [inputValue, labelValue, playDamage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleHit()
    },
    [handleHit],
  )

  // ─── Open modal with sound ───
  const openModal = useCallback(() => {
    setIsModalOpen(true)
    playOpen()
    requestAnimationFrame(() => {
      if (modalRef.current) {
        animate(
          modalRef.current,
          { opacity: [0, 1], transform: ['translateY(30px) scale(0.97)', 'translateY(0) scale(1)'] },
          { duration: 0.3, easing: 'ease-out' },
        )
      }
    })
  }, [playOpen])

  const closeModal = useCallback(() => {
    if (modalRef.current) {
      playClose()
      animate(
        modalRef.current,
        { opacity: [1, 0], transform: ['translateY(0) scale(1)', 'translateY(20px) scale(0.97)'] },
        { duration: 0.15, easing: 'ease-in' },
      ).finished.then(() => {
        setIsModalOpen(false)
      })
    } else {
      setIsModalOpen(false)
    }
  }, [playClose])

  // ─── Delete a cost entry ───
  const handleDelete = useCallback((id: string) => {
    setHistory((prev) => {
      const entry = prev.find((e) => e.id === id)
      if (entry) {
        setTotalCost((t) => Math.max(0, t - entry.amount))
      }
      return prev.filter((e) => e.id !== id)
    })
  }, [])

  // ─── Fullscreen mode ─── */
  if (isFullscreen) {
    return (
      <div
        ref={panelRef}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white cursor-pointer-all"
      >
        <div ref={shakeRef} className="flex flex-col flex-1 min-h-0">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <h1 className="text-lg font-semibold text-white">Cost Tracker</h1>

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
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Total Keluar
                </p>
                <p className="text-xl font-bold text-yellow-400 tabular-nums">
                  {formatRp(totalCost)}
                </p>
              </div>

              <input
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                placeholder="Label (misal: Beli Karcis)"
                className="w-48 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <input
                ref={inputRef}
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nominal..."
                className="w-40 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={handleHit}
                className="rounded-xl bg-yellow-500 px-6 py-2 text-sm font-bold text-slate-900 uppercase tracking-wider transition hover:bg-yellow-400 active:scale-95"
              >
                ⚔️ HIT
              </button>

              {history.length > 0 && (
                <button
                  onClick={openModal}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 active:scale-95"
                >
                  📋 Cost List
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                ✕ Close
              </button>
            </div>
          </header>

          {/* Center area: content with custom bg */}
          <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
            {popups.map((popup) => (
              <DamageNumber key={popup.id} amount={popup.amount} label={popup.label} />
            ))}
          </div>
        </div>

        {/* Modal: Cost List (fullscreen) */}
        {isModalOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
            <div
              ref={modalRef}
              className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">Cost List</p>
                  <h3 className="text-lg font-semibold text-white">{history.length} transaksi</h3>
                </div>
                <button
                  onClick={closeModal}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1">
                {history.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800/60 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        -{formatRp(entry.amount)}
                      </span>
                      <span className="text-xs text-yellow-400 font-medium">{entry.label}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="ml-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/20 hover:text-red-400"
                      title="Hapus"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3">
                <span className="text-sm font-semibold text-yellow-400">Total Pengeluaran</span>
                <span className="text-lg font-bold text-yellow-400 tabular-nums">{formatRp(totalCost)}</span>
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
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
                Cost Tracker
              </p>
              <h2 className="text-lg font-semibold text-white">Pengeluaran</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Total keluar</p>
              <p className="text-lg font-bold text-yellow-400 tabular-nums">{formatRp(totalCost)}</p>
            </div>
          </div>
        </div>

        {/* Input + Hit area */}
        <div ref={shakeRef} className="mt-5 relative">
          <div className="flex gap-3">
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              placeholder="Label (misal: Beli Karcis)"
              className="w-48 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nominal..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
            <button
              onClick={handleHit}
              className="rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-slate-900 uppercase tracking-wider transition hover:bg-yellow-400 active:scale-95 shadow-md"
            >
              ⚔️ HIT
            </button>
          </div>

          {/* Damage popup */}
          <div className="relative h-32 mt-3 overflow-hidden">
            {popups.map((popup) => (
              <DamageNumber key={popup.id} amount={popup.amount} label={popup.label} />
            ))}
            {popups.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-slate-500">Tekan HIT untuk catat pengeluaran</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Masukkan nominal lalu tekan HIT atau Enter
          </p>
          {totalCost > 0 && (
            <div className="flex gap-2">
              <button
                onClick={openModal}
                className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-600 active:scale-95"
              >
                📋 Cost List
              </button>
              <button
                onClick={() => {
                  setTotalCost(0)
                  setPopups([])
                  setHistory([])
                  setLabelValue('')
                  setInputValue('')
                  localStorage.removeItem('cost-history')
                  localStorage.removeItem('cost-total')
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-700"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeModal}>
            <div
              ref={modalRef}
              className="w-full max-w-lg rounded-3xl border border-slate-700 bg-zinc-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">Cost List</p>
                  <h3 className="text-lg font-semibold text-white">{history.length} transaksi</h3>
                </div>
                <button
                  onClick={closeModal}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Belum ada pengeluaran</p>
                ) : (
                  history.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800/80 p-4 transition hover:border-slate-600"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">#{i + 1}</span>
                        <span className="text-sm font-medium text-slate-200">{entry.label}</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-400 tabular-nums">{formatRp(entry.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─── Inline mode ─── */
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
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
              Cost Tracker
            </p>
            <h2 className="text-lg font-semibold text-slate-900">Pengeluaran</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500">Total keluar</p>
            <p className="text-lg font-bold text-yellow-600 tabular-nums">{formatRp(totalCost)}</p>
          </div>
        </div>
      </div>

      {/* Input + Hit area */}
      <div ref={shakeRef} className="mt-5 relative">
        <div className="flex gap-3">
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            placeholder="Label (misal: Beli Karcis)"
            className="w-48 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nominal..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
          <button
            onClick={handleHit}
            className="rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-slate-900 uppercase tracking-wider transition hover:bg-yellow-400 active:scale-95 shadow-md"
          >
            ⚔️ HIT
          </button>
        </div>

        {/* Damage popup (inline) */}
        <div className="relative h-32 mt-3 overflow-hidden">
          {popups.map((popup) => (
            <DamageNumber key={popup.id} amount={popup.amount} label={popup.label} />
          ))}
          {popups.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-slate-400">Tekan HIT untuk catat pengeluaran</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Masukkan nominal lalu tekan HIT atau Enter
        </p>
        {totalCost > 0 && (
          <div className="flex gap-2">
            <button
              onClick={openModal}
              className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-600 active:scale-95"
            >
              📋 Cost List
            </button>
            <button
              onClick={() => {
                setTotalCost(0)
                setPopups([])
                setHistory([])
                setLabelValue('')
                setInputValue('')
                localStorage.removeItem('cost-history')
                localStorage.removeItem('cost-total')
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Modal: Cost List */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl p-6">
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Cost List</p>
                <h3 className="text-lg font-semibold text-slate-900">{history.length} transaksi</h3>
              </div>
              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1">
              {history.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      -{formatRp(entry.amount)}
                    </span>
                    <span className="text-xs text-yellow-600 font-medium">{entry.label}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="ml-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-500"
                    title="Hapus"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3">
              <span className="text-sm font-semibold text-yellow-700">Total Pengeluaran</span>
              <span className="text-lg font-bold text-yellow-600 tabular-nums">{formatRp(totalCost)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Floating damage number (Dota-style) ─── */

function DamageNumber({ amount, label }: { amount: number; label: string }) {
  const handleRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return

    animate(
      el,
      {
        scale: [0.3, 1.4, 1.0],
        y: [0, -20, -80],
        opacity: [0, 1, 1, 0],
      },
      {
        duration: 1.8,
        easing: [0.22, 1, 0.36, 1],
      },
    )
  }, [])

  return (
    <div
      ref={handleRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div
        className="flex flex-col items-center gap-1"
        style={{
          textShadow: `
            0 0 20px rgba(234, 179, 8, 0.9),
            0 0 40px rgba(234, 179, 8, 0.6),
            0 0 60px rgba(234, 179, 8, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.8)
          `,
        }}
      >
        <span className="text-5xl sm:text-7xl font-black text-yellow-400 tabular-nums tracking-tight">
          -{formatRp(amount)}
        </span>
        <span className="text-xs sm:text-sm font-semibold text-yellow-300/80 uppercase tracking-[0.4em]">
          {label}
        </span>
      </div>
    </div>
  )
}
