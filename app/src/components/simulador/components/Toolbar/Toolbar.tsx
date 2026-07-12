import { useRef, useState, useEffect } from 'react';
import { useToolsStore } from '../../store/useToolsStore';
import { useElementsStore } from '../../store/useElementsStore';

import { saveToLocalStorage } from '../../utils/projectStorage';
import { generateAutoPipes, generateMultiFloorPipes } from '../../utils/pipeRouter';
import { dimensionPipes } from '../../utils/pipeDimensioning';
import { downloadIFCFile } from '../../utils/ifcExporter';
import { FloorSelector } from '../FloorSelector/FloorSelector';
import { HelpModal } from '../HelpModal/HelpModal';
import { BudgetCounter } from '../BudgetCounter/BudgetCounter';
import './Toolbar.css';

interface ToolbarProps {
  onOpenPriceConfig?: () => void;
}

export const Toolbar = ({ onOpenPriceConfig }: ToolbarProps) => {
  const { tool, setTool, setBudgetPanelOpen, isBudgetPanelOpen } = useToolsStore();
  const {
    radiators,
    boilers,
    pipes,
    manifolds,
    floorHeatingZones,
    rooms,
    projectName,
    currentFloor,
    floorPlans,
    setPipes,
    setFloorPlan,
    clearElements,
    updateBoilerPower,
  } = useElementsStore();

  const floorPlanInputRef = useRef<HTMLInputElement>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Plano de fondo de la planta actual
  const currentFloorPlan = floorPlans[currentFloor];
  const backgroundImage = currentFloorPlan.image;



  // Autoguardado cada 30 segundos
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (radiators.length > 0 || boilers.length > 0 || pipes.length > 0 ||
          manifolds.length > 0 || floorHeatingZones.length > 0 || rooms.length > 0) {
        setIsSaving(true);
        saveToLocalStorage(radiators, boilers, pipes, projectName, manifolds, floorHeatingZones, rooms);
        setLastSaved(new Date());
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(autoSaveInterval);
  }, [radiators, boilers, pipes, manifolds, floorHeatingZones, rooms, projectName]);

  // Formatear tiempo desde último guardado
  const getTimeSinceLastSave = () => {
    if (!lastSaved) return '';
    const seconds = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return `hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `hace ${minutes}m`;
  };

  // Detectar si hay radiadores en ambas plantas
  const groundRadiators = radiators.filter(r => r.floor === 'ground');
  const firstRadiators = radiators.filter(r => r.floor === 'first');
  const groundBoilers = boilers.filter(b => b.floor === 'ground');
  const firstBoilers = boilers.filter(b => b.floor === 'first');
  const hasMultiFloor = groundRadiators.length > 0 && firstRadiators.length > 0;
  const hasBoilerOnlyInOneFloor = (groundBoilers.length > 0 && firstBoilers.length === 0) ||
    (groundBoilers.length === 0 && firstBoilers.length > 0);

  const handleAutoConnect = () => {
    // Detectar si es escenario multi-planta (caldera en una, radiadores en ambas)
    if (hasMultiFloor && hasBoilerOnlyInOneFloor) {
      handleMultiFloorConnect();
      return;
    }

    // Modo planta única (original)
    const currentFloorRadiators = radiators.filter(r => r.floor === currentFloor);
    const currentFloorBoilers = boilers.filter(b => b.floor === currentFloor);

    if (currentFloorRadiators.length === 0) {
      return;
    }
    if (currentFloorBoilers.length === 0) {
      return;
    }

    // Execute directly without confirmation dialog (las zonas de piso
    // radiante son obstáculo: las troncales no atraviesan un panel)
    const result = generateAutoPipes(currentFloorRadiators, currentFloorBoilers, floorHeatingZones);

    const otherFloorPipes = pipes.filter(p => p.floor !== currentFloor && p.floor !== 'vertical');
    const verticalPipes = pipes.filter(p => p.floor === 'vertical');
    const newPipes = [...otherFloorPipes, ...verticalPipes, ...result.pipes];

    setPipes(newPipes);

    // Auto-dimensionar si todos tienen potencia
    const radiatorsWithPower = currentFloorRadiators.filter(r => r.power > 0);
    if (radiatorsWithPower.length === currentFloorRadiators.length && currentFloorRadiators.length > 0) {
      // Actualizar potencia de la caldera
      const totalRadiatorPower = radiators.reduce((sum, r) => sum + r.power, 0);
      const recommendedBoilerPower = Math.round(totalRadiatorPower / 0.80);
      const mainBoiler = currentFloorBoilers[0];
      if (mainBoiler) {
        updateBoilerPower(mainBoiler.id, recommendedBoilerPower);
      }

      setTimeout(() => {
        try {
          const dimensionedPipes = dimensionPipes(newPipes, radiators, boilers);
          setPipes(dimensionedPipes);
        } catch {
          // Dimensionamiento falló — las tuberías quedan sin diámetro asignado
        }
      }, 100);
    }
  };

  // NUEVO: Conexión automática multi-planta
  const handleMultiFloorConnect = () => {
    // Execute directly without confirmation
    const result = generateMultiFloorPipes(radiators, boilers, undefined, floorHeatingZones);
    setPipes(result.pipes);

    // Auto-dimensionar
    const allRadiatorsWithPower = radiators.filter(r => r.power > 0);
    if (allRadiatorsWithPower.length === radiators.length && radiators.length > 0) {
      // Actualizar potencia de la caldera principal
      const totalRadiatorPower = radiators.reduce((sum, r) => sum + r.power, 0);
      const recommendedBoilerPower = Math.round(totalRadiatorPower / 0.80);
      const mainBoiler = boilers.find(b => b.floor === 'ground') || boilers[0];
      if (mainBoiler) {
        updateBoilerPower(mainBoiler.id, recommendedBoilerPower);
      }

      setTimeout(() => {
        try {
          const dimensionedPipes = dimensionPipes(result.pipes, radiators, boilers);
          setPipes(dimensionedPipes);
        } catch {
          // Dimensionamiento falló — las tuberías quedan sin diámetro asignado
        }
      }, 100);
    }
  };

  // handleDimensionPipes eliminado - "Conectar Auto" ya dimensiona automáticamente

  const handleLoadFloorPlan = () => {
    const floorName = currentFloor === 'ground' ? 'Planta Baja' : 'Planta Alta';
    alert(
      `📐 RECOMENDACIÓN PARA MAYOR PRECISIÓN\n\n` +
      `Para obtener un cómputo de materiales más preciso, se recomienda subir un plano que contenga:\n\n` +
      `• Escala 1:100 (estándar arquitectónico)\n` +
      `• Medidas (cotas) de las habitaciones\n\n` +
      `El plano se cargará en: ${floorName}`
    );

    floorPlanInputRef.current?.click();
  };

  const handleRemoveFloorPlan = () => {
    const floorName = currentFloor === 'ground' ? 'Planta Baja' : 'Planta Alta';
    if (confirm(`¿Eliminar el plano de ${floorName}?`)) {
      setFloorPlan(currentFloor, null);
    }
  };

  const handleFloorPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      alert(`⚠️ Solo se permiten imágenes (PNG, JPG, JPEG).\n\nEl archivo seleccionado es de tipo: "${file.type || 'desconocido'}"`);
      return;
    }

    // Leer imagen como Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      setFloorPlan(currentFloor, imageDataUrl);
    };
    reader.onerror = () => {
      alert('❌ Error al cargar la imagen. Revisa la consola para más detalles.');
    };
    reader.readAsDataURL(file);

    // Resetear input
    if (floorPlanInputRef.current) {
      floorPlanInputRef.current.value = '';
    }
  };



  return (
    <div
      className="toolbar-container"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tools Group */}
      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn ${tool === 'select' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTool('select'); }}
        >
          <span>↖</span> Seleccionar
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'radiator' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTool('radiator'); }}
        >
          <span>▥</span> Radiador
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'boiler' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTool('boiler'); }}
        >
          <span>🔥</span> Caldera
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'floor-heating-zone' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTool('floor-heating-zone'); }}
          title="Dibujar zona de piso radiante (arrastrá un rectángulo sobre el ambiente)"
        >
          <span>🌀</span> Piso Radiante
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'manifold' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTool('manifold'); }}
          title="Colocar colector distribuidor de piso radiante"
        >
          <span>⊞</span> Colector
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Auto Connect */}
      <button
        type="button"
        className="toolbar-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAutoConnect(); }}
        style={{ color: '#E67E22' }} // Orange override for specific tool
        title="Generar tuberías automáticamente"
      >
        <span>⚡</span> Conectar Auto
      </button>

      <div className="toolbar-separator" />

      {/* Floor Control */}
      <FloorSelector />

      {/* NEW: Budget Counter (Social Proof) */}
      <div style={{ marginRight: '10px' }}>
        <BudgetCounter />
      </div>

      <div style={{ flex: 1 }} />

      {/* Project Actions */}
      <div className="toolbar-group">
        <input
          ref={floorPlanInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFloorPlanChange}
        />

        <button
          type="button"
          className="toolbar-btn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLoadFloorPlan(); }}
        >
          <span>📁</span> Plano
        </button>

        {backgroundImage && (
          <button
            type="button"
            className="toolbar-btn"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFloorPlan(); }}
            style={{ color: '#E74C3C' }}
          >
            <span>🗑️</span> Quitar Plano
          </button>
        )}

        <div className="toolbar-separator" />

        {onOpenPriceConfig && (
          <button
            type="button"
            className="toolbar-btn"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenPriceConfig(); }}
            title="Configurar precios de materiales"
          >
            <span>🏷️</span> Precios
          </button>
        )}

        <button
          type="button"
          className={`toolbar-btn accent ${isBudgetPanelOpen ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBudgetPanelOpen(!isBudgetPanelOpen); }}
          title={isBudgetPanelOpen ? 'Cerrar el panel de presupuesto' : 'Abrir el panel de presupuesto'}
        >
          <span>💰</span> Presupuesto
        </button>

        <button
          type="button"
          className="toolbar-btn primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            /* Same export logic, keeping concise for refactor */
            if (radiators.length === 0 && boilers.length === 0) return alert('Sin elementos');
            downloadIFCFile({ boilers, pipes, projectName: projectName || 'Proyecto' }, `${projectName}.ifc`);
          }}
        >
          <span>🏗️</span> Exportar IFC
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('¿Limpiar todo?')) clearElements();
          }}
          title="Limpiar todos los elementos"
          style={{ color: '#E74C3C' }}
        >
          <span>🧹</span> Limpiar
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowHelp(true); }}
        >
          ❓
        </button>

        {lastSaved && (
          <div className={`autosave-indicator ${isSaving ? 'saving' : ''}`} style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {isSaving ? '💾 Guardando...' : `✅ ${getTimeSinceLastSave()}`}
          </div>
        )}
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};
