import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary'
import { MainLayout } from './app/layouts/MainLayout'
import { Home } from './app/routes/Home'
import { Herramientas } from './app/routes/Herramientas'
import { ManualTecnico } from './app/routes/ManualTecnico'
import { ErroresFrecuentes } from './app/routes/ErroresFrecuentes'
import { ErrorDetalle } from './app/routes/ErrorDetalle'
import { Cuenta } from './app/routes/Cuenta'
import { TerminosDeUso } from './app/routes/TerminosDeUso'
import './styles/global.css'

function App() {
  const initAuth = useAuthStore(state => state.initAuth)

  useEffect(() => {
    const unsubscribe = initAuth()
    return unsubscribe
  }, [initAuth])

  return (
    <BrowserRouter basename="/Criterio-Termico">
      <ErrorBoundary>
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
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
