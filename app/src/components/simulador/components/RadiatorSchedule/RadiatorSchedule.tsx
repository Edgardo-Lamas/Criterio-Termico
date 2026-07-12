import React, { useMemo, useState } from 'react';
import { useElementsStore } from '../../store/useElementsStore';
import { planillaRadiadores } from '../../utils/planilla';
import { validarRamalesRadiadores } from '../../utils/hydraulicValidation';

// Planilla de radiadores — como en los planos de obra: el plano muestra solo
// "R1, R2, ..." y acá están todos los datos (ambiente, elementos, potencia).
export const RadiatorSchedule: React.FC = () => {
  const { radiators, rooms, pipes, currentFloor, setSelectedElement } = useElementsStore();
  const [isOpen, setIsOpen] = useState(false);

  const filas = useMemo(
    () => planillaRadiadores(radiators, rooms).filter(f => f.floor === currentFloor),
    [radiators, rooms, currentFloor]
  );

  // Empuje de la bomba por radiador: ¿la caldera lo mueve? (necesita las
  // tuberías del "Conectar Auto"). Se muestra como columna de la planilla.
  const hidraulicaPorRadiador = useMemo(
    () => validarRamalesRadiadores(pipes, radiators),
    [pipes, radiators]
  );
  const enOtraPlanta = radiators.length - filas.length;
  const totalKcalh = filas.reduce((acc, f) => acc + f.potenciaKcalh, 0);

  if (radiators.length === 0) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Planilla de radiadores: identificación, ambiente, elementos y potencia"
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '20px',
          padding: '8px 12px',
          backgroundColor: '#B71C1C',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 110
        }}
      >
        📋 Planilla ({filas.length})
      </button>
    );
  }

  const th: React.CSSProperties = {
    padding: '4px 8px',
    textAlign: 'left',
    fontSize: '11px',
    color: 'white',
    backgroundColor: '#B71C1C',
    position: 'sticky',
    top: 0
  };
  const td: React.CSSProperties = { padding: '4px 8px', fontSize: '12px', color: '#333' };

  return (
    <div style={{
      position: 'fixed',
      bottom: '40px',
      left: '20px',
      width: '390px',
      maxHeight: '45vh',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 110
    }}>
      <div style={{
        padding: '10px 12px',
        backgroundColor: '#B71C1C',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <strong style={{ fontSize: '13px' }}>
          📋 Planilla de radiadores — {currentFloor === 'ground' ? 'PB' : 'PA'}
        </strong>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer' }}
          title="Minimizar"
        >
          ✕
        </button>
      </div>

      <div style={{ overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Ambiente</th>
              <th style={{ ...th, textAlign: 'right' }}>Elem.</th>
              <th style={{ ...th, textAlign: 'right' }}>Alt.</th>
              <th style={{ ...th, textAlign: 'right' }}>Kcal/h</th>
              <th style={{ ...th, textAlign: 'right' }} title="Empuje de la bomba: ¿la caldera mueve este ramal? (pérdida de carga)">Bomba</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr
                key={f.radiatorId}
                onClick={() => setSelectedElement(f.radiatorId)}
                title="Click para seleccionar el radiador en el plano"
                style={{ backgroundColor: i % 2 ? '#FAFAFA' : 'white', cursor: 'pointer' }}
              >
                <td style={{ ...td, fontWeight: 700, color: '#B71C1C' }}>{f.etiqueta}</td>
                <td style={td}>{f.ambiente}</td>
                <td style={{ ...td, textAlign: 'right' }}>{f.elementos ?? '—'}</td>
                <td style={{ ...td, textAlign: 'right' }}>{f.alturaMm ? `${f.alturaMm}` : '—'}</td>
                <td style={{ ...td, textAlign: 'right' }}>{f.potenciaKcalh.toLocaleString('es-AR')}</td>
                {(() => {
                  const h = hidraulicaPorRadiador.get(f.radiatorId);
                  if (!h) return <td style={{ ...td, textAlign: 'right', color: '#999' }}>—</td>;
                  const color = h.estado === 'insuficiente' ? '#D32F2F'
                    : h.estado === 'limite' ? '#E67E22' : '#2E7D32';
                  const icono = h.estado === 'insuficiente' ? '⚠'
                    : h.estado === 'limite' ? '≈' : '✓';
                  return (
                    <td style={{ ...td, textAlign: 'right', color, fontWeight: 600 }}
                        title={`Pérdida de carga del ramal: ${h.deltaPMca} m — ${h.estado === 'insuficiente' ? 'la bomba no llega' : h.estado === 'limite' ? 'al límite' : 'la bomba lo mueve'}`}>
                      {icono} {h.deltaPMca}
                    </td>
                  );
                })()}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #B71C1C', backgroundColor: '#FDECEA' }}>
              <td style={{ ...td, fontWeight: 700 }} colSpan={4}>Total planta</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>
                {totalKcalh.toLocaleString('es-AR')}
              </td>
              <td style={td} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ padding: '6px 12px', fontSize: '10.5px', color: '#888', borderTop: '1px solid #eee' }}>
        Bomba: pérdida de carga del ramal (m). ✓ la bomba lo mueve · ≈ al límite · ⚠ no llega.
        {hidraulicaPorRadiador.size === 0 ? ' Usá "⚡ Conectar Auto" para calcularla.' : ''}
      </div>

      {enOtraPlanta > 0 && (
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#888', borderTop: '1px solid #eee' }}>
          +{enOtraPlanta} radiador{enOtraPlanta !== 1 ? 'es' : ''} en la otra planta
        </div>
      )}
    </div>
  );
};
