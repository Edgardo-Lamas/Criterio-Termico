import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from './components/Canvas/Canvas'
import { Toolbar } from './components/Toolbar/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel'
import { RoomPanel } from './components/RoomPanel/RoomPanel'
import { ConfigPanel } from './components/ConfigPanel/ConfigPanel'
import { BudgetPanel } from './components/BudgetPanel/BudgetPanel'
import { PriceConfigPanel } from './components/PriceConfigPanel/PriceConfigPanel'
import { useToolsStore } from './store/useToolsStore'
import styles from './Simulador2D.module.css'
import './SimuladorApp.css'

const MIN_DESKTOP_WIDTH = 1024

export function Simulador2D() {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= MIN_DESKTOP_WIDTH)
    const [showSimulator, setShowSimulator] = useState(false)
    const { isBudgetPanelOpen, setBudgetPanelOpen } = useToolsStore()
    const [isPriceConfigOpen, setIsPriceConfigOpen] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= MIN_DESKTOP_WIDTH)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // ── Mobile/Tablet block ──
    if (!isDesktop) {
        return (
            <div className={styles.mobileBlock}>
                <div className={styles.mobileBlockContent}>
                    <span className={styles.mobileIcon}>🖥️</span>
                    <h2>Solo disponible en Desktop</h2>
                    <p>
                        El Simulador 2D requiere una pantalla de al menos <strong>1024px</strong> de ancho
                        para poder trabajar con precisión.
                    </p>
                    <p className={styles.mobileHint}>
                        Abrí esta herramienta desde una notebook o PC de escritorio.
                    </p>
                </div>
            </div>
        )
    }

    // ── Splash / Presentation ──
    if (!showSimulator) {
        return (
            <div className={styles.splash}>
                <div className={styles.splashContent}>
                    <Link to="/herramientas" className={styles.backLink}>← Herramientas</Link>
                    <div className={styles.splashIcon}>🖥️</div>
                    <h1 className={styles.splashTitle}>Simulador 2D</h1>
                    <p className={styles.splashSubtitle}>
                        Diseñá instalaciones de calefacción completas en un canvas interactivo.
                    </p>

                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>📐</span>
                            <h3>Planos de planta</h3>
                            <p>Cargá el plano de tu obra y trabajá sobre él</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🔥</span>
                            <h3>Radiadores y calderas</h3>
                            <p>Colocá elementos del catálogo y calculá potencias</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🔧</span>
                            <h3>Tuberías automáticas</h3>
                            <p>Trazado y dimensionamiento automático de cañerías</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>💰</span>
                            <h3>Presupuesto integrado</h3>
                            <p>Generá presupuestos en PDF con materiales y mano de obra</p>
                        </div>
                    </div>

                    <button
                        className={styles.enterButton}
                        onClick={() => setShowSimulator(true)}
                    >
                        Ingresar al Simulador →
                    </button>
                </div>
            </div>
        )
    }

    // ── Full Simulator ──
    return (
        <div className={styles.simulatorFullscreen}>
            <div className={styles.simulatorHeader}>
                <button
                    className={styles.exitButton}
                    onClick={() => setShowSimulator(false)}
                >
                    ← Salir del Simulador
                </button>
                <span className={styles.simulatorTitle}>🖥️ Simulador 2D</span>
            </div>
            <div className="app-container">
                <Toolbar onOpenPriceConfig={() => setIsPriceConfigOpen(true)} />
                <div className="main-content">
                    <Canvas />
                    <PropertiesPanel />
                    <RoomPanel />
                    <ConfigPanel />
                    <BudgetPanel isOpen={isBudgetPanelOpen} onClose={() => setBudgetPanelOpen(false)} />
                    <PriceConfigPanel isOpen={isPriceConfigOpen} onClose={() => setIsPriceConfigOpen(false)} />
                </div>
            </div>
        </div>
    )
}
