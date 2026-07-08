type AdminOverviewProps = {
  onOpenWorkspace: () => void
}

const projects = [
  {
    title: 'Actor Movement Map',
    description: 'Workspace utama untuk map background, checkpoint, dan perpindahan actor.',
    status: 'Active',
    tone: 'bg-sky-50 text-sky-700 ring-sky-200',
    accent: 'from-sky-500 to-cyan-400',
    action: 'Open workspace',
    primary: true,
  },
  {
    title: 'Motion Intro Menu',
    description: 'Sub project untuk animasi pembuka, transisi menu, dan hero motion.',
    status: 'Coming soon',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    accent: 'from-amber-500 to-orange-400',
    action: 'Preview card',
    primary: false,
  },
  {
    title: 'Motion Close Page',
    description: 'Sub project untuk penutup, exit state, dan animasi akhir page.',
    status: 'Coming soon',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    accent: 'from-emerald-500 to-lime-400',
    action: 'Preview card',
    primary: false,
  },
]

export function AdminOverview({ onOpenWorkspace }: AdminOverviewProps) {
  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
              Admin overview
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Pilih sub project dari card view.
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Dashboard ini adalah pusat admin untuk beberapa sub project. Untuk tahap awal, kita
              tampilkan tiga card sebagai pintu masuk project yang berbeda.
            </p>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-sky-50 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Admin scope
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Full width dashboard</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.title}
              type="button"
              onClick={project.primary ? onOpenWorkspace : undefined}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`h-2 bg-gradient-to-r ${project.accent}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Project card
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-slate-900">{project.title}</h4>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${project.tone}`}>
                    {project.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{project.description}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    {project.primary ? 'Ready to open' : 'Segment planned'}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {project.action}
                    <span className="transition group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Current model
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">1 admin, many sub project</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Setiap card mewakili sebuah area kerja yang tersegmentasi.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Layout
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">Full width canvas</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Tidak lagi dibatasi lebar tengah, jadi lebih terasa seperti admin panel.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Next
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">Map workspace</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Card pertama langsung mengarah ke project Actor Movement Map.
            </p>
          </div>
        </div>
      </article>
    </section>
  )
}