import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

type ProjectShellProps = {
  title: string
  description: string
  homeLabel: string
  backHref: string
  menuItems: Array<{
    label: string
    detail: string
    href?: string
    active?: boolean
  }>
  children: ReactNode
}

export function ProjectShell({
  title,
  description,
  homeLabel,
  backHref,
  menuItems,
  children,
}: ProjectShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <aside className="border-b border-slate-200 p-5 lg:w-80 lg:border-b-0 lg:border-r">
              <Link
                to={backHref}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                ← {homeLabel}
              </Link>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                  Project admin
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </div>

              <div className="mt-6 space-y-3">
                {menuItems.map((item) => {
                  const className = `block w-full rounded-2xl border px-4 py-3 text-left transition ${
                    item.active
                      ? 'border-sky-200 bg-sky-50'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`

                  const content = (
                    <>
                      <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">{item.detail}</span>
                    </>
                  )

                  return item.href ? (
                    <NavLink
                      key={item.label}
                      to={item.href}
                      end
                      className={({ isActive }) =>
                        `${className} ${isActive ? 'ring-2 ring-sky-200' : ''}`
                      }
                    >
                      {content}
                    </NavLink>
                  ) : (
                    <div key={item.label} className={className} role="button" tabIndex={0}>
                      {content}
                    </div>
                  )
                })}
              </div>
            </aside>

            <section className="flex-1 p-5 sm:p-6 lg:p-8">{children}</section>
          </div>
        </div>
      </div>
    </main>
  )
}