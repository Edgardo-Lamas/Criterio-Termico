import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './app/layouts/MainLayout'
import { Home } from './app/routes/Home'
import { Herramientas } from './app/routes/Herramientas'
import { ManualTecnico } from './app/routes/ManualTecnico'
import { ErroresFrecuentes } from './app/routes/ErroresFrecuentes'
import { Cuenta } from './app/routes/Cuenta'
import { TerminosDeUso } from './app/routes/TerminosDeUso'
import './styles/global.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="herramientas" element={<Herramientas />} />
          <Route path="herramientas/:toolId" element={<Herramientas />} />
          <Route path="manual" element={<ManualTecnico />} />
          <Route path="manual/:capitulo" element={<ManualTecnico />} />
          <Route path="errores" element={<ErroresFrecuentes />} />
          <Route path="cuenta" element={<Cuenta />} />
          <Route path="terminos" element={<TerminosDeUso />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
