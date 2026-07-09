// ─── Exit confirm modal — muncul saat user tekan Esc di fullscreen ───

interface ExitConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export function ExitConfirmModal({ onConfirm, onCancel }: ExitConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center shadow-2xl animate-fade-in">
        <p className="text-3xl">🚪</p>
        <h2 className="mt-3 text-lg font-semibold text-white">Keluar dari mode fullscreen?</h2>
        <p className="mt-1 text-sm text-white/50">Kamu akan kembali ke dashboard admin.</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Tetap di sini
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 active:scale-95"
          >
            Ya, keluar
          </button>
        </div>
      </div>
    </div>
  )
}
