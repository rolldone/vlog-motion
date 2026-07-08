import { useState, useCallback, useRef, useEffect } from 'react'

type VideoSelectorProps = {
  onSelect: (file: File | null) => void
  initialFile?: File | null
  /** Fallback info kalau File object gak ada (habis reload) */
  fallbackName?: string | null
  fallbackSize?: string | null
  fallbackUrl?: string | null
  /** Toggle: tampilkan video di fullscreen */
  videoVisible?: boolean
  onToggleVideoVisible?: (v: boolean) => void
  /** Warna latar chroma key untuk greenscreen */
  chromaBgColor?: string | null
  onChromaBgColorChange?: (c: string | null) => void
}

// ─── Chroma key colors — standar yang disetujui CapCut ───
const CHROMA_COLORS = [
  { name: 'Green', hex: '#00ff00', desc: 'Chroma Green' },
  { name: 'Blue', hex: '#0000ff', desc: 'Chroma Blue' },
  { name: 'Red', hex: '#ff0000', desc: 'Chroma Red' },
  { name: 'Yellow', hex: '#ffff00', desc: 'Chroma Yellow' },
  { name: 'Magenta', hex: '#ff00ff', desc: 'Chroma Magenta' },
]

export function VideoSelector({ onSelect, initialFile, fallbackName, fallbackSize, fallbackUrl, videoVisible = true, onToggleVideoVisible, chromaBgColor, onChromaBgColorChange }: VideoSelectorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    if (initialFile) return URL.createObjectURL(initialFile)
    if (fallbackUrl) return fallbackUrl
    return null
  })
  const [fileName, setFileName] = useState<string | null>(() => initialFile?.name ?? fallbackName ?? null)
  const [fileSize, setFileSize] = useState<string | null>(() => {
    if (initialFile) return (initialFile.size / (1024 * 1024)).toFixed(2) + ' MB'
    return fallbackSize ?? null
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cleanup blob URL on unmount (jangan revoke file:// URL)
  useEffect(() => () => { if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Revoke previous object URL
      if (previewUrl) URL.revokeObjectURL(previewUrl)

      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setFileName(file.name)
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB')
      onSelect(file)
    },
    [onSelect, previewUrl],
  )

  const handleClear = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setFileName(null)
    setFileSize(null)
    if (inputRef.current) inputRef.current.value = ''
    onSelect(null)
  }, [onSelect, previewUrl])

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">📹 Video Source</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        Select Video.
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Pilih file .mp4 dari komputer kamu.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFile}
          className="hidden"
          id="video-file-input"
        />
        <label
          htmlFor="video-file-input"
          className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <span>📁</span>
          Browse .mp4
        </label>

        {fileName && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* File info */}
      {fileName && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm">
          <span className="text-green-600">✅</span>
          <span className="font-medium text-green-800">{fileName}</span>
          <span className="text-green-600/60">—</span>
          <span className="text-green-700">{fileSize}</span>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-black">
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            className="max-h-[300px] w-full object-contain"
            onLoadedMetadata={() => {
              // Auto-pause after metadata loaded
              videoRef.current?.pause()
            }}
          />
        </div>
      )}

      {!fileName && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-100 p-8 text-center">
          <p className="text-sm text-slate-400">Belum ada video terpilih</p>
        </div>
      )}

      {/* ─── Video visibility toggle ─── */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Tampilkan video di fullscreen</p>
          <p className="text-xs text-slate-500">Matikan untuk mode greenscreen / latar kontras</p>
        </div>
        <button
          onClick={() => onToggleVideoVisible?.(!videoVisible)}
          className={`relative h-7 w-12 rounded-full transition ${videoVisible ? 'bg-orange-500' : 'bg-slate-300'}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${videoVisible ? 'left-6' : 'left-1'}`}
          />
        </button>
      </div>

      {/* ─── Chroma key background colors ─── */}
      {!videoVisible && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latar Kontras (Chroma Key)</p>
          <p className="mt-1 text-xs text-slate-400">Pilih warna latar untuk greenscreen — kompatibel CapCut</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* None / Black */}
            <button
              onClick={() => onChromaBgColorChange?.(null)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${!chromaBgColor ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="h-8 w-8 rounded-lg border border-slate-300 bg-black" />
              <span className="text-[10px] font-medium text-slate-600">Black</span>
            </button>
            {CHROMA_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => onChromaBgColorChange?.(c.hex)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${chromaBgColor === c.hex ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="h-8 w-8 rounded-lg" style={{ backgroundColor: c.hex }} />
                <span className="text-[10px] font-medium text-slate-600">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
