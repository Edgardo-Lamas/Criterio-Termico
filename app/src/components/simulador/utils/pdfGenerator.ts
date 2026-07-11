import jsPDF from 'jspdf';
import type { Room } from '../models/Room';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';
import type { CompanyInfo, Promotion, ClientInfo } from '../store/companyStore';
import type { Manifold } from '../models/Manifold';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { FloorHeatingCircuit, Montante } from './floorHeating';
import type { FloorHeatingBudget } from './floorHeatingBudget';
import { calculateBoilerPower, calculateRoomPower } from './thermalCalculator';
import { cargaPisoKcalh } from './floorHeating';
import { MARGEN_SEGURIDAD } from './floorHeatingBudget';
import { generarConsideraciones } from './consideraciones';
import type { Consideracion } from './consideraciones';
import type { SelectedBudget } from '../services/budgetService';

// Paleta del presupuesto (impresión): encabezados en azul noche, acento de
// marca Criterio Térmico, zebra sutil en tablas. Los símbolos se limitan a
// Latin-1 (helvetica estándar de jsPDF no tiene ✓/⚠/emoji).
const NAVY: [number, number, number] = [26, 32, 66];
const ACCENT: [number, number, number] = [233, 69, 96];
const ZEBRA: [number, number, number] = [245, 246, 248];
const GRIS_TEXTO: [number, number, number] = [95, 99, 110];
const OK_VERDE: [number, number, number] = [46, 125, 50];
const ROJO: [number, number, number] = [198, 40, 40];
const AMBAR: [number, number, number] = [230, 126, 34];

