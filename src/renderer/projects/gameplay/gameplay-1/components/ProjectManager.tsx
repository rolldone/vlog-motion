import { useState, useCallback, useEffect, useRef } from 'react'
import { getRecentFiles, addRecentFile, removeRecentFile, clearRecentFiles } from '../utils/projectManager'
import type { RecentFile } from '../types'

type ProjectManagerProps = {
  /** Nama project saat ini */
  projectName: string
  /** Callback saat user rename project */
  onRenameProject: (name: string) => void
  /** Path file saat ini (null = belum pernah di-save) */
  currentFilePath: string | null
  /** Callback saat path berubah (save as / open) */
  onFilePathChange: (path: string | null) => void
  /** Kumpulkan state → string JSON, lalu komponen handle save ke disk */
  onCollectState: () => string
  /**
   * Dipanggil setelah load sukses — parent restore localStorage lalu refresh komponen.
   * Return value: { videoPath, videoTime, isPlaying } untuk direstore ke parent state.
   */
  onRestore: (json: string) => { videoPath: string | null; videoTime: number; isPlaying: boolean }
  /** Indikator apakah ada perubahan sejak save terakhir */
  isModified: boolean
  /** Reset modified flag setelah save */
  onClearModified: () => void
  /** Callback setelah load sukses — parent bisa trigger reload komponen anak */
  onLoadSuccess: (videoPath: string | null, videoTime: number, isPlaying: boolean) => void
  /** Render mode: "default" = full (name + buttons), "buttons-only" = just action buttons */
  mode?: 'default' | 'buttons-only'
}

