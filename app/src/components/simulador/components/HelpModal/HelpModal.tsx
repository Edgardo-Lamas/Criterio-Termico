import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpSection = 
  | 'inicio'
  | 'plano'
  | 'radiadores'
  | 'tuberias'
  | 'presupuesto'
  | 'faq';

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<HelpSection>('inicio');

  if (!isOpen) return null;

  const sections: { id: HelpSection; icon: string; title: string }[] = [
    { id: 'inicio', icon: '🏠', title: 'Primeros pasos' },
    { id: 'plano', icon: '📐', title: 'Cargar un plano' },
    { id: 'radiadores', icon: '🔥', title: 'Radiadores y calderas' },
    { id: 'tuberias', icon: '⚡', title: 'Distribución de tuberías' },
    { id: 'presupuesto', icon: '📊', title: 'Generar presupuesto' },
    { id: 'faq', icon: '❓', title: 'Preguntas frecuentes' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'inicio':
        return (
          <div>
            <h3>🏠 Primeros pasos</h3>
            <p>Bienvenido al Sistema de Diseño de Calefacción. Esta aplicación te permite:</p>
            <ul>
              <li>Diseñar instalaciones de calefacción por radiadores</li>
              <li>Calcular automáticamente el dimensionamiento de tuberías</li>
              <li>Generar presupuestos de materiales</li>
            </ul>
            <h4>Flujo de trabajo recomendado:</h4>
            <ol>
              <li><strong>Cargar el plano</strong> de la vivienda</li>
              <li><strong>Ubicar la caldera</strong> en su posición</li>
              <li><strong>Agregar radiadores</strong> en cada ambiente</li>
              <li><strong>Asignar potencia</strong> a cada radiador (Kcal/h)</li>
              <li><strong>Generar tuberías</strong> automáticamente</li>
              <li><strong>Revisar y ajustar</strong> si es necesario</li>
              <li><strong>Generar presupuesto</strong></li>
            </ol>
          </div>
        );

      case 'plano':
        return (
          <div>
            <h3>📐 Cargar un plano</h3>
            <p>Para mejores resultados, se recomienda:</p>
            <ul>
              <li><strong>Escala 1:100</strong> (estándar arquitectónico)</li>
              <li>Que contenga las <strong>medidas (cotas)</strong> de las habitaciones</li>
              <li>Formato de imagen: PNG o JPG</li>
            </ul>
            <h4>Plantas múltiples:</h4>
            <p>Si tu vivienda tiene más de una planta:</p>
            <ol>
              <li>Usa el selector <strong>"PB / PA"</strong> para cambiar de planta</li>
              <li>Carga un plano diferente para cada planta</li>
              <li>Los radiadores y calderas se guardan por planta</li>
              <li>El sistema creará automáticamente la <strong>montante</strong> (tubería vertical) entre plantas</li>
            </ol>
            <div style={{ backgroundColor: '#FFF3E0', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <strong>💡 Nota:</strong> Si el plano no está a escala exacta, el cálculo de metros de tubería será estimativo. 
              Los demás cálculos (potencias, diámetros, accesorios) no se ven afectados.
            </div>
          </div>
        );

      case 'radiadores':
        return (
          <div>
            <h3>🔥 Radiadores y calderas</h3>
            
            <h4>Agregar una caldera:</h4>
            <ol>
              <li>Click en el botón <strong>"Caldera"</strong></li>
              <li>Click en el plano donde quieras ubicarla</li>
              <li>Normalmente se coloca en Planta Baja</li>
            </ol>

            <h4>Agregar radiadores:</h4>
            <ol>
              <li>Click en el botón <strong>"Radiador"</strong></li>
              <li>Click en el plano en cada ambiente</li>
              <li>Selecciona el radiador para ver sus propiedades</li>
              <li>Ingresa la <strong>potencia en Kcal/h</strong></li>
            </ol>

            <h4>Calcular la potencia necesaria:</h4>
            <p>Fórmula básica: <strong>Potencia = Superficie × 100 Kcal/h/m²</strong></p>
            <p>Ejemplo: Habitación de 15 m² → 15 × 100 = 1500 Kcal/h</p>
            
            <div style={{ backgroundColor: '#E3F2FD', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <strong>📝 Próximamente:</strong> Podrás seleccionar marcas específicas (PEISA, BAXI, etc.) 
              con modelos y precios reales para el presupuesto.
            </div>
          </div>
        );

      case 'tuberias':
        return (
          <div>
            <h3>⚡ Distribución de tuberías</h3>
            
            <h4>Generación automática:</h4>
            <ol>
              <li>Asegúrate de tener caldera y radiadores ubicados</li>
              <li>Click en <strong>"⚡ Conectar Auto"</strong></li>
              <li>El sistema genera la distribución óptima</li>
            </ol>

            <h4>Colores de tuberías:</h4>
            <ul>
              <li><span style={{ color: '#29B6F6' }}>■ Azul</span>: Tubería de <strong>IDA</strong> (agua caliente)</li>
              <li><span style={{ color: '#D32F2F' }}>■ Rojo</span>: Tubería de <strong>RETORNO</strong> (agua fría)</li>
            </ul>

            <h4>Dimensionamiento automático:</h4>
            <p>El diámetro se calcula según la potencia que transporta cada tramo:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Potencia</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Diámetro PEX</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ border: '1px solid #ddd', padding: '8px' }}>Hasta 4,500 Kcal/h</td><td style={{ border: '1px solid #ddd', padding: '8px' }}>16 mm</td></tr>
                <tr><td style={{ border: '1px solid #ddd', padding: '8px' }}>Hasta 7,500 Kcal/h</td><td style={{ border: '1px solid #ddd', padding: '8px' }}>20 mm</td></tr>
                <tr><td style={{ border: '1px solid #ddd', padding: '8px' }}>Hasta 13,000 Kcal/h</td><td style={{ border: '1px solid #ddd', padding: '8px' }}>25 mm</td></tr>
                <tr><td style={{ border: '1px solid #ddd', padding: '8px' }}>Hasta 22,000 Kcal/h</td><td style={{ border: '1px solid #ddd', padding: '8px' }}>32 mm</td></tr>
              </tbody>
            </table>

            <h4>Sistema multi-planta:</h4>
            <p>Si hay radiadores en ambas plantas y caldera en una sola, el sistema crea automáticamente 
            una <strong>montante vertical</strong> dimensionada según la potencia de la planta que alimenta.</p>
          </div>
        );

      case 'presupuesto':
        return (
          <div>
            <h3>📊 Generar presupuesto</h3>
            
            <h4>El presupuesto incluye:</h4>
            <ul>
              <li>Caldera (cantidad y potencia)</li>
              <li>Radiadores (cantidad y potencia total)</li>
              <li>Tuberías por diámetro (metros lineales)</li>
              <li>Accesorios (T, codos, etc.) - <em>próximamente</em></li>
            </ul>

            <h4>Pasos para generar:</h4>
            <ol>
              <li>Completa el diseño de la instalación</li>
              <li>Click en <strong>"📊 Presupuesto"</strong></li>
              <li>Revisa el detalle de materiales</li>
              <li>Exporta o imprime según necesites</li>
            </ol>

            <div style={{ backgroundColor: '#E8F5E9', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <strong>🔜 Próximamente:</strong> Selección de marcas (PEISA, BAXI) con precios actualizados 
              para obtener presupuestos con valores reales de mercado.
            </div>

            <div style={{ backgroundColor: '#FFF3E0', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <strong>⚠️ Importante:</strong> "Diseño generado mediante cálculos de ingeniería. 
              El profesional instalador deberá verificar y adaptar según las condiciones particulares de la obra."
            </div>
          </div>
        );

      case 'faq':
        return (
          <div>
            <h3>❓ Preguntas frecuentes</h3>
            
            <h4>¿Puedo mover los radiadores después de ubicarlos?</h4>
            <p>Sí, usa la herramienta <strong>"Seleccionar"</strong> y arrastra el radiador a la nueva posición. 
            Luego regenera las tuberías.</p>

            <h4>¿Cómo elimino un elemento?</h4>
            <p>Selecciona el elemento y presiona la tecla <strong>Delete</strong> o <strong>Suprimir</strong>.</p>

            <h4>¿Puedo editar las tuberías manualmente?</h4>
            <p>Actualmente las tuberías se generan automáticamente. Si necesitas ajustes, 
            puedes eliminarlas y reposicionar los radiadores para obtener un nuevo trazado.</p>

            <h4>¿Por qué algunas tuberías tienen diferente grosor?</h4>
            <p>El grosor visual representa el diámetro. Tuberías más gruesas transportan más caudal 
            (alimentan más radiadores o de mayor potencia).</p>

            <h4>¿Cómo navego por el plano?</h4>
            <ul>
              <li><strong>Zoom:</strong> Rueda del mouse</li>
              <li><strong>Pan (mover):</strong> Click derecho + arrastrar, o click con rueda + arrastrar</li>
              <li><strong>Centrar:</strong> Botón "⟲" para resetear vista</li>
            </ul>

            <h4>¿Qué hago si el plano no está a escala?</h4>
            <p>El sistema funcionará correctamente para el diseño y dimensionamiento. 
            Solo los metros lineales de tubería serán estimativos.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '800px',
          maxWidth: '90vw',
          height: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1976D2',
            color: 'white',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px' }}>❓ Centro de Ayuda</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div
            style={{
              width: '200px',
              borderRight: '1px solid #e0e0e0',
              backgroundColor: '#f5f5f5',
              overflowY: 'auto',
            }}
          >
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: activeSection === section.id ? '#1976D2' : 'transparent',
                  color: activeSection === section.id ? 'white' : '#333',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              lineHeight: '1.6',
            }}
          >
            {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center',
            color: '#666',
            fontSize: '12px',
          }}
        >
          Sistema de Diseño de Calefacción v1.0 • ¿Dudas? Contacta a soporte
        </div>
      </div>
    </div>
  );
};
