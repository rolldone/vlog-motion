type EditorToolbarProps = {
  isEditorEnabled: boolean
  isDataPanelOpen: boolean
  isPanMode: boolean
  isFullscreen: boolean
  zoom: number
  onToggleEditor: () => void
  onToggleDataPanel: () => void
  onOpenActorPicker: () => void
  onTogglePanMode: () => void
  onToggleFullscreen: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onSaveJson?: () => void
  onLoadJson?: () => void
}

export function EditorToolbar({
  isEditorEnabled,
  isDataPanelOpen,
  isPanMode,
  isFullscreen,
  zoom,
  onToggleEditor,
  onToggleDataPanel,
  onOpenActorPicker,
  onTogglePanMode,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  onReset,
  onSaveJson,
}: EditorToolbarProps) {
  return (
    <div id="editor-toolbar" className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
      {/* left: branding + mode pill */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">
          Map Editor
        </span>
        <span className="h-4 w-px bg-slate-200" />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isEditorEnabled
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isEditorEnabled ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {isEditorEnabled ? 'Edit' : 'Play'}
        </span>
      </div>

      {/* right: action buttons */}
      <div className="flex items-center gap-1.5">
        {/* toggle data panel — visible in both modes */}
        <button
          type="button"
          onClick={onToggleDataPanel}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            isDataPanelOpen
              ? 'bg-sky-100 text-sky-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          Data
        </button>
        {/* actor picker — only in edit mode */}
        {isEditorEnabled ? (
          <>
            <button
              type="button"
              onClick={onOpenActorPicker}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              🎭 Actor
            </button>
            <span className="h-4 w-px bg-slate-200" />
          </>
        ) : null}

        {/* hand/pan tool */}
        <button
          type="button"
          onClick={onTogglePanMode}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            isPanMode
              ? 'bg-violet-100 text-violet-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          ✋ Pan
        </button>

        {/* zoom controls */}
        <span className="h-4 w-px bg-slate-200" />
        <button
          type="button"
          onClick={onZoomOut}
          className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          −
        </button>
        <span className="min-w-[2.5rem] text-center text-[11px] font-semibold tabular-nums text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          +
        </button>

        <span className="h-4 w-px bg-slate-200" />

        {/* toggle editor mode */}
        <button
          type="button"
          onClick={onToggleEditor}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            isEditorEnabled
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {isEditorEnabled ? 'Exit edit' : 'Edit'}
        </button>

        {/* reset */}
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          Reset
        </button>

        {/* map data */}
        {onSaveJson ? (
          <button
            type="button"
            onClick={onSaveJson}
            className="rounded-lg bg-sky-500 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-600"
          >
            💾 Map Data
          </button>
        ) : null}

        <span className="h-4 w-px bg-slate-200" />

        {/* fullscreen toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            isFullscreen
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          {isFullscreen ? '← Back' : '⛶ Full'}
        </button>
      </div>
    </div>
  )
}
