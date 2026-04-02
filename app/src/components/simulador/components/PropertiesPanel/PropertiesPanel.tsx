import { useState, useEffect } from 'react';
import { useElementsStore } from '../../store/useElementsStore';
import type { Radiator } from '../../models/Radiator';
import type { Boiler } from '../../models/Boiler';
import type { PipeSegment } from '../../models/PipeSegment';
import { calculateRoomPower } from '../../utils/thermalCalculator';
import './PropertiesPanel.css';

// Type for the selected element that can be edited
type EditableElement = Radiator | Boiler | PipeSegment;

// Type for edited values - includes all possible editable properties from all element types
// This is intentionally flexible to support the dynamic form editing pattern
interface EditedValues {
  // Common
  id?: string;
  type?: 'radiator' | 'boiler' | 'pipe';
  x?: number;
  y?: number;
  // Radiator & Boiler
  power?: number;
  width?: number;
  height?: number;
  floor?: 'ground' | 'first' | 'vertical';
  // Pipe specific
  pipeType?: 'supply' | 'return';
  points?: Array<{ x: number; y: number }>;
  diameter?: number;
  material?: string;
  fromElementId?: string | null;
  toElementId?: string | null;
  length?: number;
  zone?: string | null;
  zIndex?: number;
}

// Type guard functions for type narrowing
function isRadiator(element: EditableElement): element is Radiator {
  return element.type === 'radiator';
}

function isBoiler(element: EditableElement): element is Boiler {
  return element.type === 'boiler';
}

function isPipe(element: EditableElement): element is PipeSegment {
  return element.type === 'pipe';
}

