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
import { calculateBoilerPower } from './thermalCalculator';
import type { SelectedBudget } from '../services/budgetService';

interface MaterialSummary {
  radiatorCount: number;
  boilerPower: number;
}

const calculateMaterials = (radiators: Radiator[]): MaterialSummary => {
  const boilerData = calculateBoilerPower(radiators);

  return {
    radiatorCount: radiators.length,
    boilerPower: boilerData.recommendedBoilerPower,
  };
};

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
  let yPosition = 20;

  // === HEADER CON LOGO Y DATOS DE EMPRESA ===
  const logoBase64 = preloadedLogo || companyDetails.logo || '';

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', 15, yPosition, 40, 25);
    } catch {
      // Logo inválido o corrupto — continuar sin logo en el PDF
    }
  }

  if (companyDetails.companyName) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyDetails.companyName, companyDetails.logo ? 60 : 15, yPosition + 5);
    yPosition += 8;
  }

  if (companyDetails.address || companyDetails.phone || companyDetails.email) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (companyDetails.address) {
      doc.text(companyDetails.address, companyDetails.logo ? 60 : 15, yPosition);
      yPosition += 4;
    }
    if (companyDetails.phone) {
      doc.text(`Tel: ${companyDetails.phone}`, companyDetails.logo ? 60 : 15, yPosition);
      yPosition += 4;
    }
    if (companyDetails.email) {
      doc.text(`Email: ${companyDetails.email}`, companyDetails.logo ? 60 : 15, yPosition);
      yPosition += 4;
    }
    if (companyDetails.website) {
      doc.text(companyDetails.website, companyDetails.logo ? 60 : 15, yPosition);
    }
  }

  yPosition += 15;

  // === DATOS DEL CLIENTE (NUEVO) ===
  doc.setDrawColor(200);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SOLICITADO POR:', 15, yPosition);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const clientText = clientDetails.name || 'Cliente Particular';
  const projectText = clientDetails.projectName ? `Proyecto: ${clientDetails.projectName}` : 'Proyecto Residencial';

  doc.text(clientText, 60, yPosition);
  yPosition += 5;

  doc.text(projectText, 60, yPosition);
  if (clientDetails.email || clientDetails.phone) {
    yPosition += 5;
    const contactInfo = [clientDetails.phone, clientDetails.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, 60, yPosition);
  }

  yPosition += 15;

  // === TÍTULO DEL PRESUPUESTO ===
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(9);
  const today = new Date().toLocaleDateString('es-AR');
  doc.text(`Fecha: ${today}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // === IMAGEN DEL PLANO ===
  const canvasImage = canvasElement.toDataURL('image/png');
  const imgWidth = pageWidth - 30;
  const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;

  if (yPosition + imgHeight > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  }

  doc.addImage(canvasImage, 'PNG', 15, yPosition, imgWidth, imgHeight);
  yPosition += imgHeight + 10;

  // === RESUMEN DE HABITACIONES ===
  if (yPosition + 40 > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE HABITACIONES', 15, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  rooms.forEach((room) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }

    const volume = room.area * room.height;
    const radiatorCount = room.radiatorIds.length;
    const installedPower = radiatorCount > 0
      ? room.radiatorIds.reduce((sum, id) => {
        const rad = radiators.find((r) => r.id === id);
        return sum + (rad?.power || 0);
      }, 0)
      : 0;

    doc.text(`• ${room.name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`  Área: ${room.area} m² × ${room.height} m = ${volume.toFixed(1)} m³`, 25, yPosition);
    yPosition += 4;
    doc.text(`  Factor térmico: ${room.thermalFactor} Kcal/h·m³`, 25, yPosition);
    yPosition += 4;
    doc.text(`  Radiadores instalados: ${radiatorCount} (${installedPower.toLocaleString('es-AR')} Kcal/h)`, 25, yPosition);
    yPosition += 7;
  });

  // === LISTADO DE MATERIALES ===
  if (yPosition + 40 > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTADO DE MATERIALES', 15, yPosition);
  yPosition += 8;

  const materials = calculateMaterials(radiators);

  if (yPosition > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Radiadores: ${materials.radiatorCount} unidades`, 20, yPosition);
  yPosition += 5;

  doc.text(`• Caldera recomendada: ${materials.boilerPower.toLocaleString('es-AR')} Kcal/h`, 20, yPosition);
  yPosition += 10;

  // === PRESUPUESTO DETALLADO DE INSTALACIÓN ===

  if (yPosition + 60 > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  } else {
    yPosition += 15;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PRESUPUESTO ESTIMADO DE INSTALACIÓN', 15, yPosition);
  yPosition += 10;

  if (selectedBudget) {
    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Concepto', 15, yPosition);
    doc.text('Cantidad', 110, yPosition);
    doc.text('Subtotal', 160, yPosition);

    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');

    const addRow = (concepto: string, cantidad: string, precio: number) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      const cleanConcepto = concepto.length > 55 ? concepto.substring(0, 55) + '...' : concepto;
      doc.text(cleanConcepto, 15, yPosition);
      doc.text(cantidad, 110, yPosition);
      doc.text(`$${precio.toFixed(2)}`, 160, yPosition);
      yPosition += 6;
    };

    const { breakdown, totalCost } = selectedBudget;

    // Boiler
    if (breakdown.boiler) {
      addRow(`Caldera: ${breakdown.boiler.model.brand} ${breakdown.boiler.model.model}`, '1 un', breakdown.boiler.cost);
    }

    // Radiators
    if (breakdown.radiators) {
      const { model, count, totalCost: radCost } = breakdown.radiators;
      addRow(`Radiadores: ${model.brand} ${model.model} (${model.heightMm}mm)`, `${count} elem`, radCost);
    }

    // Accessories
    if (breakdown.accessories && breakdown.accessories.length > 0) {
      breakdown.accessories.forEach(acc => {
        addRow(acc.model.name, `${acc.count} un`, acc.totalCost);
      });
    }

    yPosition += 4;
    doc.line(110, yPosition, 195, yPosition);
    yPosition += 6;

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL FINAL ESTIMADO:', 80, yPosition, { align: 'right' });
    doc.text(`$${totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 160, yPosition);

  } else {
    // FALLBACK message
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Detalle de costos no disponible en esta vista preliminar.', 15, yPosition);
    yPosition += 10;
  }

  // === PISO RADIANTE — CIRCUITOS REALES Y MATERIALES ===
  if (floorHeating && floorHeating.circuits.length > 0) {
    if (yPosition + 60 > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 14;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PISO RADIANTE', 15, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Superficie cubierta: ${floorHeating.areaM2.toLocaleString('es-AR')} m²  —  ` +
      `Circuitos: ${floorHeating.circuits.length}  —  ` +
      `Tubería total: ${floorHeating.longitudTotalM.toLocaleString('es-AR')} m  —  ` +
      `Potencia: hasta ${floorHeating.potenciaTotalKcalh.toLocaleString('es-AR')} kcal/h (impulsión ${floorHeating.tempImpulsionC}°C)`,
      15, yPosition
    );
    yPosition += 8;

    // --- Tabla de circuitos (como los planos de obra) ---
    const ensureSpace = (needed: number) => {
      if (yPosition + needed > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Circuito', 15, yPosition);
    doc.text('Paso', 80, yPosition);
    doc.text('Serpentín', 105, yPosition);
    doc.text('Acometida', 135, yPosition);
    doc.text('Total', 168, yPosition);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');

    let hayExcedidos = false;
    floorHeating.circuits.forEach((c: FloorHeatingCircuit) => {
      ensureSpace(6);
      if (c.excedeLimite) hayExcedidos = true;
      doc.text(`${c.zoneName} — C${c.numero}`, 15, yPosition);
      doc.text(`c/c ${c.pasoCm * 10} mm`, 80, yPosition);
      doc.text(`${c.longitudSerpentin.toLocaleString('es-AR')} m`, 105, yPosition);
      doc.text(`${c.longitudAcometida.toLocaleString('es-AR')} m`, 135, yPosition);
      doc.text(`${c.longitudTotal.toLocaleString('es-AR')} m${c.excedeLimite ? ' (*)' : ''}`, 168, yPosition);
      yPosition += 6;
    });

    if (hayExcedidos) {
      ensureSpace(6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(180, 30, 30);
      doc.text('(*) El circuito supera los 120 m recomendados para PE-X 20mm — revisar el diseño.', 15, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
    }

    // --- Potencia térmica por zona/habitación ---
    ensureSpace(20);
    yPosition += 4;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Potencia térmica por habitación', 15, yPosition);
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    floorHeating.zonas.forEach(z => {
      ensureSpace(5);
      const requerido = z.requeridoConMargenKcalh !== null
        ? ` — requiere ${z.requeridoConMargenKcalh.toLocaleString('es-AR')} kcal/h (incluye margen 15%) — cubre ${z.coberturaPct}% ` +
          `${z.suficiente ? '(OK)' : '(INSUFICIENTE: subir impulsión, paso 15, ampliar zona o revisar aislación)'}`
        : '';
      if (z.suficiente === false) doc.setTextColor(180, 30, 30);
      doc.text(
        `• ${z.zoneName}: ${z.areaM2.toLocaleString('es-AR')} m² — entrega hasta ${z.potenciaKcalh.toLocaleString('es-AR')} kcal/h${requerido}`,
        18, yPosition
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 5;
    });
    ensureSpace(5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Cálculo con agua de impulsión a ${floorHeating.tempImpulsionC}°C (suelo pétreo, EN 1264): el piso entrega ${floorHeating.emisionKcalhM2} kcal/h·m² — ` +
      `aprox. ${Math.round(floorHeating.emisionKcalhM2 / 5)} kcal/h por metro de tubo a paso 20 y ${Math.round(floorHeating.emisionKcalhM2 / 6.7)} a paso 15.`,
      15, yPosition
    );
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    yPosition += 7;

    // --- Montantes caldera → colector (primaria Ø32) ---
    if (floorHeating.montantes.length > 0) {
      doc.setFontSize(10);
      floorHeating.montantes.forEach((m: Montante) => {
        ensureSpace(6);
        doc.setFont('helvetica', 'normal');
        doc.text(`Montante caldera - colector (Ø${m.diametroMm} mm, aislada por contrapiso)`, 15, yPosition);
        doc.text(`${m.longitudTotal.toLocaleString('es-AR')} m`, 168, yPosition);
        yPosition += 6;
      });
    }

    // --- Materiales de piso radiante ---
    ensureSpace(30);
    yPosition += 4;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Materiales de piso radiante', 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.text('Concepto', 15, yPosition);
    doc.text('Cantidad', 110, yPosition);
    doc.text('Subtotal', 160, yPosition);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');

    floorHeating.resumen.items.forEach(item => {
      ensureSpace(6);
      const nombre = item.nombre.length > 55 ? item.nombre.substring(0, 55) + '...' : item.nombre;
      doc.text(nombre, 15, yPosition);
      doc.text(`${item.cantidad} ${item.unidad}`, 110, yPosition);
      doc.text(`$${item.subtotal.toFixed(2)}`, 160, yPosition);
      yPosition += 6;
    });

    ensureSpace(12);
    yPosition += 2;
    doc.line(110, yPosition, 195, yPosition);
    yPosition += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBTOTAL PISO RADIANTE (USD):', 105, yPosition, { align: 'right' });
    doc.text(
      `$${floorHeating.resumen.totalFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      160, yPosition
    );
    yPosition += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 110, 110);
    doc.text('Precios de catálogo de referencia en USD — no incluidos en el total de instalación por radiadores.', 15, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 5;
  }

  // === LEYENDA DE CIERRE (Fase 3 - Pruebas de Confianza) ===
  const pageHeightFinal = doc.internal.pageSize.getHeight();

  // Asegurar que estamos al final o pie de página
  if (yPosition < pageHeightFinal - 40) {
    yPosition = pageHeightFinal - 40;
  } else {
    doc.addPage();
    yPosition = pageHeightFinal - 40;
  }

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);

  const closingText = "Este presupuesto preliminar es el resultado de un cálculo de ingeniería avanzado. Para iniciar la fase de diseño definitivo y validar las eficiencias, por favor, póngase en contacto con nuestro equipo de especialistas.";
  const splitText = doc.splitTextToSize(closingText, pageWidth - 30);
  doc.text(splitText, 15, yPosition);


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
    const texto = `${c.zoneName} C${c.numero} · ${Math.round(c.longitudTotal)} m · c/c ${c.pasoCm * 10} mm · ${c.potenciaKcalh} kcal/h`;
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