export const generateQuotePDF = (
  canvasElement: HTMLCanvasElement,
  rooms: Room[],
  radiators: Radiator[],
  companyDetails: CompanyInfo,
  clientDetails: ClientInfo,
  _activePromotions: Promotion[],
  selectedBudget?: SelectedBudget | null,
  preloadedLogo?: string | null,
  floorHeating?: FloorHeatingBudget | null
): void => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const M = 15;               // margen horizontal
  const tableRight = pageWidth - M;
  let yPosition = 18;

  // ── Helpers de maquetación ────────────────────────────────────────────────
  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - 24) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Título de sección: barrita de acento + texto en azul noche
  const sectionTitle = (texto: string) => {
    ensureSpace(16);
    doc.setFillColor(...ACCENT);
    doc.rect(M, yPosition - 4, 1.6, 5.5, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(texto, M + 4.5, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
  };

  // Fila de encabezado de tabla: banda azul noche con texto blanco
  const tableHead = (cols: { texto: string; x: number; align?: 'left' | 'right' }[]) => {
    ensureSpace(10);
    doc.setFillColor(...NAVY);
    doc.rect(M, yPosition - 4.5, tableRight - M, 6.5, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    cols.forEach(c => doc.text(c.texto, c.x, yPosition, c.align === 'right' ? { align: 'right' } : undefined));
    doc.setTextColor(0, 0, 0);
    yPosition += 6;
  };

  // Fondo zebra de la fila actual (llamar antes de escribir el texto)
  let zebraToggle = false;
  const zebraRow = (alto = 5.5) => {
    ensureSpace(alto + 3);
    if (zebraToggle) {
      doc.setFillColor(...ZEBRA);
      doc.rect(M, yPosition - 4, tableRight - M, alto, 'F');
    }
    zebraToggle = !zebraToggle;
  };
  const resetZebra = () => { zebraToggle = false; };

  // === ENCABEZADO: LOGO + EMPRESA ===
  const logoBase64 = preloadedLogo || companyDetails.logo || '';
  const headerTop = yPosition;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', M, headerTop, 38, 24);
    } catch {
      // Logo inválido o corrupto — continuar sin logo en el PDF
    }
  }

  // Datos de la empresa alineados a la derecha (el logo queda solo a la izquierda)
  let yEmpresa = headerTop + 5;
  if (companyDetails.companyName) {
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(companyDetails.companyName, tableRight, yEmpresa, { align: 'right' });
    yEmpresa += 6;
  }
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRIS_TEXTO);
  for (const linea of [
    companyDetails.address,
    [companyDetails.phone && `Tel: ${companyDetails.phone}`, companyDetails.email]
      .filter(Boolean).join('  ·  '),
    companyDetails.website,
  ].filter(Boolean) as string[]) {
    doc.text(linea, tableRight, yEmpresa, { align: 'right' });
    yEmpresa += 4.2;
  }
  doc.setTextColor(0, 0, 0);

  yPosition = Math.max(yEmpresa, headerTop + (logoBase64 ? 26 : 0)) + 4;

  // Línea de acento que separa el encabezado
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(M, yPosition, tableRight, yPosition);
  yPosition += 8;

  // === BANDA DE TÍTULO: PRESUPUESTO + Nº, FECHA Y VALIDEZ ===
  const hoy = new Date();
  const nroPresupuesto = `P-${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
  const vencimiento = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);

  doc.setFillColor(...NAVY);
  doc.rect(M, yPosition - 5, tableRight - M, 13, 'F');
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PRESUPUESTO', M + 4, yPosition + 3.5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `N° ${nroPresupuesto}  ·  Fecha: ${hoy.toLocaleDateString('es-AR')}  ·  Válido hasta: ${vencimiento.toLocaleDateString('es-AR')}`,
    tableRight - 4, yPosition + 3.5, { align: 'right' }
  );
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // === DATOS DEL CLIENTE ===
  const clientText = clientDetails.name || 'Cliente Particular';
  const projectText = clientDetails.projectName || 'Proyecto Residencial';
  const contactInfo = [clientDetails.phone, clientDetails.email].filter(Boolean).join('  ·  ');

  const altoCliente = contactInfo ? 21 : 17;
  doc.setFillColor(...ZEBRA);
  doc.roundedRect(M, yPosition - 4, tableRight - M, altoCliente, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('PREPARADO PARA', M + 4, yPosition);
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(clientText, M + 4, yPosition + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Proyecto: ${projectText}`, M + 4, yPosition + 11);
  if (contactInfo) {
    doc.text(contactInfo, M + 4, yPosition + 15.5);
  }
  doc.setTextColor(0, 0, 0);
  yPosition += altoCliente + 6;

  // === IMAGEN DEL PLANO ===
  const canvasImage = canvasElement.toDataURL('image/png');
  const imgWidth = pageWidth - 2 * M;
  const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;

  ensureSpace(imgHeight + 4);
  doc.setDrawColor(210, 212, 218);
  doc.setLineWidth(0.3);
  doc.rect(M - 0.5, yPosition - 0.5, imgWidth + 1, imgHeight + 1);
  doc.addImage(canvasImage, 'PNG', M, yPosition, imgWidth, imgHeight);
  yPosition += imgHeight + 10;

  // === RESUMEN TÉRMICO POR AMBIENTE ===
  // La misma verificación del panel: requerido +15% de margen contra lo
  // instalado (radiadores + piso radiante con su base de cálculo propia).
  if (rooms.length > 0) {
    sectionTitle('RESUMEN TÉRMICO POR AMBIENTE');

    const cols = [
      { texto: 'Ambiente', x: M + 2 },
      { texto: 'Área', x: 96, align: 'right' as const },
      { texto: 'Requerido +15%', x: 130, align: 'right' as const },
      { texto: 'Instalado', x: 160, align: 'right' as const },
      { texto: 'Cobertura', x: tableRight - 2, align: 'right' as const },
    ];
    tableHead(cols);
    resetZebra();

    let hayAmbientesConPiso = false;
    doc.setFontSize(8.5);
    rooms.forEach((room) => {
      const zonasDelRoom = (floorHeating?.zonas ?? []).filter(z => z.roomId === room.id);
      const tienePiso = zonasDelRoom.length > 0;
      if (tienePiso) hayAmbientesConPiso = true;

      const radPower = room.radiatorIds.reduce((sum, id) => {
        const rad = radiators.find((r) => r.id === id);
        return sum + (rad?.power || 0);
      }, 0);
      // Piso: entrega máxima con el área real (misma cuenta que el panel)
      const pisoPower = tienePiso && floorHeating
        ? Math.round(room.area * floorHeating.emisionKcalhM2)
        : 0;
      const instalado = radPower + pisoPower;
      // Base del requerido: carga de piso (W/m² según aislación) si el
      // ambiente tiene piso radiante; si no, el factor volumétrico
      const requerido = Math.round(
        (tienePiso ? cargaPisoKcalh(room) : calculateRoomPower(room)) * MARGEN_SEGURIDAD
      );
      const tieneEmisores = instalado > 0;
      const pct = tieneEmisores && requerido > 0
        ? Math.round((instalado / requerido) * 100)
        : null;
      const ok = pct !== null && instalado >= requerido;

      zebraRow();
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const nombre = room.name.length > 32 ? room.name.substring(0, 32) + '...' : room.name;
      doc.text(`${nombre}${tienePiso ? ' *' : ''}`, M + 2, yPosition);
      doc.text(`${room.area.toLocaleString('es-AR')} m²`, 96, yPosition, { align: 'right' });
      doc.text(`${requerido.toLocaleString('es-AR')} kcal/h`, 130, yPosition, { align: 'right' });
      doc.text(
        tieneEmisores ? `${instalado.toLocaleString('es-AR')} kcal/h` : '—',
        160, yPosition, { align: 'right' }
      );
      if (pct === null) {
        doc.setTextColor(...GRIS_TEXTO);
        doc.text('sin emisores', tableRight - 2, yPosition, { align: 'right' });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(ok ? OK_VERDE : ROJO));
        doc.text(`${pct}% ${ok ? 'OK' : 'REVISAR'}`, tableRight - 2, yPosition, { align: 'right' });
      }
      doc.setTextColor(0, 0, 0);
      yPosition += 5.5;
    });

    if (hayAmbientesConPiso) {
      ensureSpace(6);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...GRIS_TEXTO);
      doc.text(
        '* Ambientes con piso radiante: carga de diseño en W/m² según aislación (EN 1264). Resto: factor volumétrico.',
        M, yPosition
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 5;
    }
    yPosition += 4;
  }

  // === EQUIPAMIENTO PRINCIPAL ===
  sectionTitle('EQUIPAMIENTO PRINCIPAL');
  const potenciaEmisores =
    calculateBoilerPower(radiators).totalRadiatorPower +
    (floorHeating?.potenciaTotalKcalh ?? 0);
  const calderaRecomendada = Math.round(potenciaEmisores / 0.80);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`• Radiadores: ${radiators.length} unidades`, M + 2, yPosition);
  yPosition += 5.5;
  doc.text(
    `• Caldera recomendada: ${calderaRecomendada.toLocaleString('es-AR')} Kcal/h ` +
    `(dimensionada para trabajar al 80% de su capacidad)`,
    M + 2, yPosition
  );
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // === PRESUPUESTO ESTIMADO DE INSTALACIÓN ===
  ensureSpace(50);
  sectionTitle('PRESUPUESTO ESTIMADO DE INSTALACIÓN');

  if (selectedBudget) {
    tableHead([
      { texto: 'Concepto', x: M + 2 },
      { texto: 'Cantidad', x: 128, align: 'right' },
      { texto: 'Subtotal', x: tableRight - 2, align: 'right' },
    ]);
    resetZebra();

    const addRow = (concepto: string, cantidad: string, precio: number) => {
      zebraRow();
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const cleanConcepto = concepto.length > 60 ? concepto.substring(0, 60) + '...' : concepto;
      doc.text(cleanConcepto, M + 2, yPosition);
      doc.text(cantidad, 128, yPosition, { align: 'right' });
      doc.text(
        `$ ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        tableRight - 2, yPosition, { align: 'right' }
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 5.5;
    };

    const { breakdown, totalCost } = selectedBudget;

    if (breakdown.boiler) {
      addRow(`Caldera ${breakdown.boiler.model.brand} ${breakdown.boiler.model.model}`, '1 un', breakdown.boiler.cost);
    }
    if (breakdown.radiators) {
      const { model, count, totalCost: radCost } = breakdown.radiators;
      addRow(`Radiadores ${model.brand} ${model.model} (${model.heightMm}mm)`, `${count} elem`, radCost);
    }
    if (breakdown.accessories && breakdown.accessories.length > 0) {
      breakdown.accessories.forEach(acc => {
        addRow(acc.model.name, `${acc.count} un`, acc.totalCost);
      });
    }

    // Caja de total con el color de acento
    ensureSpace(14);
    yPosition += 2;
    doc.setFillColor(...NAVY);
    doc.rect(M, yPosition - 4.5, tableRight - M, 9, 'F');
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL ESTIMADO (instalación por radiadores)', M + 3, yPosition + 1);
    doc.text(
      `$ ${totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      tableRight - 3, yPosition + 1, { align: 'right' }
    );
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  } else {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRIS_TEXTO);
    doc.text('Detalle de costos no disponible en esta vista preliminar.', M, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  }

  // === PISO RADIANTE — CIRCUITOS REALES Y MATERIALES ===
  if (floorHeating && floorHeating.circuits.length > 0) {
    ensureSpace(60);
    yPosition += 4;
    sectionTitle('PISO RADIANTE');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(
      `Superficie: ${floorHeating.areaM2.toLocaleString('es-AR')} m²  ·  ` +
      `Circuitos: ${floorHeating.circuits.length}  ·  ` +
      `Tubería: ${floorHeating.longitudTotalM.toLocaleString('es-AR')} m  ·  ` +
      `Potencia: hasta ${floorHeating.potenciaTotalKcalh.toLocaleString('es-AR')} kcal/h (impulsión ${floorHeating.tempImpulsionC}°C)`,
      M, yPosition
    );
    doc.setTextColor(0, 0, 0);
    yPosition += 7;

    // --- Tabla de circuitos (como los planos de obra) ---
    tableHead([
      { texto: 'Circuito', x: M + 2 },
      { texto: 'Paso', x: 92, align: 'right' },
      { texto: 'Serpentín', x: 122, align: 'right' },
      { texto: 'Acometida', x: 155, align: 'right' },
      { texto: 'Total', x: tableRight - 2, align: 'right' },
    ]);
    resetZebra();

    let hayExcedidos = false;
    floorHeating.circuits.forEach((c: FloorHeatingCircuit) => {
      zebraRow();
      if (c.excedeLimite) hayExcedidos = true;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(`${c.zoneName} — ${c.etiqueta}`, M + 2, yPosition);
      doc.text(`c/c ${c.pasoCm * 10} mm`, 92, yPosition, { align: 'right' });
      doc.text(`${c.longitudSerpentin.toLocaleString('es-AR')} m`, 122, yPosition, { align: 'right' });
      doc.text(`${c.longitudAcometida.toLocaleString('es-AR')} m`, 155, yPosition, { align: 'right' });
      if (c.excedeLimite) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ROJO);
      }
      doc.text(
        `${c.longitudTotal.toLocaleString('es-AR')} m${c.excedeLimite ? ' (*)' : ''}`,
        tableRight - 2, yPosition, { align: 'right' }
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 5.5;
    });

    if (hayExcedidos) {
      ensureSpace(6);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...ROJO);
      doc.text(`(*) El circuito supera los 120 m recomendados para PE-X 20mm — revisar el diseño.`, M, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
    }

    // --- Potencia térmica por zona/habitación ---
    ensureSpace(20);
    yPosition += 3;
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Potencia térmica por habitación', M, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    floorHeating.zonas.forEach(z => {
      ensureSpace(5);
      const requerido = z.requeridoConMargenKcalh !== null
        ? ` — requiere ${z.requeridoConMargenKcalh.toLocaleString('es-AR')} kcal/h (margen 15% incluido) — cubre ${z.coberturaPct}% ` +
          `${z.suficiente ? '(OK)' : '(INSUFICIENTE: ver consideraciones)'}`
        : '';
      doc.setTextColor(...(z.suficiente === false ? ROJO : z.suficiente === true ? OK_VERDE : GRIS_TEXTO));
      doc.text(
        `• ${z.zoneName}: ${z.areaM2.toLocaleString('es-AR')} m² — entrega hasta ${z.potenciaKcalh.toLocaleString('es-AR')} kcal/h${requerido}`,
        M + 2, yPosition
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 5;
    });
    ensureSpace(5);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(
      `Cálculo con agua de impulsión a ${floorHeating.tempImpulsionC}°C (suelo pétreo, EN 1264): el piso entrega ${floorHeating.emisionKcalhM2} kcal/h·m² — ` +
      `aprox. ${Math.round(floorHeating.emisionKcalhM2 / 5)} kcal/h por metro de tubo a paso 20 y ${Math.round(floorHeating.emisionKcalhM2 / 6.7)} a paso 15.`,
      M, yPosition
    );
    doc.setTextColor(0, 0, 0);
    yPosition += 7;

    // --- Montantes caldera → colector (primaria Ø32) ---
    if (floorHeating.montantes.length > 0) {
      doc.setFontSize(8.5);
      floorHeating.montantes.forEach((m: Montante) => {
        ensureSpace(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(`Montante caldera - colector (Ø${m.diametroMm} mm, aislada por contrapiso)`, M + 2, yPosition);
        doc.text(`${m.longitudTotal.toLocaleString('es-AR')} m`, tableRight - 2, yPosition, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPosition += 5.5;
      });
    }

    // --- Materiales de piso radiante ---
    ensureSpace(34);
    yPosition += 3;
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Materiales de piso radiante', M, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;

    tableHead([
      { texto: 'Concepto', x: M + 2 },
      { texto: 'Cantidad', x: 128, align: 'right' },
      { texto: 'Subtotal', x: tableRight - 2, align: 'right' },
    ]);
    resetZebra();

    floorHeating.resumen.items.forEach(item => {
      zebraRow();
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const nombre = item.nombre.length > 60 ? item.nombre.substring(0, 60) + '...' : item.nombre;
      doc.text(nombre, M + 2, yPosition);
      doc.text(`${item.cantidad} ${item.unidad}`, 128, yPosition, { align: 'right' });
      doc.text(
        `USD ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        tableRight - 2, yPosition, { align: 'right' }
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 5.5;
    });

    ensureSpace(16);
    yPosition += 2;
    doc.setFillColor(...NAVY);
    doc.rect(M, yPosition - 4.5, tableRight - M, 9, 'F');
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SUBTOTAL PISO RADIANTE (USD)', M + 3, yPosition + 1);
    doc.text(
      `USD ${floorHeating.resumen.totalFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      tableRight - 3, yPosition + 1, { align: 'right' }
    );
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRIS_TEXTO);
    doc.text('Precios de catálogo de referencia en USD — no incluidos en el total de instalación por radiadores.', M, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 5;
  }

  // === CONSIDERACIONES TÉCNICAS DEL DISEÑO ===
  // Generadas automáticamente desde el diseño real (cobertura, circuitos,
  // sistema mixto) más las buenas prácticas de obra de Criterio Térmico.
  const consideraciones = generarConsideraciones({
    rooms,
    radiators,
    floorHeating: floorHeating ?? null,
    boilerTipo: selectedBudget?.breakdown.boiler?.model.tipoTiro ?? null,
  });

  if (consideraciones.length > 0) {
    ensureSpace(40);
    yPosition += 4;
    sectionTitle('CONSIDERACIONES TÉCNICAS DEL DISEÑO');

    const colorNivel: Record<Consideracion['nivel'], [number, number, number]> = {
      critica: ROJO,
      atencion: AMBAR,
      recomendacion: NAVY,
    };
    const etiquetaNivel: Record<Consideracion['nivel'], string> = {
      critica: 'RESOLVER',
      atencion: 'ATENCIÓN',
      recomendacion: 'BUENA PRÁCTICA',
    };

    consideraciones.forEach(c => {
      const detalle = doc.splitTextToSize(c.detalle, pageWidth - 2 * M - 6);
      const alto = 6 + detalle.length * 3.8 + 3;
      ensureSpace(alto);

      // Marcador lateral del nivel
      doc.setFillColor(...colorNivel[c.nivel]);
      doc.rect(M, yPosition - 3, 1.2, alto - 4, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorNivel[c.nivel]);
      doc.text(`[${etiquetaNivel[c.nivel]}]`, M + 4, yPosition);
      const anchoEtiqueta = doc.getTextWidth(`[${etiquetaNivel[c.nivel]}]`);
      doc.setTextColor(...NAVY);
      doc.text(c.titulo, M + 4 + anchoEtiqueta + 2, yPosition, { maxWidth: pageWidth - 2 * M - anchoEtiqueta - 10 });
      yPosition += 4.5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.text(detalle, M + 4, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += detalle.length * 3.8 + 4;
    });
  }

  // === LEYENDA DE CIERRE ===
  ensureSpace(18);
  yPosition += 3;
  doc.setDrawColor(200, 202, 210);
  doc.setLineWidth(0.3);
  doc.line(M, yPosition, pageWidth - M, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRIS_TEXTO);
  const closingText = 'Este presupuesto preliminar es el resultado de un cálculo de ingeniería basado en el plano provisto. ' +
    'Los valores definitivos se confirman con el relevamiento en obra. Ante cualquier consulta sobre las consideraciones ' +
    'técnicas indicadas, contacte a nuestro equipo.';
  const splitText = doc.splitTextToSize(closingText, pageWidth - 2 * M);
  doc.text(splitText, M, yPosition);
  doc.setTextColor(0, 0, 0);

  // === PIE DE PÁGINA EN TODAS LAS HOJAS ===
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(M, pageHeight - 13, pageWidth - M, pageHeight - 13);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(
      [companyDetails.companyName, companyDetails.phone].filter(Boolean).join('  ·  ') || 'Presupuesto de calefacción',
      M, pageHeight - 8.5
    );
    doc.text('Generado con Criterio Térmico', pageWidth / 2, pageHeight - 8.5, { align: 'center' });
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - M, pageHeight - 8.5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }


  // === DESCARGA (100% SINCRÓNICA — probada en diagnóstico) ===
  const safeProjectName = clientDetails.projectName ? clientDetails.projectName.replace(/\s+/g, '_') : 'Proyecto';
  const fileName = `Presupuesto_${safeProjectName}_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`;

  const pdfBlob = doc.output('blob');
  // Direct synchronous download — NO setTimeout, NO dispatchEvent
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();                    // ← sync click in user gesture stack
  document.body.removeChild(link); // ← cleanup immediately after click
  // Revoke URL later so browser has time to complete download
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// ============================================================
// PLANO TÉCNICO A4 APAISADO
// ============================================================
export const generateFloorPlanPDF = (
  backgroundImage: string,
  backgroundImageDimensions: { width: number; height: number },
  backgroundImageOffset: { x: number; y: number },
  radiators: Radiator[],
  pipes: PipeSegment[],
  boilers: Boiler[],
  rooms: Room[],
  companyDetails: CompanyInfo,
  clientDetails: ClientInfo,
  currentFloor: 'ground' | 'first',
  floorHeatingZones: FloorHeatingZone[] = [],
  floorHeatingCircuits: FloorHeatingCircuit[] = [],
  manifolds: Manifold[] = [],
  montantes: Montante[] = []
): void => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW = 297;
  const pageH = 210;
  const mH = 10;          // horizontal margin
  const mTop = 10;        // top margin
  const titleH = 38;      // title block height at bottom

  const drawW = pageW - 2 * mH;          // 277mm
  const drawH = pageH - mTop - titleH;   // 162mm

  const imgW = backgroundImageDimensions.width;
  const imgH = backgroundImageDimensions.height;

  // Scale to fit maintaining aspect ratio
  const scale = Math.min(drawW / imgW, drawH / imgH);
  const pdfImgW = imgW * scale;
  const pdfImgH = imgH * scale;

  // Center image in draw area
  const imgX = mH + (drawW - pdfImgW) / 2;
  const imgY = mTop + (drawH - pdfImgH) / 2;

  // Map canvas coordinates → PDF coordinates
  const toPdfX = (cx: number) => imgX + (cx - backgroundImageOffset.x) * scale;
  const toPdfY = (cy: number) => imgY + (cy - backgroundImageOffset.y) * scale;

  // --- 1. Background floor plan image ---
  const imgFormat = backgroundImage.startsWith('data:image/jpeg') || backgroundImage.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
  doc.addImage(backgroundImage, imgFormat, imgX, imgY, pdfImgW, pdfImgH);

  // --- 2. Pipes ---
  const currentFloorPipes = pipes.filter(p => p.floor === currentFloor || p.floor === 'vertical');
  currentFloorPipes.forEach(pipe => {
    if (!pipe.points || pipe.points.length < 2) return;
    const isSupply = pipe.pipeType === 'supply';

    doc.setLineWidth(0.6);
    if (isSupply) {
      doc.setDrawColor(190, 30, 30);
    } else {
      doc.setDrawColor(30, 90, 200);
    }

    for (let i = 0; i < pipe.points.length - 1; i++) {
      doc.line(
        toPdfX(pipe.points[i].x), toPdfY(pipe.points[i].y),
        toPdfX(pipe.points[i + 1].x), toPdfY(pipe.points[i + 1].y)
      );
    }

    // Diameter label at midpoint — only supply to avoid duplicating text
    if (isSupply && pipe.diameter) {
      const mid = Math.floor((pipe.points.length - 1) / 2);
      const mx = toPdfX((pipe.points[mid].x + pipe.points[mid + 1].x) / 2);
      const my = toPdfY((pipe.points[mid].y + pipe.points[mid + 1].y) / 2);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(140, 20, 20);
      doc.text(`Ø${pipe.diameter}`, mx, my - 1.2);
    }
  });

  // --- 2.5 Piso radiante: montantes, zonas, serpentines y colectores ---
  const drawCircuitPolyline = (pts: { x: number; y: number }[], r: number, g: number, b: number, w = 0.35) => {
    if (pts.length < 2) return;
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(w);
    for (let i = 0; i < pts.length - 1; i++) {
      doc.line(toPdfX(pts[i].x), toPdfY(pts[i].y), toPdfX(pts[i + 1].x), toPdfY(pts[i + 1].y));
    }
  };

  // Montantes caldera→colector primero: capa inferior, trazo punteado grueso
  // (van aisladas por el contrapiso, debajo de las placas y los circuitos)
  montantes.forEach(m => {
    doc.setLineDashPattern([2.5, 1.2], 0);
    drawCircuitPolyline(m.ida, 139, 0, 0, 0.7);
    drawCircuitPolyline(m.retorno, 13, 71, 161, 0.7);
    doc.setLineDashPattern([], 0);

    const texto = `Montante Ø${m.diametroMm} · ${Math.round(m.longitudTotal)} m`;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    const tw = doc.getTextWidth(texto);
    const lx = toPdfX(m.labelPos.x);
    const ly = toPdfY(m.labelPos.y);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(lx - 0.8, ly - 2.4, tw + 1.6, 3.4, 'FD');
    doc.setTextColor(139, 0, 0);
    doc.text(texto, lx, ly);
  });

  floorHeatingZones.forEach(zone => {
    doc.setDrawColor(230, 126, 34);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.rect(toPdfX(zone.x), toPdfY(zone.y), zone.width * scale, zone.height * scale);
    doc.setLineDashPattern([], 0);
  });

  floorHeatingCircuits.forEach(c => {
    drawCircuitPolyline(c.acometidaIda, 190, 30, 30);
    drawCircuitPolyline(c.acometidaRetorno, 30, 90, 200);
    drawCircuitPolyline(c.ida, 190, 30, 30);
    // Conexión central ida → retorno (violeta, igual que en el canvas)
    if (c.ida.length > 0 && c.retorno.length > 0) {
      drawCircuitPolyline([c.ida[c.ida.length - 1], c.retorno[0]], 142, 36, 170);
    }
    drawCircuitPolyline(c.retorno, 30, 90, 200);

    // Etiqueta "Zona 1 C1 · 62 m · c/c 150 mm · 645 kcal/h" con fondo blanco
    const potenciaTxt = c.cargaKcalh != null ? `carga ${c.cargaKcalh}` : `${c.potenciaKcalh}`;
    const texto = `${c.zoneName} ${c.etiqueta} · ${Math.round(c.longitudTotal)} m · c/c ${c.pasoCm * 10} mm · ${potenciaTxt} kcal/h`;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    const tw = doc.getTextWidth(texto);
    const lx = toPdfX(c.labelPos.x);
    const ly = toPdfY(c.labelPos.y);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(c.excedeLimite ? 190 : 150, c.excedeLimite ? 30 : 150, c.excedeLimite ? 30 : 150);
    doc.setLineWidth(0.2);
    doc.rect(lx - 0.8, ly - 2.4, tw + 1.6, 3.4, 'FD');
    doc.setTextColor(c.excedeLimite ? 190 : 40, c.excedeLimite ? 30 : 40, c.excedeLimite ? 30 : 40);
    doc.text(texto, lx, ly);
  });

  manifolds.forEach(manifold => {
    const mx = toPdfX(manifold.x);
    const my = toPdfY(manifold.y);
    const mw = manifold.width * scale;
    const mh = manifold.height * scale;

    doc.setFillColor(96, 125, 139);
    doc.setDrawColor(55, 71, 79);
    doc.setLineWidth(0.3);
    doc.rect(mx, my, mw, mh, 'FD');

    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('COLECTOR', mx + mw / 2, my + mh / 2 + 1, { align: 'center' });
  });

  // --- 3. Radiators ---
  const currentFloorRadiators = radiators.filter(r => r.floor === currentFloor);
  currentFloorRadiators.forEach(rad => {
    const rx = toPdfX(rad.x);
    const ry = toPdfY(rad.y);
    const rw = rad.width * scale;
    const rh = rad.height * scale;

    doc.setFillColor(215, 70, 70);
    doc.setDrawColor(160, 25, 25);
    doc.setLineWidth(0.3);
    doc.rect(rx, ry, rw, rh, 'FD');

    if (rad.power > 0) {
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${Math.round(rad.power)}`, rx + rw / 2, ry + rh / 2 + 1.5, { align: 'center' });
    }
  });

  // --- 4. Boilers ---
  const currentFloorBoilers = boilers.filter(b => !b.floor || b.floor === currentFloor);
  currentFloorBoilers.forEach(boiler => {
    const bx = toPdfX(boiler.x);
    const by = toPdfY(boiler.y);
    const bw = boiler.width * scale;
    const bh = boiler.height * scale;

    doc.setFillColor(255, 140, 0);
    doc.setDrawColor(180, 90, 0);
    doc.setLineWidth(0.3);
    doc.rect(bx, by, bw, bh, 'FD');

    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 30, 0);
    doc.text('CAL', bx + bw / 2, by + bh / 2 + 1.5, { align: 'center' });
  });

  // --- 5. Room labels (centroid of assigned radiators) ---
  rooms.forEach(room => {
    const assigned = currentFloorRadiators.filter(r => room.radiatorIds.includes(r.id));
    if (assigned.length === 0) return;

    const cx = assigned.reduce((s, r) => s + r.x + r.width / 2, 0) / assigned.length;
    const cy = assigned.reduce((s, r) => s + r.y + r.height / 2, 0) / assigned.length;
    const px = toPdfX(cx);
    const py = toPdfY(cy);

    const totalPower = assigned.reduce((s, r) => s + r.power, 0);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(room.name, px, py - 8, { align: 'center' });

    if (totalPower > 0) {
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`${Math.round(totalPower)} Kcal/h`, px, py - 4.5, { align: 'center' });
    }
  });

  // --- 6. Legend (top-right) ---
  const legX = pageW - mH - 50;
  const legY = mTop + 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.rect(legX, legY, 48, 22, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REFERENCIAS', legX + 24, legY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);

  doc.setDrawColor(190, 30, 30);
  doc.setLineWidth(0.7);
  doc.line(legX + 2, legY + 8.5, legX + 9, legY + 8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Tubería IDA', legX + 11, legY + 9.5);

  doc.setDrawColor(30, 90, 200);
  doc.line(legX + 2, legY + 13, legX + 9, legY + 13);
  doc.text('Tubería Retorno', legX + 11, legY + 14);

  doc.setFillColor(215, 70, 70);
  doc.setDrawColor(160, 25, 25);
  doc.setLineWidth(0.3);
  doc.rect(legX + 2, legY + 16.5, 7, 3.5, 'FD');
  doc.setTextColor(0, 0, 0);
  doc.text('Radiador (Kcal/h)', legX + 11, legY + 19);

  // --- 7. Title block ---
  const tbY = pageH - titleH;
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.line(mH, tbY, pageW - mH, tbY);

  // Left: company + project
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(companyDetails.companyName || 'Instalador', mH, tbY + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proyecto: ${clientDetails.projectName || clientDetails.name || 'Sin nombre'}`, mH, tbY + 13);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, mH, tbY + 19);

  if (companyDetails.phone) {
    doc.text(`Tel: ${companyDetails.phone}`, mH, tbY + 25);
  }

  // Center: plan title + scale
  const floorLabel = currentFloor === 'ground' ? 'PLANTA BAJA' : 'PRIMER PISO';
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`PLANO TÉCNICO — ${floorLabel}`, pageW / 2, tbY + 8, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Escala referencial 1:100 aprox. — Impreso en A4', pageW / 2, tbY + 14, { align: 'center' });

  // Disclaimer
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(110, 110, 110);
  const disclaimer = doc.splitTextToSize(
    'NOTA: El recorrido de tuberías indicado es una sugerencia de diseño con fines presupuestarios. ' +
    'El instalador determinará el recorrido definitivo en obra según las condiciones reales del inmueble.',
    pageW / 2 - 10
  );
  doc.text(disclaimer, pageW / 2, tbY + 21, { align: 'center' });

  // Right: generated by
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Generado con Criterio Térmico', pageW - mH, tbY + 7, { align: 'right' });
  doc.text('criteriotermico.com.ar', pageW - mH, tbY + 12, { align: 'right' });

  // --- 8. Download ---
  const safeName = (clientDetails.projectName || 'Proyecto').replace(/\s+/g, '_');
  const fileName = `Plano_${safeName}_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`;

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
