import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './pages/layout'
import Loading from './pages/loading'

const GamePage = lazy(() => import('./pages/[channel]'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/:channel"
          element={
            <Suspense fallback={<Loading />}>
              <GamePage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
