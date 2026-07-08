import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  { label: 'Overview', detail: 'Ringkasan close page motion.', active: true },
  { label: 'Closing state', detail: 'Preview animasi penutup.' },
  { label: 'Exit flow', detail: 'Konsep perpindahan ke akhir halaman.' },
]

export function MotionClosePage() {
  return (
    <ProjectShell
      title="Motion Close Page"
      description="Project sub untuk penutup, exit state, dan animasi akhir page."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Project summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Admin menu untuk close page motion.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Folder project ini nanti juga punya banyak variasi sub project, jadi route-nya sudah
            disiapkan dari sekarang.
          </p>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Ready structure
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tinggal nanti kita isi submenu admin sesuai kebutuhan project close page.
          </p>
        </aside>
      </div>
    </ProjectShell>
  )
}