import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  { label: 'Overview', detail: 'Ringkasan intro motion project.', active: true },
  { label: 'Hero motion', detail: 'Preview motion pembuka dan transisi.' },
  { label: 'Menu state', detail: 'Konsep menu utama dan entry animation.' },
]

export function MotionIntroMenuPage() {
  return (
    <ProjectShell
      title="Motion Intro Menu"
      description="Project sub untuk intro motion, opening UI, dan transition menu."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
            Project summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Admin menu untuk intro motion.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Folder project ini nanti punya page admin sendiri untuk mengelola variasi sub project
            yang berkaitan dengan intro motion.
          </p>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Ready structure
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Struktur route sudah mengarah ke folder project ini, jadi nanti tinggal tambah submenu
            di dalamnya.
          </p>
        </aside>
      </div>
    </ProjectShell>
  )
}