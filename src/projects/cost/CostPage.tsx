import { Outlet } from 'react-router-dom'
import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  {
    label: 'Cost 1',
    detail: 'Percobaan 1: dasar cost tracking dan expense management.',
    href: 'project-1',
  },
]

export function CostPage() {
  return (
    <ProjectShell
      title="Cost"
      description="Project untuk cost tracking, expense management, dan visualisasi pengeluaran."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      <Outlet />
    </ProjectShell>
  )
}
