import { Outlet } from 'react-router-dom'
import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  {
    label: 'Inventory 1',
    detail: 'Percobaan 1: dasar inventory dengan durability.',
    href: 'project-1',
  },
]

export function InventoryPage() {
  return (
    <ProjectShell
      title="Inventory"
      description="Project untuk inventory management, tracking item, dan visualisasi stok."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      <Outlet />
    </ProjectShell>
  )
}
