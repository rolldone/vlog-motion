// ─── Video control bar — seek bar, play/pause, time display, volume ───
// Tampil di bagian bawah video player saat fullscreen

const formatTime = (t: number) => {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface VideoControlBarProps {
  videoTime: number
  videoDuration: number
  isPlaying: boolean
  volume: number
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTogglePlay: () => void
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onToggleMute: () => void
}

export function VideoControlBar({
  videoTime,
  videoDuration,
  isPlaying,
  volume,
  onSeek,
  onTogglePlay,
  onVolumeChange,
  onToggleMute,
}: VideoControlBarProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-4 pt-12"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={videoDuration || 0}
        step={0.1}
        value={videoTime}
        onChange={onSeek}
        onMouseDown={(e) => e.stopPropagation()}
        className="mb-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-orange-400 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePlay() }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20"
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>

          {/* Time */}
          <span className="font-mono text-sm text-white/80">
            {formatTime(videoTime)} / {formatTime(videoDuration)}
          </span>

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleMute() }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm transition hover:bg-white/20"
            >
              {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={onVolumeChange}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-orange-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
