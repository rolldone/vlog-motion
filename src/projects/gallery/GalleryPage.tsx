import { Link, Outlet, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Overview', to: '/projects/gallery' },
  { label: 'Gallery 1', to: '/projects/gallery/gallery-1' },
]

export function GalleryPage() {
  const location = useLocation()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Home
          </Link>

          <p className="text-sm font-semibold tracking-tight text-slate-700">Gallery</p>

          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const active =
                tab.to === '/projects/gallery'
                  ? location.pathname === '/projects/gallery'
                  : location.pathname.startsWith(tab.to)

              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </div>
    </main>
  )
}
