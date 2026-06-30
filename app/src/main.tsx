import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'

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
