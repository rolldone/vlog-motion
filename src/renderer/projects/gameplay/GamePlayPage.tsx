import { Outlet } from 'react-router-dom'
import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  {
    label: 'Gameplay 1',
    detail: 'Percobaan 1: interactive video dashboard.',
    href: 'gameplay-1',
  },
]

export function GamePlayPage() {
  return (
    <ProjectShell
      title="GamePlay"
      description="Interactive video dashboard — load video, overlay UI, dan rekam pakai OBS."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      <Outlet />
    </ProjectShell>
  )
}
