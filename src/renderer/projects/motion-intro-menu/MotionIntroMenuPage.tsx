import { Outlet } from 'react-router-dom'
import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  { label: 'Overview', detail: 'Ringkasan intro motion project.', href: '/projects/motion-intro-menu' },
  { label: 'Intro Menu 1', detail: 'TextStepper — card, icon, color, progress, fullscreen.', href: 'intro-menu-1' },
  { label: 'Intro Menu 2', detail: 'Coming soon...' },
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
      <Outlet />
    </ProjectShell>
  )
}