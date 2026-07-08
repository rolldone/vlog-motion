import { Outlet } from 'react-router-dom'
import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  {
    label: 'Project 1',
    detail: 'Percobaan 1: dasar map dan marker.',
    href: 'project-1',
  },
  {
    label: 'Project 2',
    detail: 'Percobaan 2: checkpoint interaksi.',
    href: 'project-2',
  },
  {
    label: 'Project 3',
    detail: 'Percobaan 3: animasi perpindahan actor.',
    href: 'project-3',
  },
]

export function ActorMovementMapPage() {
  return (
    <ProjectShell
      title="Actor Movement Map"
      description="Project utama untuk map background, checkpoint, dan perpindahan actor."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      <Outlet />
    </ProjectShell>
  )
}