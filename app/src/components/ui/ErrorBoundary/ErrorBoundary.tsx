import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    message: string
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.wrapper}>
                    <div className={styles.card}>
                        <h2 className={styles.title}>Algo salió mal</h2>
                        <p className={styles.desc}>
                            Ocurrió un error inesperado en esta sección.
                            Podés intentar recargar la página o volver al inicio.
                        </p>
                        {this.state.message && (
                            <code className={styles.error}>{this.state.message}</code>
                        )}
                        <div className={styles.actions}>
                            <button
                                className={styles.btnPrimary}
                                onClick={() => window.location.reload()}
                            >
                                Recargar página
                            </button>
                            <a className={styles.btnSecondary} href="/Criterio-Termico/">
                                Ir al inicio
                            </a>
                        </div>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
