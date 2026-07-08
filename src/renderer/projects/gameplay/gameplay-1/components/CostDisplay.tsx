import { useState, useEffect } from 'react'

type DamagePopup = {
  id: string
  amount: number
  label: string
}

const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

export function CostDisplay({ embedded }: { embedded?: boolean }) {
  const [totalCost, setTotalCost] = useState<number>(0)
  const [history, setHistory] = useState<DamagePopup[]>([])

  // Read from localStorage — always fresh on mount, and poll for changes
  const refresh = () => {
    try {
      const savedTotal = localStorage.getItem('cost-total')
      if (savedTotal) setTotalCost(JSON.parse(savedTotal))
      const savedHistory = localStorage.getItem('cost-history')
      if (savedHistory) setHistory(JSON.parse(savedHistory))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    refresh()
    // Listen to storage changes from other components (admin dashboard)
    window.addEventListener('storage', refresh)
    // Also poll every 2s in case admin is on same window
    const interval = setInterval(refresh, 2000)
    return () => {
      window.removeEventListener('storage', refresh)
      clearInterval(interval)
    }
  }, [])

  if (embedded) {
    return (
      <div className="p-5 pr-14">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400">
                Pengeluaran
              </p>
              <h2 className="text-lg font-semibold text-white">Cost Tracker</h2>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Total keluar</p>
            <p className="text-lg font-bold text-yellow-400 tabular-nums">
              {formatRp(totalCost)}
            </p>
          </div>
        </div>

        {/* History list */}
        {history.length > 0 ? (
          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
            {history.slice().reverse().map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/80 text-xs font-bold text-slate-300">
                    {history.length - i}
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    -{formatRp(entry.amount)}
                  </span>
                  <span className="text-xs text-slate-400">{entry.label}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Belum ada pengeluaran.</p>
        )}
      </div>
    )
  }

  // Fullscreen overlay mode — not used yet, placeholder
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-4 backdrop-blur-md">
      {/* Total */}
      <div className="flex items-center gap-3">
        <span className="text-xl">💰</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Total Pengeluaran
          </p>
          <p className="text-lg font-bold text-yellow-400 tabular-nums">
            {formatRp(totalCost)}
          </p>
        </div>
      </div>

      {/* History compact */}
      {history.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {history.slice(-5).reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-1.5 text-xs"
            >
              <span className="text-slate-300">{entry.label}</span>
              <span className="font-mono font-semibold text-yellow-400">
                -{formatRp(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
