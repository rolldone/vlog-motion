type MenuItem = {
  id: string
  icon: string
  label: string
}

type GameHUDProps = {
  items: MenuItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onCropScreenshot?: () => void
  showControls?: boolean
  onToggleControls?: () => void
}

export function GameHUD({ items, activeId, onSelect, onCropScreenshot, showControls, onToggleControls }: GameHUDProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/60 px-3 py-4 backdrop-blur-md">
      {/* Controls toggle — show/hide native video nav */}
      <button
        onClick={onToggleControls}
        title={showControls ? 'Hide video controls' : 'Show video controls'}
        className={`flex items-center justify-center rounded-xl p-3 text-lg transition ${
          showControls
            ? 'bg-white/15 text-white'
            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
        }`}
      >
        <span>🎬</span>
      </button>

      {/* Divider */}
      <div className="my-1 h-px w-6 bg-white/15" />

      {items.map((item) => (
        <button
          key={item.id}
          data-recorder-handled
          onClick={() => onSelect(item.id)}
          title={item.label}
          className={`flex items-center justify-center rounded-xl p-3 text-xl transition ${
            activeId === item.id
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          <span>{item.icon}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="my-1 h-px w-6 bg-white/15" />

      {/* Screenshot crop button */}
      <button
        onClick={onCropScreenshot}
        className="flex items-center justify-center rounded-xl bg-white/5 p-3 text-xl text-white/60 transition hover:bg-white/15 hover:text-white"
        title="Screenshot crop (✂️)"
      >
        <span>✂️</span>
      </button>
    </div>
  )
}
