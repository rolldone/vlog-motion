import { Link } from 'react-router-dom'

const projects = [
  {
    title: 'Actor Movement Map',
    description: 'Project utama untuk map background, checkpoint, dan actor movement.',
    route: '/projects/actor-movement-map',
    status: 'Active',
    accent: 'from-sky-500 to-cyan-400',
  },
  {
    title: 'Motion Intro Menu',
    description: 'Project sub untuk intro motion, opening UI, dan transition menu.',
    route: '/projects/motion-intro-menu',
    status: 'Coming soon',
    accent: 'from-amber-500 to-orange-400',
  },
  {
    title: 'Motion Close Page',
    description: 'Project sub untuk closing page, ending state, dan outro motion.',
    route: '/projects/motion-close-page',
    status: 'Coming soon',
    accent: 'from-emerald-500 to-lime-400',
  },
  {
    title: 'Inventory',
    description: 'Project untuk inventory management, tracking item, dan visualisasi stok.',
    route: '/projects/inventory',
    status: 'Active',
    accent: 'from-violet-500 to-purple-400',
  },
  {
    title: 'Gallery',
    description: 'Project gallery — koleksi visual, motion assets, dan gallery items.',
    route: '/projects/gallery',
    status: 'Active',
    accent: 'from-pink-500 to-rose-400',
  },
  {
    title: 'Cost',
    description: 'Project untuk cost tracking, expense management, dan visualisasi pengeluaran.',
    route: '/projects/cost',
    status: 'Active',
    accent: 'from-teal-500 to-emerald-400',
  },
]

export function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                Project catalog
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Pilih project dari card view.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Halaman ini hanya sebagai display product. Setiap card punya route sendiri, dan
                masuk ke page admin milik project tersebut.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Full width catalog
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">No sidebar here</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.route}
                to={project.route}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`h-2 bg-gradient-to-r ${project.accent}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Project card
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">
                        {project.title}
                      </h2>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {project.status}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">{project.description}</p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-500">Open project</span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      Enter
                      <span className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}