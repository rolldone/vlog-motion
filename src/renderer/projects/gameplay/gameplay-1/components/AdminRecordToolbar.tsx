// ─── Admin record toolbar — record, replay, cursor toggle ───
// Ditampilkan di admin mode dashboard

interface AdminRecordToolbarProps {
  isRecording: boolean
  recordCursor: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onReplayClick: () => void
  isReplayDisabled: boolean
  onRecordCursorChange: (checked: boolean) => void
}

export function AdminRecordToolbar({
  isRecording,
  recordCursor,
  onStartRecording,
  onStopRecording,
  onReplayClick,
  isReplayDisabled,
  onRecordCursorChange,
}: AdminRecordToolbarProps) {
  return (
    <div data-recorder-ui className="flex items-center rounded-xl border border-slate-200 bg-white px-2 py-1.5">
      {/* Group: Recording */}
      <div className="flex items-center gap-1">
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Record
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-100 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-200"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Stop
          </button>
        )}
        <button
          onClick={onReplayClick}
          disabled={isReplayDisabled}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-40"
        >
          ▶ Replay
        </button>
      </div>

      {/* Divider */}
      <div className="mx-2 h-5 w-px bg-slate-200" />

      {/* Group: Settings */}
      <div className="flex items-center gap-1">
        <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={recordCursor}
            onChange={(e) => onRecordCursorChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded text-orange-500 focus:ring-orange-400"
          />
          Cursor
        </label>
      </div>
    </div>
  )
}
