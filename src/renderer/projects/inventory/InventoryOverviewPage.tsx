export function InventoryOverviewPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-600">Workspace summary</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Menu admin khusus project ini.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Di dalam project ini nanti akan ada banyak variasi sub project, jadi menu admin di sini
          jadi pintu untuk tiap variasi tersebut.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Item management</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Kelola item dan kategori.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Stok tracking</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Pantau stok masuk dan keluar.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Visualisasi</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Dashboard dan laporan stok.</p>
          </div>
        </div>
      </article>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-700">
            Project route
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Route ini mewakili satu project folder khusus yang nanti bisa punya banyak sub project.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Next action
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Setelah ini kita bisa tambah route sub menu di dalam project ini.
          </p>
        </div>
      </aside>
    </div>
  )
}
