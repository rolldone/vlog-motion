import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ActorMovementMapPage } from './projects/actor-movement-map/ActorMovementMapPage'
import { ActorMovementOverviewPage } from './projects/actor-movement-map/ActorMovementOverviewPage'
import { Project1Page } from './projects/actor-movement-map/project-1/Project1Page'
import { Project2Page } from './projects/actor-movement-map/project-2/Project2Page'
import { Project3Page } from './projects/actor-movement-map/project-3/Project3Page'
import { MotionClosePage } from './projects/motion-close-page/MotionClosePage'
import { InventoryPage } from './projects/inventory/InventoryPage'
import { InventoryOverviewPage } from './projects/inventory/InventoryOverviewPage'
import { Project1Page as InventoryProject1Page } from './projects/inventory/project-1/Project1Page'
import { MotionIntroMenuPage } from './projects/motion-intro-menu/MotionIntroMenuPage'
import { MotionIntroOverviewPage } from './projects/motion-intro-menu/MotionIntroOverviewPage'
import { IntroMenu1Page } from './projects/motion-intro-menu/intro-menu-1/IntroMenu1Page'
import { GalleryPage } from './projects/gallery/GalleryPage'
import { GalleryOverviewPage } from './projects/gallery/GalleryOverviewPage'
import { Gallery1Page } from './projects/gallery/gallery-1/Gallery1Page'
import { CostPage } from './projects/cost/CostPage'
import { CostOverviewPage } from './projects/cost/CostOverviewPage'
import { Project1Page as CostProject1Page } from './projects/cost/project-1/Project1Page'
import { GamePlayPage } from './projects/gameplay/GamePlayPage'
import { GamePlayOverviewPage } from './projects/gameplay/GamePlayOverviewPage'
import { GamePlay1Page } from './projects/gameplay/gameplay-1/GamePlay1Page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/actor-movement-map" element={<ActorMovementMapPage />}>
        <Route index element={<ActorMovementOverviewPage />} />
        <Route path="project-1" element={<Project1Page />} />
        <Route path="project-2" element={<Project2Page />} />
        <Route path="project-3" element={<Project3Page />} />
      </Route>
      <Route path="/projects/motion-intro-menu" element={<MotionIntroMenuPage />}>
        <Route index element={<MotionIntroOverviewPage />} />
        <Route path="intro-menu-1" element={<IntroMenu1Page />} />
      </Route>
      <Route path="/projects/inventory" element={<InventoryPage />}>
        <Route index element={<InventoryOverviewPage />} />
        <Route path="project-1" element={<InventoryProject1Page />} />
      </Route>
      <Route path="/projects/gallery" element={<GalleryPage />}>
        <Route index element={<GalleryOverviewPage />} />
        <Route path="gallery-1" element={<Gallery1Page />} />
      </Route>
      <Route path="/projects/cost" element={<CostPage />}>
        <Route index element={<CostOverviewPage />} />
        <Route path="project-1" element={<CostProject1Page />} />
      </Route>
      <Route path="/projects/gameplay" element={<GamePlayPage />}>
        <Route index element={<GamePlayOverviewPage />} />
        <Route path="gameplay-1" element={<GamePlay1Page />} />
      </Route>
      <Route path="/projects/motion-close-page" element={<MotionClosePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App