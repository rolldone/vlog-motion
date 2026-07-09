type RecordingHUDProps = {
  gifRecording: boolean
  webmRecording: boolean
  onToggleGif: () => void
  onToggleWebm: () => void
  /** Jumlah frame / detik yang sudah direkam (opsional) */
  gifFrames?: number
  webmSeconds?: number
}

export function RecordingHUD({ gifRecording, webmRecording, onToggleGif, onToggleWebm, gifFrames, webmSeconds }: RecordingHUDProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/60 px-3 py-4 backdrop-blur-md">
      {/* Header */}
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Record</span>
      <div className="h-px w-6 bg-white/15" />

      {/* GIF button */}
      <button
        onClick={onToggleGif}
        title={gifRecording ? 'Stop GIF recording' : 'Start GIF recording'}
        className={`flex flex-col items-center justify-center rounded-xl p-3 text-lg transition ${
          gifRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
      >
        <span className="text-xl">🎞️</span>
        {gifFrames !== undefined && gifRecording && (
          <span className="mt-0.5 text-[8px] font-mono text-white/70">{gifFrames}f</span>
        )}
      </button>
      {gifRecording && (
        <span className="text-[8px] font-medium text-red-400">GIF</span>
      )}

      {/* WebM button */}
      <button
        onClick={onToggleWebm}
        title={webmRecording ? 'Stop WebM recording' : 'Start WebM recording'}
        className={`flex flex-col items-center justify-center rounded-xl p-3 text-lg transition ${
          webmRecording
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse'
            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
      >
        <span className="text-xl">🎥</span>
        {webmSeconds !== undefined && webmRecording && (
          <span className="mt-0.5 text-[8px] font-mono text-white/70">{webmSeconds}s</span>
        )}
      </button>
      {webmRecording && (
        <span className="text-[8px] font-medium text-blue-400">WEBM</span>
      )}
    </div>
  )
}