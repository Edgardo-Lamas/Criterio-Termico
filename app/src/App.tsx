import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary'
import { AsistenteTermico } from './components/AsistenteTermico/AsistenteTermico'
import { MainLayout } from './app/layouts/MainLayout'
import './styles/global.css'

const Home             = lazy(() => import('./app/routes/Home').then(m => ({ default: m.Home })))
const Herramientas     = lazy(() => import('./app/routes/Herramientas').then(m => ({ default: m.Herramientas })))
const ManualTecnico    = lazy(() => import('./app/routes/ManualTecnico').then(m => ({ default: m.ManualTecnico })))
const ErroresFrecuentes = lazy(() => import('./app/routes/ErroresFrecuentes').then(m => ({ default: m.ErroresFrecuentes })))
const ErrorDetalle     = lazy(() => import('./app/routes/ErrorDetalle').then(m => ({ default: m.ErrorDetalle })))
const Cuenta           = lazy(() => import('./app/routes/Cuenta').then(m => ({ default: m.Cuenta })))
const TerminosDeUso    = lazy(() => import('./app/routes/TerminosDeUso').then(m => ({ default: m.TerminosDeUso })))
const PoliticaPrivacidad = lazy(() => import('./app/routes/PoliticaPrivacidad').then(m => ({ default: m.PoliticaPrivacidad })))

function App() {
  const initAuth = useAuthStore(state => state.initAuth)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  useEffect(() => {
    const unsubscribe = initAuth()
    return unsubscribe
  }, [initAuth])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="herramientas" element={<Herramientas />} />
              <Route path="herramientas/:toolId" element={<Herramientas />} />
              <Route path="manual" element={<ManualTecnico />} />
              <Route path="manual/:capitulo" element={<ManualTecnico />} />
              <Route path="errores" element={<ErroresFrecuentes />} />
              <Route path="errores/:errorId" element={<ErrorDetalle />} />
              <Route path="cuenta" element={<Cuenta />} />
              <Route path="terminos" element={<TerminosDeUso />} />
              <Route path="privacidad" element={<PoliticaPrivacidad />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {isAuthenticated && <AsistenteTermico />}
    </BrowserRouter>
  )
}

export default App
