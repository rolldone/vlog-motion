import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ActorMovementMapPage } from './projects/actor-movement-map/ActorMovementMapPage'
import { ActorMovementOverviewPage } from './projects/actor-movement-map/ActorMovementOverviewPage'
import { Project1Page } from './projects/actor-movement-map/project-1/Project1Page'
import { Project2Page } from './projects/actor-movement-map/project-2/Project2Page'
import { Project3Page } from './projects/actor-movement-map/project-3/Project3Page'
import { MotionClosePage } from './projects/motion-close-page/MotionClosePage'
import { MotionIntroMenuPage } from './projects/motion-intro-menu/MotionIntroMenuPage'
import { MotionIntroOverviewPage } from './projects/motion-intro-menu/MotionIntroOverviewPage'
import { IntroMenu1Page } from './projects/motion-intro-menu/intro-menu-1/IntroMenu1Page'

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
      <Route path="/projects/motion-close-page" element={<MotionClosePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App