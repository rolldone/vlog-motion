import { NavLink } from 'react-router-dom'

export function MotionIntroOverviewPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Workspace summary</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Motion Intro & Menu Animations
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Kumpulan variasi intro animation untuk menu dan opening screen.
          Tiap sub-project punya pendekatan animasi yang berbeda.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <NavLink
            to="intro-menu-1"
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50"
          >
            <p className="text-sm font-semibold text-slate-900">Intro Menu 1</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              TextStepper — card dengan text, icon, color transition, progress bar, dan fullscreen mode.
            </p>
          </NavLink>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-4">
            <p className="text-sm font-semibold text-slate-400">Intro Menu 2</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">Coming soon...</p>
          </div>
        </div>
      </article>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
            Project route
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            /projects/motion-intro-menu
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Tech</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            motion (motion.dev) — React animation library.
            Tailwind CSS — utility-first styling.
          </p>
        </div>
      </aside>
    </div>
  )
}
