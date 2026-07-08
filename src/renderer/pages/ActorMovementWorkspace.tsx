type ActorMovementWorkspaceProps = {
  onBack: () => void
}

const checkpoints = [
  {
    name: 'Start point',
    status: 'Green actor',
    left: '20%',
    top: '72%',
    tone: 'bg-emerald-500',
  },
  {
    name: 'Checkpoint A',
    status: 'First move target',
    left: '48%',
    top: '38%',
    tone: 'bg-sky-500',
  },
  {
    name: 'Checkpoint B',
    status: 'Next move target',
    left: '72%',
    top: '56%',
    tone: 'bg-amber-400',
  },
]

const workspaceSegments = [
  {
    title: 'Map layer',
    detail: 'Background image dan positioning marker.',
  },
  {
    title: 'Checkpoint segment',
    detail: 'List titik yang nanti bisa diklik untuk memindah actor.',
  },
  {
    title: 'Animation segment',
    detail: 'Area preview Motion.dev untuk perpindahan actor.',
  },
]

export function ActorMovementWorkspace({ onBack }: ActorMovementWorkspaceProps) {
  const mapPreview = new URL('../../map.png', import.meta.url).href

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
            Workspace page
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Actor Movement Workspaces
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ini adalah page sub yang berisi segmentasi kerja untuk map background dan marker.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back to dashboard
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                Map segment
              </p>
              <h4 className="mt-2 text-xl font-semibold text-slate-900">Background map preview</h4>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Start point
              </span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                Checkpoints
              </span>
            </div>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <img
              src={mapPreview}
              alt="Map background preview"
              className="h-[28rem] w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />

            {checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: checkpoint.left, top: checkpoint.top }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`relative h-5 w-5 rounded-full ${checkpoint.tone} shadow-lg shadow-black/15`}>
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
                    <span className={`absolute inset-1 rounded-full ${checkpoint.tone} ring-2 ring-white`} />
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                    {checkpoint.name}
                  </div>
                </div>
              </div>
            ))}

            <div className="absolute left-[20%] top-[72%] -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-6 w-6 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25">
                  <span className="absolute inset-0 animate-pulse rounded-full bg-emerald-300/40" />
                  <span className="absolute inset-1 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                  Start actor
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Segmentasi
            </p>
            <div className="mt-4 space-y-3">
              {workspaceSegments.map((segment) => (
                <div key={segment.title} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{segment.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{segment.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Checkpoint list
            </p>
            <div className="mt-4 space-y-3">
              {checkpoints.map((checkpoint) => (
                <div
                  key={checkpoint.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${checkpoint.tone}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{checkpoint.name}</p>
                      <p className="text-sm text-slate-600">{checkpoint.status}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Ready</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Motion.dev phase
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-950/80">
              Bagian ini nanti diisi animasi perpindahan actor dari start point ke checkpoint yang dipilih.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}