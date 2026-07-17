import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'

// Con registerType 'autoUpdate', este registro recarga la página solo cuando
// el SW nuevo toma control — sin esto hacían falta dos recargas manuales para
// ver un deploy. El chequeo horario cubre a la PWA instalada que queda abierta.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => { registration.update() }, 60 * 60 * 1000)
    }
  },
})

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0,
  beforeSend(event) {
    // No enviar errores de extensiones de browser ni scripts externos
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      f => f.filename && !f.filename.includes(window.location.origin)
    )) {
      return null
    }
    return event
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