export function ProjectManager({
  projectName,
  mode = 'default',
  onRenameProject,
  currentFilePath,
  onFilePathChange,
  onCollectState,
  onRestore,
  isModified,
  onClearModified,
  onLoadSuccess,
}: ProjectManagerProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(getRecentFiles)
  const [showRecent, setShowRecent] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(projectName)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const recentRef = useRef<HTMLDivElement>(null)

  // Sync name draft dari luar
  useEffect(() => {
    setNameDraft(projectName)
  }, [projectName])

  // Close recent dropdown on outside click
  useEffect(() => {
    if (!showRecent) return
    const handler = (e: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setShowRecent(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showRecent])

  const refreshRecent = useCallback(() => {
    setRecentFiles(getRecentFiles())
  }, [])

  // ─── Save ───
  const doSave = useCallback(async (path?: string) => {
    setSaveStatus('saving')
    try {
      const filePath = path ?? currentFilePath
      if (!filePath) {
        // No path → do Save As instead
        setSaveStatus('idle')
        await doSaveAs()
        return
      }
      const content = onCollectState()
      await window.project.saveFile(filePath, content)
      localStorage.setItem('project-name', projectName)
      localStorage.setItem('project-path', filePath)
      addRecentFile(projectName, filePath)
      onFilePathChange(filePath)
      onClearModified()
      refreshRecent()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }, [currentFilePath, onCollectState, onFilePathChange, onClearModified, refreshRecent, projectName])

  // ─── Save As ───
  const doSaveAs = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const filePath = await window.project.saveDialog(
        projectName.endsWith('.donis') ? projectName : `${projectName}.donis`,
      )
      if (!filePath) {
        setSaveStatus('idle')
        return
      }
      const content = onCollectState()
      await window.project.saveFile(filePath, content)
      localStorage.setItem('project-name', projectName)
      localStorage.setItem('project-path', filePath)
      addRecentFile(projectName, filePath)
      onFilePathChange(filePath)
      onClearModified()
      refreshRecent()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }, [projectName, onCollectState, onFilePathChange, onClearModified, refreshRecent])

  // ─── Open ───
  const doOpen = useCallback(async (filePath?: string) => {
    try {
      const path = filePath ?? (await window.project.openDialog())
      if (!path) return
      const raw = await window.project.loadFile(path)
      if (!raw) return

      // Parse JSON
      const { videoPath, videoTime, isPlaying } = onRestore(raw)

      // Extract project name from file
      let loadedName = projectName
      try {
        const data = JSON.parse(raw)
        if (data.name) {
          loadedName = data.name
          localStorage.setItem('project-name', data.name)
          onRenameProject(data.name)
        }
      } catch { /* ignore */ }

      // Save path to localStorage so it survives reload
      localStorage.setItem('project-path', path)
      onFilePathChange(path)

      addRecentFile(loadedName, path)
      onFilePathChange(path)
      onClearModified()
      refreshRecent()
      onLoadSuccess(videoPath, videoTime, isPlaying)
    } catch {
      // silent
    }
  }, [onRestore, onRenameProject, onFilePathChange, onClearModified, refreshRecent, onLoadSuccess, projectName])

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 's') {
        e.preventDefault()
        doSave()
      } else if (e.key === 'o') {
        e.preventDefault()
        doOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doSave, doOpen])

  const handleNameSubmit = useCallback(() => {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== projectName) {
      onRenameProject(trimmed)
    }
    setIsEditingName(false)
  }, [nameDraft, projectName, onRenameProject])

  const fileName = currentFilePath
    ? currentFilePath.split(/[/\\]/).pop() || 'Untitled.donis'
    : 'Unsaved project'

  const isButtonsOnly = mode === 'buttons-only'

  return (
    <div className="flex items-center gap-3">
      {/* Project name — hidden in buttons-only mode */}
      {!isButtonsOnly && (
        isEditingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit()
              if (e.key === 'Escape') { setNameDraft(projectName); setIsEditingName(false) }
            }}
            className="rounded-lg border border-sky-300 bg-white px-2 py-1 text-sm font-semibold text-slate-800 outline-none ring-2 ring-sky-200"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="max-w-[180px] truncate rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            title="Click to rename project"
          >
            {projectName}
            {isModified && <span className="ml-0.5 text-orange-500">*</span>}
          </button>
        )
      )}

      {/* Save status indicator — hidden in buttons-only mode */}
      {!isButtonsOnly && (
        <span className="text-[11px] text-slate-400 select-none min-w-[50px]">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'error' && '⚠ Failed'}
          {saveStatus === 'idle' && fileName}
        </span>
      )}

      <div className="flex items-center gap-1">
        {/* Save */}
        <button
          onClick={() => doSave()}
          disabled={!isModified}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            isModified
              ? 'bg-sky-500 text-white hover:bg-sky-600 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          title="Save (Ctrl+S)"
        >
          💾 Save
        </button>

        {/* Save As */}
        <button
          onClick={doSaveAs}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-95"
          title="Save As..."
        >
          Save As
        </button>

        {/* Open */}
        <button
          onClick={() => doOpen()}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-95"
          title="Open (Ctrl+O)"
        >
          📂 Open
        </button>

        {/* Recent files dropdown */}
        <div className="relative" ref={recentRef}>
          <button
            onClick={() => setShowRecent((v) => !v)}
            disabled={recentFiles.length === 0}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              recentFiles.length === 0
                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95'
            }`}
            title="Recent files"
          >
            🕐
          </button>

          {showRecent && recentFiles.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Recent</p>
                <button
                  onClick={() => { clearRecentFiles(); refreshRecent(); setShowRecent(false) }}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {recentFiles.map((f) => (
                  <div
                    key={f.path}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 group"
                  >
                    <button
                      onClick={() => { doOpen(f.path); setShowRecent(false) }}
                      className="flex-1 text-left truncate text-xs text-slate-700"
                      title={f.path}
                    >
                      <span className="font-semibold">{f.name}</span>
                      <span className="ml-2 text-[10px] text-slate-400">{f.path}</span>
                    </button>
                    <button
                      onClick={() => { removeRecentFile(f.path); refreshRecent() }}
                      className="shrink-0 hidden group-hover:block text-[10px] text-slate-300 hover:text-red-400"
                      title="Remove from recent"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
