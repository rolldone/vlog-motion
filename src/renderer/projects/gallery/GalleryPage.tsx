import { Outlet } from 'react-router-dom'
import { ProjectShell } from '../../components/ProjectShell'

const menuItems = [
  {
    label: 'Gallery 1',
    detail: 'Percobaan 1: dasar gallery page.',
    href: 'gallery-1',
  },
]

export function GalleryPage() {
  return (
    <ProjectShell
      title="Gallery"
      description="Project gallery — koleksi visual, motion assets, dan gallery items."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      <Outlet />
    </ProjectShell>
  )
}
