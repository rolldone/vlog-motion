type MenuItem = {
  id: string
  icon: string
  label: string
}

type GameHUDProps = {
  items: MenuItem[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function GameHUD({ items, activeId, onSelect }: GameHUDProps) {
  return (
    <div className="flex items-center justify-center gap-3 bg-black/80 px-4 py-3 backdrop-blur-sm">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            activeId === item.id
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