export const PropertiesPanel = () => {
  const {
    radiators,
    boilers,
    pipes,
    rooms,
    selectedElementId,
    updateElement,
    removeElement,
    setSelectedElement,
    assignRadiatorToRoom,
    unassignRadiatorFromRoom
  } = useElementsStore();

  // Encontrar el elemento seleccionado
  const selectedElement: EditableElement | undefined =
    radiators.find(r => r.id === selectedElementId) ||
    boilers.find(b => b.id === selectedElementId) ||
    pipes.find(p => p.id === selectedElementId);

  // Estado local para edición - usa EditedValues que incluye todas las propiedades posibles
  const [editedValues, setEditedValues] = useState<EditedValues>({});

  // Actualizar valores locales cuando cambia la selección O cuando cambian las tuberías
  useEffect(() => {
    if (selectedElement) {
      // Crear un nuevo objeto para forzar actualización completa
      setEditedValues({ ...selectedElement });
    }
  }, [selectedElement, selectedElementId, pipes]); // Agregar pipes para actualizar cuando se dimensionan

  if (!selectedElement) {
    return (
      <div className="properties-panel empty">
        <h3>Propiedades</h3>
        <p>
          Selecciona un elemento para ver y editar sus propiedades
        </p>
      </div>
    );
  }

  const handleChange = <K extends keyof EditedValues>(field: K, value: EditedValues[K]) => {
    setEditedValues({ ...editedValues, [field]: value });
  };

  const handleSave = () => {
    if (selectedElementId && selectedElement) {
      // Solo enviar campos editables según tipo de elemento
      if (isRadiator(selectedElement)) {
        updateElement(selectedElementId, {
          power: editedValues.power,
          width: editedValues.width,
          height: editedValues.height,
        });
      } else if (isBoiler(selectedElement)) {
        updateElement(selectedElementId, {
          power: editedValues.power,
          width: editedValues.width,
          height: editedValues.height,
        });
      } else if (isPipe(selectedElement)) {
        updateElement(selectedElementId, {
          diameter: editedValues.diameter,
          material: editedValues.material,
        });
      }

      setSelectedElement(null); // Cerrar panel
    }
  };

  const handleCancel = () => {
    setEditedValues({ ...selectedElement });
    setSelectedElement(null); // Cerrar panel
  };

  const handleDelete = () => {
    if (selectedElementId && confirm('¿Estás seguro de eliminar este elemento?')) {
      removeElement(selectedElementId);
      setSelectedElement(null); // Cerrar panel
    }
  };

  const handleClose = () => {
    setSelectedElement(null);
  };

  const renderProperties = () => {
    if (isRadiator(selectedElement)) {
      const radiator = selectedElement;
      const assignedRoom = rooms.find(r => r.radiatorIds.includes(radiator.id));

      return (
        <>
          <h3>🔲 Radiador</h3>

          <div className="property-group">
            <label className="property-label">Asignar a Habitación</label>
            <select
              className="property-select"
              value={assignedRoom?.id || ''}
              onChange={(e) => {
                /* Handle room assignment changes */
                if (assignedRoom && assignedRoom.id !== e.target.value) {
                  unassignRadiatorFromRoom(radiator.id, assignedRoom.id);
                  // Recalculate remaining
                  const remaining = assignedRoom.radiatorIds.filter(id => id !== radiator.id);
                  if (remaining.length) {
                    const p = Math.round(calculateRoomPower(assignedRoom) / remaining.length);
                    remaining.forEach(rid => updateElement(rid, { power: p }));
                  }
                }
                if (e.target.value) {
                  const newRoom = rooms.find(r => r.id === e.target.value);
                  if (newRoom) {
                    assignRadiatorToRoom(radiator.id, newRoom.id);
                    const totalRads = newRoom.radiatorIds.length + 1;
                    const p = Math.round(calculateRoomPower(newRoom) / totalRads);
                    [...newRoom.radiatorIds, radiator.id].forEach(rid => updateElement(rid, { power: p }));
                    setEditedValues({ ...editedValues, power: p });
                  }
                } else {
                  updateElement(radiator.id, { power: 0 });
                  setEditedValues({ ...editedValues, power: 0 });
                }
              }}
            >
              <option value="">-- Sin Asignar --</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {assignedRoom && (
            <div className="info-card success">
              <strong>✓ Asignado a "{assignedRoom.name}"</strong>
              <span>Potencia calculada automáticamente.</span>
            </div>
          )}

          <div className="property-group">
            <label className="property-label">Potencia (Kcal/h)</label>
            <input
              className="property-input"
              type="number"
              value={editedValues.power ?? 0}
              onChange={(e) => handleChange('power', Number(e.target.value))}
              disabled={!!assignedRoom}
            />
          </div>

          <div className="property-group" style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label className="property-label">Ancho (px)</label>
              <input className="property-input" type="number" value={editedValues.width ?? 0} onChange={e => handleChange('width', Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="property-label">Alto (px)</label>
              <input className="property-input" type="number" value={editedValues.height ?? 0} onChange={e => handleChange('height', Number(e.target.value))} />
            </div>
          </div>
        </>
      );
    }

    if (isBoiler(selectedElement)) {
      return (
        <>
          <h3>🔥 Caldera</h3>
          <div className="property-group">
            <label className="property-label">Potencia (Kcal/h)</label>
            <input
              className="property-input"
              type="number"
              value={editedValues.power ?? 0}
              onChange={e => handleChange('power', Number(e.target.value))}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              ≈ {((editedValues.power ?? 0) / 860).toFixed(1)} kW
            </div>
          </div>
        </>
      );
    }

    if (isPipe(selectedElement)) {
      const pipe = selectedElement;
      return (
        <>
          <h3>{pipe.pipeType === 'supply' ? '🔴 Tubería IDA' : '🔵 Tubería RETORNO'}</h3>
          <div className="property-group">
            <label className="property-label">Diámetro (mm)</label>
            <select
              className="property-select"
              value={editedValues.diameter ?? pipe.diameter ?? 16}
              onChange={e => handleChange('diameter', Number(e.target.value))}
            >
              {[12, 16, 20, 25, 32, 40].map(d => <option key={d} value={d}>{d} mm</option>)}
            </select>
          </div>
          <div className="property-group">
            <label className="property-label">Material</label>
            <select
              className="property-select"
              value={editedValues.material ?? 'PEX'}
              onChange={e => handleChange('material', e.target.value)}
            >
              <option value="PEX">PEX</option>
              <option value="Cobre">Cobre</option>
              <option value="Multicapa">Multicapa</option>
            </select>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div
      className="properties-panel"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
        style={{
          position: 'absolute', top: '12px', right: '12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-secondary)'
        }}>✕</button>

      {renderProperties()}

      <div className="info-card info" style={{ marginTop: 'auto' }}>
        <strong>ID:</strong> {selectedElement.id.substring(0, 8)}...
      </div>

      <div className="property-actions">
        <button className="action-btn save" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }}>Guardar</button>
        <button className="action-btn cancel" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancel(); }}>Cancelar</button>
        <button className="action-btn delete" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}>🗑️</button>
      </div>
    </div>
  );
};
