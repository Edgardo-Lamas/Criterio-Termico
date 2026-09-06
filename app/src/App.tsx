import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary'
import { AsistenteTermico } from './components/AsistenteTermico/AsistenteTermico'
import { MainLayout } from './app/layouts/MainLayout'
import './styles/global.css'

const Home             = lazy(() => import('./app/routes/Home').then(m => ({ default: m.Home })))
const Herramientas     = lazy(() => import('./app/routes/Herramientas').then(m => ({ default: m.Herramientas })))
const ManualTecnico    = lazy(() => import('./app/routes/ManualTecnico').then(m => ({ default: m.ManualTecnico })))
const ErroresFrecuentes = lazy(() => import('./app/routes/ErroresFrecuentes').then(m => ({ default: m.ErroresFrecuentes })))
const IndiceTematico   = lazy(() => import('./app/routes/IndiceTematico').then(m => ({ default: m.IndiceTematico })))
const ErrorDetalle     = lazy(() => import('./app/routes/ErrorDetalle').then(m => ({ default: m.ErrorDetalle })))
const GuiaDeUso        = lazy(() => import('./app/routes/GuiaDeUso').then(m => ({ default: m.GuiaDeUso })))
const Cuenta           = lazy(() => import('./app/routes/Cuenta').then(m => ({ default: m.Cuenta })))
const Panel            = lazy(() => import('./app/routes/Panel').then(m => ({ default: m.Panel })))
const TerminosDeUso    = lazy(() => import('./app/routes/TerminosDeUso').then(m => ({ default: m.TerminosDeUso })))
const PoliticaPrivacidad = lazy(() => import('./app/routes/PoliticaPrivacidad').then(m => ({ default: m.PoliticaPrivacidad })))

// Rutas donde el asistente no se dibuja. `/cuenta` es la pantalla de ingreso y
// la administración del plan: ahí nadie está calculando nada, y en pantallas
// chicas el botón flotante le queda encima de «Actualizar a PRO».
const RUTAS_SIN_ASISTENTE = ['/cuenta']

// Va adentro del router — `useLocation` sólo funciona ahí. Devolver null
// también evita montar el hook del chat en esas pantallas.
function AsistenteSegunRuta() {
  const { pathname } = useLocation()
  const oculto = RUTAS_SIN_ASISTENTE.some(
    ruta => pathname === ruta || pathname.startsWith(`${ruta}/`)
  )
  if (oculto) return null
  return <AsistenteTermico />
}

function App() {
  const initAuth = useAuthStore(state => state.initAuth)

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
              {/* Va antes del :errorId — el tramo fijo tiene que ganarle al dinámico */}
              <Route path="errores/indice" element={<IndiceTematico />} />
              <Route path="errores/:errorId" element={<ErrorDetalle />} />
              <Route path="guia" element={<GuiaDeUso />} />
              <Route path="cuenta" element={<Cuenta />} />
              <Route path="panel" element={<Panel />} />
              <Route path="terminos" element={<TerminosDeUso />} />
              <Route path="privacidad" element={<PoliticaPrivacidad />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {/* Montado en todas las pantallas de trabajo, con o sin cuenta: antes
          dependía de `isAuthenticated`, así que quien entraba sin cuenta no veía
          la IA por ningún lado — justo lo que distingue a la plataforma de una
          calculadora. El visitante pregunta con una sesión anónima y un cupo
          bajo; ver ensureSesionParaAsistente. Las excepciones, en
          RUTAS_SIN_ASISTENTE. */}
      <AsistenteSegunRuta />
    </BrowserRouter>
  )
}

export default App
