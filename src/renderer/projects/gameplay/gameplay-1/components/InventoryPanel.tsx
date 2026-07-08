export function InventoryPanel() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold text-orange-400">🎒 Inventory</h2>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl transition hover:bg-white/10"
          >
            {['🗡️', '🛡️', '🧪', '🗺️', '🔑', '💎', '🍎', '🔦'][i]}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/40">Klik item untuk melihat detail.</p>
    </div>
  )
}
