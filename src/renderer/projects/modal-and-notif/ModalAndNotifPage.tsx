import { useState } from 'react'
import { ProjectShell } from '../../components/ProjectShell'
import { Modal1Page } from './Modal1Page'
import { Modal2Page } from './Modal2Page'

export function ModalAndNotifPage() {
  const [activeMenu, setActiveMenu] = useState(0)

  const menuItems = [
    { label: 'Modal 1', detail: 'Modal animasi process selesai.', active: activeMenu === 0, onClick: () => setActiveMenu(0) },
    { label: 'Modal 2', detail: 'Modal animasi selesai (copy).', active: activeMenu === 1, onClick: () => setActiveMenu(1) },
    { label: 'Notification types', detail: 'Toast, banner, dan notifikasi lainnya.', active: activeMenu === 2, onClick: () => setActiveMenu(2) },
  ]

  return (
    <ProjectShell
      title="Modal & Notif"
      description="Project sub untuk modal dialog, notifikasi toast, dan sistem pesan."
      homeLabel="Back to project catalog"
      backHref="/"
      menuItems={menuItems}
    >
      {activeMenu === 0 && <Modal1Page />}
      {activeMenu === 1 && <Modal2Page />}
      {activeMenu === 2 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          Notification types — coming soon.
        </div>
      )}
    </ProjectShell>
  )
}