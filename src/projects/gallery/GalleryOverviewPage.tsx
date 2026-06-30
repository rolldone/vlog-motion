import { Link } from 'react-router-dom'

const items = [
  {
    title: 'Gallery 1',
    description: 'Gallery pertama — tempat collect visual / motion assets.',
    route: '/projects/gallery/gallery-1',
    status: 'Coming soon',
    accent: 'from-pink-500 to-rose-400',
  },
]

export function GalleryOverviewPage() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
          Gallery
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Project Gallery
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Koleksi visual, motion assets, dan gallery items.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.route}
            to={item.route}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`h-2 bg-gradient-to-r ${item.accent}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Gallery item
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  {item.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-500">Open</span>
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
  )
}
