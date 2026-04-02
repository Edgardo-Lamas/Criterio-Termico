import jsPDF from 'jspdf';
import type { Room } from '../models/Room';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';
import type { CompanyInfo, Promotion, ClientInfo } from '../stores/companyStore';
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
  preloadedLogo?: string | null
): void => {
  console.log('📄 [PDF] Starting PDF generation (SYNC)...');

  try {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // === HEADER CON LOGO Y DATOS DE EMPRESA ===
    const logoBase64 = preloadedLogo || companyDetails.logo || '';

    if (logoBase64) {
      try {
        console.log('📄 [PDF] Adding logo image to PDF...');
        doc.addImage(logoBase64, 'JPEG', 15, yPosition, 40, 25);
        console.log('📄 [PDF] Logo added successfully');
      } catch (e) {
        console.error('📄 [PDF] Error al agregar logo:', e);
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
    console.log('📄 [PDF] Blob size:', pdfBlob.size, 'bytes');

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

    console.log('📄 [PDF] ✅ Download triggered:', fileName);
  } catch (error) {
    console.error('📄 [PDF] Error:', error);
    throw error;
  }
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
  currentFloor: 'ground' | 'first'
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
