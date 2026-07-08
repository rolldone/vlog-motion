export function GamePlayOverviewPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">Workspace summary</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Interactive Video Dashboard.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Load video dari CapCut, tambahkan UI overlay interaktif (menu, gallery, inventory, dll),
          lalu rekam seluruh session pakai OBS untuk menghasilkan video final yang terasa seperti
          game.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Video Player</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Full-screen video background dari file .mp4.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">UI Overlay</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Menu, gallery, inventory, mini browser di atas video.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">OBS Recording</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Rekam seluruh layar untuk video final.</p>
          </div>
        </div>
      </article>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
            Project route
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Route ini mewakili satu project folder khusus yang nanti bisa punya banyak sub project
            dengan tema dan layout berbeda.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Next action
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Mulai dengan gameplay-1 — video player + basic overlay + tombol interaktif.
          </p>
        </div>
      </aside>
    </div>
  )
}
