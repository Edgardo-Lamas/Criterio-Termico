import { useRef, useState, useEffect, useMemo } from 'react';
import { useToolsStore } from '../../store/useToolsStore';
import { useElementsStore } from '../../store/useElementsStore';
import { useCanvasZoom } from './hooks/useCanvasZoom';
import type { Radiator } from '../../models/Radiator';
import type { Boiler } from '../../models/Boiler';
import type { Manifold } from '../../models/Manifold';
import type { FloorHeatingZone } from '../../models/FloorHeatingZone';
import { CATALOG } from '../../data/catalog';
import { isPointNearPipe } from '../../utils/geometry';
import { calcularCircuitosPlanta, calcularMontantes, circuitosPorColector, MAX_CIRCUITOS_POR_COLECTOR, TEMPERATURAS_IMPULSION, emisionKcalhM2, cargaPisoKcalh, crearPuerta, puntoPuerta } from '../../utils/floorHeating';
import { etiquetasRadiadores } from '../../utils/planilla';
import { MARGEN_SEGURIDAD } from '../../utils/floorHeatingBudget';
import type { FloorHeatingCircuit, Montante, CanvasPoint } from '../../utils/floorHeating';




// Las etiquetas de circuito aparecen recién después de mantener el cursor
// sobre el serpentín este tiempo: el plano queda limpio mientras se recorre.
const HOVER_ETIQUETA_MS = 2000;

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pipeStartElement, setPipeStartElement] = useState<{ id: string, type: 'radiator' | 'boiler' } | null>(null);
  // Rectángulo en construcción para zonas de piso radiante (arrastre)
  const [zoneDraft, setZoneDraft] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  // Zona a la que se le está marcando la puerta (modo "click en el borde")
  const [placingDoorZoneId, setPlacingDoorZoneId] = useState<string | null>(null);
  // Zona cuya puerta se está arrastrando (se pega al borde, como un radiador)
  const [draggingDoorZoneId, setDraggingDoorZoneId] = useState<string | null>(null);
  // Circuito con la etiqueta visible por hover ("zoneId:numero"); el candidato
  // y su timer viven en refs para no redibujar mientras corre la espera
  const [hoveredCircuitKey, setHoveredCircuitKey] = useState<string | null>(null);
  const hoverCandidateRef = useRef<string | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  // NOTE: Zoom/pan state and handlers are now in useCanvasZoom hook (initialized below after filtering elements)

  const { tool, setTool, visibleLayers, toggleLayer, roomBoundsTargetId, setRoomBoundsTarget } = useToolsStore();
  const {
    radiators,
    boilers,
    pipes,
    rooms,
    manifolds,
    floorHeatingZones,
    floorHeatingTempC,
    setFloorHeatingTempC,
    currentFloor,
    addRadiator,
    addBoiler,
    addManifold,
    addFloorHeatingZone,
    updateElement,
    updateRoom,
    selectedElementId,
    setSelectedElement,
    updateRadiatorPosition,
    rotateRadiator,
    updateBoilerPosition,
    removeElement,

    floorPlans,
    setFloorPlanDimensions,
    createManualPipe,
  } = useElementsStore();

  // Filtrar elementos por planta actual
  const currentFloorRadiators = radiators.filter(r => r.floor === currentFloor);
  const currentFloorBoilers = boilers.filter(b => b.floor === currentFloor);
  const currentFloorPipes = pipes.filter(p => p.floor === currentFloor || p.floor === 'vertical');
  const currentFloorRooms = rooms.filter(r => r.floor === currentFloor);
  const currentFloorManifolds = manifolds.filter(m => m.floor === currentFloor);
  const currentFloorZones = floorHeatingZones.filter(z => z.floor === currentFloor);

  // Circuitos de piso radiante: solo se recalculan cuando cambian zonas o
  // colectores, no en cada redibujado (zoom/pan/drag de otros elementos).
  const floorHeatingCircuits = useMemo<FloorHeatingCircuit[]>(
    () => calcularCircuitosPlanta(currentFloorZones, currentFloorManifolds, floorHeatingTempC, rooms),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [floorHeatingZones, manifolds, currentFloor, floorHeatingTempC, rooms]
  );

  // Identificación "R1..Rn" de cada radiador (los datos van en la planilla)
  const radiatorLabels = useMemo(() => etiquetasRadiadores(radiators), [radiators]);

  // Montantes caldera→colector (primaria Ø32, capa inferior)
  const floorHeatingMontantes = useMemo<Montante[]>(
    () => calcularMontantes(currentFloorManifolds, currentFloorBoilers, currentFloorZones),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manifolds, boilers, floorHeatingZones, currentFloor]
  );


  // Plano de fondo de la planta actual
  const currentFloorPlan = floorPlans[currentFloor];
  const backgroundImage = currentFloorPlan.image;
  const backgroundImageOffset = currentFloorPlan.offset;
  const backgroundImageDimensions = currentFloorPlan.dimensions;

  // Use zoom/pan hook
  const {
    zoom,
    panOffset,
    isPanning,
    lastPanPoint,
    setZoom,
    setPanOffset,
    setIsPanning,
    setLastPanPoint,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFitAll,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  } = useCanvasZoom({
    canvasRef,
    backgroundImageDimensions,
    currentFloorRadiators,
    currentFloorBoilers,
    currentFloorPipes,
    isDragging,
  });

  // Función helper para verificar si un punto está dentro de un radiador
  const isPointInsideRadiator = (x: number, y: number, radiator: Radiator): boolean => {
    return (
      x >= radiator.x &&
      x <= radiator.x + radiator.width &&
      y >= radiator.y &&
      y <= radiator.y + radiator.height
    );
  };

  // Función helper para verificar si un punto está dentro de una caldera
  const isPointInsideBoiler = (x: number, y: number, boiler: Boiler): boolean => {
    return (
      x >= boiler.x &&
      x <= boiler.x + boiler.width &&
      y >= boiler.y &&
      y <= boiler.y + boiler.height
    );
  };

  const isPointInsideManifold = (x: number, y: number, manifold: Manifold): boolean => {
    return (
      x >= manifold.x &&
      x <= manifold.x + manifold.width &&
      y >= manifold.y &&
      y <= manifold.y + manifold.height
    );
  };

  const isPointInsideZone = (x: number, y: number, zone: FloorHeatingZone): boolean => {
    return (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    );
  };



  // Función para dibujar todos los radiadores
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar el tamaño del canvas al contenedor
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Guardar estado del contexto
    ctx.save();

    // Aplicar transformaciones de zoom y pan
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Dibujar imagen de fondo del plano (si existe y la capa está visible)
    if (backgroundImage && visibleLayers.plano) {
      const img = new Image();
      img.src = backgroundImage;

      // Solo dibujar si la imagen ya está cargada
      if (img.complete) {
        const baseWidth = img.width;
        const baseHeight = img.height;

        ctx.globalAlpha = 0.6; // Semi-transparente para que se vean los elementos
        ctx.drawImage(
          img,
          backgroundImageOffset.x,
          backgroundImageOffset.y,
          baseWidth,
          baseHeight
        );
        ctx.globalAlpha = 1.0; // Restaurar opacidad
      } else {
        // Cargar imagen si no está en caché
        img.onload = () => draw();
      }
    }



    // ── Piso radiante: zonas, serpentines, acometidas y colectores ──────────
    const drawPolyline = (pts: CanvasPoint[], color: string, lineWidth: number) => {
      if (pts.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    };

    // Montantes caldera→colector (CAPA INFERIOR: van aisladas por el
    // contrapiso, debajo de placas y circuitos — por eso pueden cruzar zonas)
    if (visibleLayers.montantes) floorHeatingMontantes.forEach((m) => {
      ctx.setLineDash([10, 6]);
      drawPolyline(m.ida, '#8B0000', 3);
      drawPolyline(m.retorno, '#0D47A1', 3);
      ctx.setLineDash([]);

      const texto = `Montante Ø${m.diametroMm} · ${Math.round(m.longitudTotal)} m`;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const ancho = ctx.measureText(texto).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(m.labelPos.x - 3, m.labelPos.y - 8, ancho + 6, 16);
      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 1;
      ctx.strokeRect(m.labelPos.x - 3, m.labelPos.y - 8, ancho + 6, 16);
      ctx.fillStyle = '#8B0000';
      ctx.fillText(texto, m.labelPos.x, m.labelPos.y);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    });

    // Contornos de habitaciones marcados sobre el plano (Room.bounds):
    // trazo índigo discontinuo + nombre, debajo de zonas y elementos
    currentFloorRooms.forEach((room) => {
      if (!room.bounds) return;
      const b = room.bounds;
      ctx.strokeStyle = 'rgba(63, 81, 181, 0.75)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.setLineDash([]);
      ctx.font = 'bold 9px Arial';
      ctx.fillStyle = 'rgba(63, 81, 181, 0.9)';
      ctx.fillText(room.name, b.x + 4, b.y + 10);
    });

    // Zonas: el rectángulo (fondo + borde punteado) SOLO se dibuja cuando la
    // zona está seleccionada. Ya dibujada la serpentina, el rectángulo naranja
    // ensuciaba la vista sin aportar (el circuito ya muestra el ambiente). Se
    // sigue seleccionando con un click adentro del área.
    currentFloorZones.forEach((zone) => {
      const seleccionada = zone.id === selectedElementId;
      const arrastrandoPuerta = zone.id === draggingDoorZoneId;
      if (seleccionada) {
        ctx.fillStyle = 'rgba(255, 152, 0, 0.08)';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        ctx.setLineDash([]);
      }

      // Marcador de puerta = por dónde entra/sale la cañería. Es un vano libre
      // (sin sentido de apertura), que se ubica y rota horizontal/vertical como
      // un radiador para calzar con la puerta real del plano. Se agarra de la
      // barra y se arrastra (ver handleMouseDown). Sin tirador redondo: la barra
      // misma es el elemento y el punto de agarre.
      if (zone.puerta) {
        const p = puntoPuerta(zone.puerta);
        const horizontal = zone.puerta.orientacion === 'horizontal';
        const tg = horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 }; // eje del vano
        const MEDIA_APERTURA = 20; // vano de 40 px = 0,80 m (puerta estándar)
        const activa = seleccionada || arrastrandoPuerta;
        const colorPuerta = activa ? '#2196F3' : '#6D4C41';
        // Vano: barra en la pared (dos jambas), sin hoja ni arco de apertura
        ctx.strokeStyle = colorPuerta;
        ctx.lineWidth = activa ? 6 : 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x - tg.x * MEDIA_APERTURA, p.y - tg.y * MEDIA_APERTURA);
        ctx.lineTo(p.x + tg.x * MEDIA_APERTURA, p.y + tg.y * MEDIA_APERTURA);
        ctx.stroke();
        ctx.lineCap = 'butt';
        // Etiqueta chica al costado del vano
        ctx.fillStyle = colorPuerta;
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = horizontal ? 'center' : 'left';
        ctx.fillText('puerta', horizontal ? p.x : p.x + MEDIA_APERTURA + 4, horizontal ? p.y - MEDIA_APERTURA - 4 : p.y + 3);
        ctx.textAlign = 'left';
      }
    });

    // Serpentines y acometidas de cada circuito
    if (visibleLayers.circuitos) floorHeatingCircuits.forEach((c) => {
      drawPolyline(c.acometidaIda, '#D32F2F', 1.5);
      drawPolyline(c.acometidaRetorno, '#29B6F6', 1.5);
      drawPolyline(c.ida, '#D32F2F', 1.5);
      // Conexión central ida → retorno
      if (c.ida.length > 0 && c.retorno.length > 0) {
        drawPolyline([c.ida[c.ida.length - 1], c.retorno[0]], '#8E24AA', 1.5);
      }
      drawPolyline(c.retorno, '#29B6F6', 1.5);

      // Etiqueta del circuito: SOLO en hover sostenido sobre el serpentín —
      // ninguna etiqueta queda fija sobre el plano (pedido de Edgardo). Con
      // habitación vinculada muestra la CARGA de diseño (lo que el circuito
      // debe cubrir); sin vínculo, la entrega máxima. "C2" = colector 2.
      if (hoveredCircuitKey !== `${c.zoneId}:${c.numero}`) return;
      const potenciaTxt = c.cargaKcalh != null
        ? `carga ${c.cargaKcalh.toLocaleString('es-AR')}`
        : `${c.potenciaKcalh.toLocaleString('es-AR')}`;
      const texto = `${c.zoneName} ${c.etiqueta} · ${Math.round(c.longitudTotal)} m · p${c.pasoCm} · ${potenciaTxt} kcal/h`;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const ancho = ctx.measureText(texto).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(c.labelPos.x - 3, c.labelPos.y - 8, ancho + 6, 16);
      ctx.strokeStyle = c.excedeLimite ? '#D32F2F' : '#999';
      ctx.lineWidth = 1;
      ctx.strokeRect(c.labelPos.x - 3, c.labelPos.y - 8, ancho + 6, 16);
      ctx.fillStyle = c.excedeLimite ? '#D32F2F' : '#333';
      ctx.fillText(texto, c.labelPos.x, c.labelPos.y);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    });

    // Cobertura térmica sobre el plano: lo que entregan los circuitos de la
    // zona contra lo que la habitación vinculada requiere (+15% de margen),
    // el mismo criterio del panel y del presupuesto.
    if (visibleLayers.circuitos) currentFloorZones.forEach((zone) => {
      if (!zone.roomId) return;
      const room = rooms.find(r => r.id === zone.roomId);
      if (!room) return;
      const propios = floorHeatingCircuits.filter(c => c.zoneId === zone.id);
      if (propios.length === 0) return;

      const entrega = propios.reduce((acc, c) => acc + c.potenciaKcalh, 0);
      // Carga de diseño de piso radiante (W/m² según aislación de la
      // habitación), la misma base que el presupuesto y el panel
      const requerido = Math.round(cargaPisoKcalh(room) * MARGEN_SEGURIDAD);
      const pct = requerido > 0 ? Math.round((entrega / requerido) * 100) : 0;
      const ok = entrega >= requerido;
      // Compacto para no tapar los circuitos; el detalle completo aparece
      // al seleccionar la zona (y en el panel / presupuesto).
      const texto = zone.id === selectedElementId
        ? `${ok ? '\u2713' : '\u26A0'} el piso rinde ${entrega.toLocaleString('es-AR')} de ${requerido.toLocaleString('es-AR')} kcal/h (req+15%) \u00B7 ${pct}%`
        : `${ok ? '\u2713' : '\u26A0'} piso ${pct}%`;
      const color = ok ? '#2E7D32' : '#C62828';

      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const ancho = ctx.measureText(texto).width;
      const lx = zone.x + 4;
      const ly = zone.y + zone.height - 9;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(lx - 2, ly - 7, ancho + 4, 14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - 2, ly - 7, ancho + 4, 14);
      ctx.fillStyle = color;
      ctx.fillText(texto, lx, ly);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    });

    // Colectores
    const conteoColectores = circuitosPorColector(floorHeatingCircuits);
    currentFloorManifolds.forEach((manifold, indice) => {
      const circuitosDelColector = conteoColectores.get(manifold.id) ?? 0;
      const excedido = circuitosDelColector > MAX_CIRCUITOS_POR_COLECTOR;
      ctx.fillStyle = excedido ? '#C62828' : '#78909C';
      ctx.fillRect(manifold.x, manifold.y, manifold.width, manifold.height);
      ctx.strokeStyle = manifold.id === selectedElementId
        ? '#2196F3'
        : excedido ? '#B71C1C' : '#455A64';
      ctx.lineWidth = manifold.id === selectedElementId ? 3 : 2;
      ctx.strokeRect(manifold.x, manifold.y, manifold.width, manifold.height);

      // Vías del colector (círculos rojo/azul alternados) a lo largo del eje mayor
      const horizontal = manifold.width >= manifold.height;
      const vias = Math.max(2, Math.min(12, circuitosDelColector * 2));
      const paso = (horizontal ? manifold.width : manifold.height) / (vias + 1);
      for (let i = 1; i <= vias; i++) {
        ctx.fillStyle = i % 2 === 1 ? '#D32F2F' : '#29B6F6';
        ctx.beginPath();
        if (horizontal) {
          ctx.arc(manifold.x + paso * i, manifold.y + manifold.height / 2, 2, 0, Math.PI * 2);
        } else {
          ctx.arc(manifold.x + manifold.width / 2, manifold.y + paso * i, 2, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Etiqueta con conteo de circuitos contra el tope de diseño (máx. 7)
      const textoColector = circuitosDelColector > 0
        ? `Colector ${indice + 1} · ${circuitosDelColector}/${MAX_CIRCUITOS_POR_COLECTOR}${excedido ? ' ⚠ agregá otro colector' : ''}`
        : `Colector ${indice + 1}`;
      ctx.fillStyle = excedido ? '#C62828' : '#455A64';
      ctx.font = 'bold 9px Arial';
      ctx.fillText(textoColector, manifold.x, manifold.y - 4);
    });

    // Preview del rectángulo de zona mientras se arrastra
    if (zoneDraft) {
      const zx = Math.min(zoneDraft.startX, zoneDraft.endX);
      const zy = Math.min(zoneDraft.startY, zoneDraft.endY);
      const zw = Math.abs(zoneDraft.endX - zoneDraft.startX);
      const zh = Math.abs(zoneDraft.endY - zoneDraft.startY);
      ctx.fillStyle = 'rgba(230, 126, 34, 0.15)';
      ctx.fillRect(zx, zy, zw, zh);
      ctx.strokeStyle = '#E67E22';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(zx, zy, zw, zh);
      ctx.setLineDash([]);
      // Medidas en metros mientras dibuja
      const PIXELS_PER_METER = 50;
      ctx.fillStyle = '#E67E22';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(
        `${(zw / PIXELS_PER_METER).toFixed(1)} × ${(zh / PIXELS_PER_METER).toFixed(1)} m`,
        zx + 4,
        zy - 6
      );
    }

    // Dibujar radiadores de la planta actual
    currentFloorRadiators.forEach((radiator) => {
      // Detectar orientación: si height > width, está vertical (rotado 90°)
      const isVertical = radiator.height > radiator.width;

      // Fondo del radiador (color rojo/naranja como en planos)
      ctx.fillStyle = '#E57373';
      ctx.fillRect(radiator.x, radiator.y, radiator.width, radiator.height);

      // Borde del radiador
      ctx.strokeStyle = '#C62828';
      ctx.lineWidth = 1;
      ctx.strokeRect(radiator.x, radiator.y, radiator.width, radiator.height);

      // Si está seleccionado, dibujar borde resaltado
      if (radiator.id === selectedElementId) {
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.strokeRect(radiator.x - 2, radiator.y - 2, radiator.width + 4, radiator.height + 4);
      }

      // Líneas internas (simulando elementos internos)
      ctx.strokeStyle = '#B71C1C';
      ctx.lineWidth = 0.5;
      const numLines = 4;

      if (isVertical) {
        // Radiador VERTICAL: líneas horizontales
        const lineSpacing = radiator.height / (numLines + 1);
        for (let i = 1; i <= numLines; i++) {
          const lineY = radiator.y + lineSpacing * i;
          ctx.beginPath();
          ctx.moveTo(radiator.x + 1, lineY);
          ctx.lineTo(radiator.x + radiator.width - 1, lineY);
          ctx.stroke();
        }
      } else {
        // Radiador HORIZONTAL: líneas verticales
        const lineSpacing = radiator.width / (numLines + 1);
        for (let i = 1; i <= numLines; i++) {
          const lineX = radiator.x + lineSpacing * i;
          ctx.beginPath();
          ctx.moveTo(lineX, radiator.y + 1);
          ctx.lineTo(lineX, radiator.y + radiator.height - 1);
          ctx.stroke();
        }
      }

      // Conexiones de tubería (2 puntos pequeños en un extremo)
      const connectionSize = 2;
      const connectionOffset = 5;

      if (isVertical) {
        // Conexiones en la parte superior (horizontal)
        // Conexión IDA (arriba izquierda)
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.arc(radiator.x + radiator.width / 3, radiator.y + connectionOffset, connectionSize, 0, Math.PI * 2);
        ctx.fill();

        // Conexión RETORNO (arriba derecha)
        ctx.fillStyle = '#29B6F6';
        ctx.beginPath();
        ctx.arc(radiator.x + 2 * radiator.width / 3, radiator.y + connectionOffset, connectionSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Conexiones en el lado izquierdo (vertical)
        // Conexión IDA (izquierda arriba)
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.arc(radiator.x + connectionOffset, radiator.y + radiator.height / 3, connectionSize, 0, Math.PI * 2);
        ctx.fill();

        // Conexión RETORNO (izquierda abajo)
        ctx.fillStyle = '#29B6F6';
        ctx.beginPath();
        ctx.arc(radiator.x + connectionOffset, radiator.y + 2 * radiator.height / 3, connectionSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Identificación compacta "R3" (como en los planos de obra): los datos
      // completos —ambiente, elementos, potencia— van en la planilla
      const etiqueta = radiatorLabels.get(radiator.id) ?? '';
      ctx.font = 'bold 9px Arial';
      const etWidth = ctx.measureText(etiqueta).width;
      const etX = radiator.x + radiator.width + 4;
      const etY = radiator.y + radiator.height / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(etX - 2, etY - 7, etWidth + 4, 12);
      ctx.fillStyle = '#B71C1C';
      ctx.fillText(etiqueta, etX, etY + 2);

      // Con el radiador seleccionado, la potencia al lado de la etiqueta
      if (radiator.id === selectedElementId) {
        ctx.fillStyle = '#333';
        ctx.font = '9px Arial';
        ctx.fillText(
          `${radiator.power.toLocaleString()} Kcal/h`,
          etX + etWidth + 6,
          etY + 2
        );
      }
    });

    // Dibujar calderas de la planta actual
    currentFloorBoilers.forEach((boiler) => {
      // Dibujar rectángulo de la caldera (cuadrado)
      ctx.fillStyle = '#FF5722';
      ctx.fillRect(boiler.x, boiler.y, boiler.width, boiler.height);

      ctx.strokeStyle = '#D84315';
      ctx.lineWidth = 2;
      ctx.strokeRect(boiler.x, boiler.y, boiler.width, boiler.height);

      // Si está seleccionada, dibujar borde resaltado
      if (boiler.id === selectedElementId) {
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 3;
        ctx.strokeRect(boiler.x - 2, boiler.y - 2, boiler.width + 4, boiler.height + 4);
      }

      // Dibujar símbolo de fuego (triángulo simple)
      ctx.fillStyle = '#FFC107';
      ctx.beginPath();
      ctx.moveTo(boiler.x + boiler.width / 2, boiler.y + 15);
      ctx.lineTo(boiler.x + 15, boiler.y + boiler.height - 15);
      ctx.lineTo(boiler.x + boiler.width - 15, boiler.y + boiler.height - 15);
      ctx.closePath();
      ctx.fill();

      // Mostrar potencia (calculada de TODOS los radiadores, no solo la planta actual)
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      // Calcular potencia total de todos los radiadores del sistema
      const totalRadiatorPower = radiators.reduce((sum, r) => sum + r.power, 0);
      // La caldera debe trabajar al 80%, así que su potencia recomendada es mayor
      const recommendedBoilerPower = Math.round(totalRadiatorPower / 0.80);
      const powerKW = (recommendedBoilerPower / 860).toFixed(1);
      ctx.fillText(
        `${powerKW}kW`,
        boiler.x + 5,
        boiler.y + boiler.height - 5
      );
    });

    // Dibujar tuberías finalizadas de la planta actual (ordenadas por zIndex)
    const sortedPipes = [...currentFloorPipes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    sortedPipes.forEach((pipe) => {
      if (pipe.points.length < 2) return;

      const isSelected = pipe.id === selectedElementId;

      // Color según tipo: IDA (supply) = ROJO (agua caliente), RETORNO = AZUL (agua fría)
      let baseColor = pipe.pipeType === 'supply' ? '#D32F2F' : '#29B6F6';
      if (isSelected) baseColor = '#FF9800'; // Naranja si está seleccionada

      ctx.strokeStyle = baseColor;
      // Grosor proporcional al diámetro con escala visual más evidente
      // 16mm=2px, 20mm=3px, 25mm=4px, 32mm=5px, 40mm=6px
      const diameterScale: Record<number, number> = {
        16: 2,
        20: 3,
        25: 4,
        32: 5,
        40: 6
      };
      const baseWidth = diameterScale[pipe.diameter] || 2;
      ctx.lineWidth = isSelected ? baseWidth + 1 : baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]); // Línea sólida

      // Dibujar la tubería con detección de cruces
      ctx.beginPath();
      for (let i = 0; i < pipe.points.length; i++) {
        const point = pipe.points[i];

        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          // Detectar si este segmento cruza con otras tuberías
          const prevPoint = pipe.points[i - 1];
          const hasCrossing = sortedPipes.some(otherPipe => {
            if (otherPipe.id === pipe.id) return false;
            if ((otherPipe.zIndex || 0) >= (pipe.zIndex || 0)) return false;

            // Verificar si hay cruce entre segmentos
            for (let j = 1; j < otherPipe.points.length; j++) {
              const op1 = otherPipe.points[j - 1];
              const op2 = otherPipe.points[j];

              // Detección simple de cruce (producto cruzado)
              const d1 = (op2.x - op1.x) * (prevPoint.y - op1.y) - (op2.y - op1.y) * (prevPoint.x - op1.x);
              const d2 = (op2.x - op1.x) * (point.y - op1.y) - (op2.y - op1.y) * (point.x - op1.x);
              const d3 = (point.x - prevPoint.x) * (op1.y - prevPoint.y) - (point.y - prevPoint.y) * (op1.x - prevPoint.x);
              const d4 = (point.x - prevPoint.x) * (op2.y - prevPoint.y) - (point.y - prevPoint.y) * (op2.x - prevPoint.x);

              if (d1 * d2 < 0 && d3 * d4 < 0) {
                return true; // Hay cruce
              }
            }
            return false;
          });

          if (hasCrossing) {
            // Dibujar gap (salto) en el cruce
            const dx = point.x - prevPoint.x;
            const dy = point.y - prevPoint.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const gapSize = 6; // Tamaño del gap

            if (len > gapSize * 2) {
              const midX = (prevPoint.x + point.x) / 2;
              const midY = (prevPoint.y + point.y) / 2;
              const offsetX = (dx / len) * gapSize;
              const offsetY = (dy / len) * gapSize;

              // Dibujar hasta antes del gap
              ctx.lineTo(midX - offsetX, midY - offsetY);
              ctx.stroke();

              // Saltar el gap
              ctx.beginPath();
              ctx.moveTo(midX + offsetX, midY + offsetY);
              ctx.lineTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
      }
      ctx.stroke();

      // Calcular longitud visual del path
      let pathVisualLength = 0;
      for (let i = 0; i < pipe.points.length - 1; i++) {
        const dx = pipe.points[i + 1].x - pipe.points[i].x;
        const dy = pipe.points[i + 1].y - pipe.points[i].y;
        pathVisualLength += Math.sqrt(dx * dx + dy * dy);
      }

      // Mostrar diámetro en la tubería (solo si está dimensionada Y tiene longitud visible)
      // No mostrar etiqueta si la tubería es muy corta (< 30px)
      if (pipe.diameter && pipe.diameter >= 16 && pipe.points.length >= 2 && pathVisualLength > 30) {
        // Posicionar en el PUNTO MEDIO del path para evitar solapamiento
        const midIndex = Math.floor(pipe.points.length / 2);
        const labelPoint = pipe.points[midIndex];

        // Etiqueta con diámetro
        ctx.fillStyle = isSelected ? '#FF9800' : baseColor;
        ctx.font = '9px Arial'; // Más pequeña: 9px en lugar de 11px bold
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Fondo blanco semi-transparente para legibilidad
        const text = `Ø${pipe.diameter}`;
        const metrics = ctx.measureText(text);
        const padding = 2;
        const bgX = labelPoint.x - metrics.width / 2 - padding;
        const bgY = labelPoint.y - 6; // Más compacto
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = 10; // Más pequeño: 10px en lugar de 14px

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

        // Texto del diámetro
        ctx.fillStyle = isSelected ? '#FF9800' : baseColor;
        ctx.fillText(text, labelPoint.x, labelPoint.y - 1);
      }

      // Solo mostrar puntos de control si está seleccionada
      if (isSelected) {
        pipe.points.forEach((point) => {
          ctx.fillStyle = '#FF9800';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Indicador visual para tuberías verticales
      if (pipe.floor === 'vertical' && pipe.points.length >= 2) {
        const midPoint = pipe.points[Math.floor(pipe.points.length / 2)];

        // Fondo circular
        ctx.fillStyle = 'rgba(156, 39, 176, 0.9)'; // Morado
        ctx.beginPath();
        ctx.arc(midPoint.x, midPoint.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Borde
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Flechas arriba/abajo
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⇅', midPoint.x, midPoint.y);
      }
    });

    // Indicador cuando está en modo marcado de tubería vertical
    if (tool === 'vertical-pipe' && pipeStartElement) {
      const element =
        radiators.find(r => r.id === pipeStartElement.id) ||
        boilers.find(b => b.id === pipeStartElement.id);

      if (element) {
        // Resaltar elemento de inicio
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          element.x - 4,
          element.y - 4,
          element.width + 8,
          element.height + 8
        );
        ctx.setLineDash([]);

        // Línea de preview hasta el mouse
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(element.x + element.width / 2, element.y + element.height / 2);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Restaurar estado del contexto
    ctx.restore();
  };

  // Redibujar cuando cambien los radiadores, calderas, pipes, zonas PR, colectores, conexiones, backgroundImage, selección, tool, pipeStart o PLANTA ACTUAL
  useEffect(() => {
    draw();
  }, [radiators, boilers, pipes, rooms, manifolds, floorHeatingZones, zoneDraft, selectedElementId, zoom, panOffset, backgroundImage, tool, pipeStartElement, currentFloor, floorHeatingTempC, visibleLayers, hoveredCircuitKey]);

  // Cancelar la espera de la etiqueta en hover si el componente se desmonta
  useEffect(() => () => {
    if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
  }, []);

  // Redibujar solo cuando cambia mousePos y estamos creando una tubería o dibujando zona (para preview)
  useEffect(() => {
    if (pipeStartElement) {
      draw();
    }
  }, [mousePos, pipeStartElement]);

  // Actualizar dimensiones de la imagen de fondo cuando cambia (separado de draw para evitar loop)
  useEffect(() => {
    if (!backgroundImage) return;

    const img = new Image();
    img.src = backgroundImage;

    const updateDimensions = () => {
      setFloorPlanDimensions(currentFloor, { width: img.width, height: img.height });
    };

    if (img.complete && img.width > 0) {
      updateDimensions();
    } else {
      img.onload = updateDimensions;
    }
  }, [backgroundImage, currentFloor]);

  // Auto-centrar el plano cuando se carga una nueva imagen de fondo
  useEffect(() => {
    if (backgroundImage && backgroundImageDimensions) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;

      const imgWidth = backgroundImageDimensions.width;
      const imgHeight = backgroundImageDimensions.height;

      // Calcular zoom para que el plano quepa con margen
      const margin = 40;
      const zoomX = (canvasWidth - margin * 2) / imgWidth;
      const zoomY = (canvasHeight - margin * 2) / imgHeight;
      const newZoom = Math.min(zoomX, zoomY, 2); // Máximo zoom 2x para no pixelar

      // Calcular offset para centrar
      const newPanX = (canvasWidth - imgWidth * newZoom) / 2;
      const newPanY = (canvasHeight - imgHeight * newZoom) / 2;

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    }
  }, [backgroundImage, backgroundImageDimensions?.width, backgroundImageDimensions?.height]);

  // Redibujar al montar y al redimensionar
  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  // Listener de teclado para eliminar elementos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detectar teclas Delete o Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();

        // Otros elementos (radiadores, calderas, tuberías)
        removeElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, removeElement]);

  const getMouseCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Aplicar transformaciones inversas de zoom y pan
    const x = (clientX - panOffset.x) / zoom;
    const y = (clientY - panOffset.y) / zoom;

    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Pan con click derecho o click del medio (wheel button)
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const coords = getMouseCoordinates(e);
    setMousePos(coords);

    // Modo puerta: el click ubica la puerta donde clickeaste, con la
    // orientación de la pared más cercana (después se arrastra y se rota libre).
    // Un click lejos de la zona (>60 px) cancela sin marcar.
    if (placingDoorZoneId) {
      const zone = floorHeatingZones.find(z => z.id === placingDoorZoneId);
      if (zone) {
        const dx = Math.max(zone.x - coords.x, 0, coords.x - (zone.x + zone.width));
        const dy = Math.max(zone.y - coords.y, 0, coords.y - (zone.y + zone.height));
        if (Math.hypot(dx, dy) <= 60) {
          updateElement(zone.id, { puerta: crearPuerta(zone, coords) });
        }
      }
      setPlacingDoorZoneId(null);
      return;
    }

    // Si la herramienta es "radiator", crear un radiador
    if (tool === 'radiator') {
      let finalX = coords.x;
      let finalY = coords.y;

      // Snap a radiadores existentes en la misma planta para alinearlos
      const SNAP_DISTANCE = 30; // pixels
      const nearbyRadiators = currentFloorRadiators.filter(r => {
        const dx = Math.abs(r.x - coords.x);
        const dy = Math.abs(r.y - coords.y);
        return dx < 100 && dy < 100; // Solo considerar radiadores cercanos
      });

      // Intentar alinear horizontalmente (misma Y)
      for (const rad of nearbyRadiators) {
        if (Math.abs(rad.y - coords.y) < SNAP_DISTANCE) {
          finalY = rad.y; // Alinear a la misma Y
          break;
        }
      }

      // Intentar alinear verticalmente (misma X)
      for (const rad of nearbyRadiators) {
        if (Math.abs(rad.x - coords.x) < SNAP_DISTANCE) {
          finalX = rad.x; // Alinear a la misma X
          break;
        }
      }

      const newRadiator: Radiator = {
        id: crypto.randomUUID(),
        type: 'radiator',
        x: finalX,
        y: finalY,
        width: 60,  // Vista superior: más angosto
        height: 12, // Vista superior: muy bajo (franja)
        power: 0, // Sin potencia hasta asignar a habitación o definir manualmente
      };

      addRadiator(newRadiator);
    }

    // Si la herramienta es "boiler", crear una caldera
    if (tool === 'boiler') {
      const defaultBoiler = CATALOG.boilers.find(b => b.isDefault) || CATALOG.boilers[0];
      // Convertir dimensiones mm a px (100px = 1m -> 1px = 10mm).
      // width: 400mm -> 40px
      // Aproximate to canvas visual style if needed, but catalog gives real dims.
      // Canvas pixels = mm / 10.

      const newBoiler: Boiler = {
        id: crypto.randomUUID(),
        type: 'boiler',
        x: coords.x,
        y: coords.y,
        width: defaultBoiler.width / 10,  // 400mm / 10 = 40px
        height: 25, // Mantener visual style for "front/depth" representation or adjust? 
        // Catalog height is 700mm (Z axis usually). Width 400mm. Depth 320mm.
        // Top view: Width x Depth.
        // width (X) = 400mm -> 40px
        // height (Y on canvas, Depth in real life) = 320mm -> 32px
        // Existing was width 40, height 25.
        // Let's us 32 for depth/height on canvas.
        // BUT KEEPING VISUAL CONSISTENCY: 
        // Existing: width 40, height 25.
        // Default Boiler: 400mm width, 320mm depth.
        // 400/10 = 40px. 320/10 = 32px.
        // I will use derived values.

        power: defaultBoiler.maxPowerKcal,
      };

      addBoiler(newBoiler);
    }

    // Si la herramienta es "manifold", colocar un colector
    if (tool === 'manifold') {
      const newManifold: Manifold = {
        id: crypto.randomUUID(),
        type: 'manifold',
        x: coords.x,
        y: coords.y,
        width: 40,  // 80 cm a escala 50 px/m — gabinete de colector típico
        height: 12,
      };
      addManifold(newManifold);
      setTool('select');
    }

    // Si la herramienta es "floor-heating-zone", empezar a dibujar el rectángulo
    if (tool === 'floor-heating-zone') {
      setZoneDraft({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
    }

    // Contorno de habitación sobre el plano: mismo gesto de arrastre que las
    // zonas (el destino es la habitación elegida en el RoomPanel)
    if (tool === 'room-rect' && roomBoundsTargetId) {
      setZoneDraft({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
    }

    // Si la herramienta es "select", intentar seleccionar o arrastrar
    if (tool === 'select') {
      // Puerta de una zona: se agarra desde su marcador (la barra) y se arrastra
      // libre como un radiador. Se chequea ANTES que nada porque el marcador
      // suele quedar sobre el borde de la zona, encima del área seleccionable.
      const zonaConPuerta = currentFloorZones.find(z => {
        if (!z.puerta) return false;
        const p = puntoPuerta(z.puerta);
        return Math.hypot(coords.x - p.x, coords.y - p.y) <= 22;
      });
      if (zonaConPuerta) {
        setSelectedElement(zonaConPuerta.id);
        setDraggingDoorZoneId(zonaConPuerta.id);
        return;
      }

      // Buscar si hicimos click en algún radiador de la planta actual (recorrer en orden inverso para priorizar los últimos)
      let foundRadiator: Radiator | null = null;

      for (let i = currentFloorRadiators.length - 1; i >= 0; i--) {
        if (isPointInsideRadiator(coords.x, coords.y, currentFloorRadiators[i])) {
          foundRadiator = currentFloorRadiators[i];
          break;
        }
      }

      // Si no se encontró radiador, buscar caldera
      let foundBoiler: Boiler | null = null;
      if (!foundRadiator) {
        for (let i = currentFloorBoilers.length - 1; i >= 0; i--) {
          if (isPointInsideBoiler(coords.x, coords.y, currentFloorBoilers[i])) {
            foundBoiler = currentFloorBoilers[i];
            break;
          }
        }
      }

      // Si no se encontró radiador ni caldera, buscar tubería MÁS CERCANA en la planta actual
      let foundPipeId: string | null = null;
      if (!foundRadiator && !foundBoiler) {
        let closestPipe: { id: string; distance: number } | null = null;

        for (let i = 0; i < currentFloorPipes.length; i++) {
          const pipe = currentFloorPipes[i];
          if (pipe.points.length < 2) continue;

          // Calcular distancia mínima a cada segmento de esta tubería
          let minDistance = Infinity;
          for (let j = 0; j < pipe.points.length - 1; j++) {
            const p1 = pipe.points[j];
            const p2 = pipe.points[j + 1];

            // Distancia punto-segmento
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lengthSquared = dx * dx + dy * dy;

            if (lengthSquared === 0) {
              // El segmento es un punto
              const dist = Math.sqrt(
                (coords.x - p1.x) ** 2 + (coords.y - p1.y) ** 2
              );
              minDistance = Math.min(minDistance, dist);
            } else {
              // Proyección del punto sobre la línea
              let t = ((coords.x - p1.x) * dx + (coords.y - p1.y) * dy) / lengthSquared;
              t = Math.max(0, Math.min(1, t)); // Clamped entre 0 y 1

              // Punto más cercano en el segmento
              const closestX = p1.x + t * dx;
              const closestY = p1.y + t * dy;

              const dist = Math.sqrt(
                (coords.x - closestX) ** 2 + (coords.y - closestY) ** 2
              );
              minDistance = Math.min(minDistance, dist);
            }
          }

          // Si esta tubería está dentro del threshold y es la más cercana hasta ahora
          if (minDistance <= 10 && (!closestPipe || minDistance < closestPipe.distance)) {
            closestPipe = { id: pipe.id, distance: minDistance };
          }
        }

        if (closestPipe) {
          foundPipeId = closestPipe.id;
        }
      }



      // Buscar colector (antes que zona: el colector suele estar sobre una zona)
      let foundManifold: Manifold | null = null;
      if (!foundRadiator && !foundBoiler && !foundPipeId) {
        for (let i = currentFloorManifolds.length - 1; i >= 0; i--) {
          if (isPointInsideManifold(coords.x, coords.y, currentFloorManifolds[i])) {
            foundManifold = currentFloorManifolds[i];
            break;
          }
        }
      }

      // Buscar zona de piso radiante (al final: ocupa mucha superficie)
      let foundZone: FloorHeatingZone | null = null;
      if (!foundRadiator && !foundBoiler && !foundPipeId && !foundManifold) {
        for (let i = currentFloorZones.length - 1; i >= 0; i--) {
          if (isPointInsideZone(coords.x, coords.y, currentFloorZones[i])) {
            foundZone = currentFloorZones[i];
            break;
          }
        }
      }

      if (foundRadiator) {
        // Seleccionar el radiador
        setSelectedElement(foundRadiator.id);

        // Activar modo dragging y guardar offset
        setIsDragging(true);
        setDragOffset({
          x: coords.x - foundRadiator.x,
          y: coords.y - foundRadiator.y,
        });
      } else if (foundBoiler) {
        // Seleccionar la caldera
        setSelectedElement(foundBoiler.id);

        // Activar modo dragging y guardar offset
        setIsDragging(true);
        setDragOffset({
          x: coords.x - foundBoiler.x,
          y: coords.y - foundBoiler.y,
        });
      } else if (foundPipeId) {
        // Seleccionar la tubería
        setSelectedElement(foundPipeId);
        setIsDragging(false);
      } else if (foundManifold) {
        setSelectedElement(foundManifold.id);
        setIsDragging(true);
        setDragOffset({
          x: coords.x - foundManifold.x,
          y: coords.y - foundManifold.y,
        });
      } else if (foundZone) {
        setSelectedElement(foundZone.id);
        setIsDragging(true);
        setDragOffset({
          x: coords.x - foundZone.x,
          y: coords.y - foundZone.y,
        });
      } else {
        // No se encontró ningún elemento
        setSelectedElement(null);
        setIsDragging(false);
      }
    } else if (tool === 'vertical-pipe') {
      // Modo de marcado de tubería vertical
      const foundRadiator = currentFloorRadiators.find(r =>
        isPointInsideRadiator(coords.x, coords.y, r)
      );
      const foundBoiler = currentFloorBoilers.find(b =>
        isPointInsideBoiler(coords.x, coords.y, b)
      );

      const clickedElement = foundRadiator || foundBoiler;

      if (clickedElement) {
        if (!pipeStartElement) {
          // Primer click: guardar elemento de inicio
          setPipeStartElement({
            id: clickedElement.id,
            type: foundRadiator ? 'radiator' : 'boiler'
          });
        } else {
          // Segundo click: crear tubería vertical
          createManualPipe(pipeStartElement.id, clickedElement.id, 'vertical');
          // Resetear y volver a modo select
          setPipeStartElement(null);
          setTool('select');
        }
      } else {
        // Click en vacío: cancelar
        if (pipeStartElement) {
          setPipeStartElement(null);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Si estamos haciendo pan (click derecho o medio)
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const coords = getMouseCoordinates(e);
    setMousePos(coords);

    // Si estamos dibujando una zona de piso radiante, actualizar el rectángulo
    if (zoneDraft) {
      setZoneDraft({ ...zoneDraft, endX: coords.x, endY: coords.y });
      return;
    }

    // Si estamos arrastrando la puerta de una zona: la seguimos libre bajo el
    // cursor (la orientación se cambia con el botón ⟳ del panel).
    if (draggingDoorZoneId) {
      const zone = floorHeatingZones.find(z => z.id === draggingDoorZoneId);
      if (zone?.puerta) updateElement(zone.id, { puerta: { ...zone.puerta, x: coords.x, y: coords.y } });
      return;
    }

    // Si estamos arrastrando un elemento seleccionado
    if (isDragging && selectedElementId) {
      const newX = coords.x - dragOffset.x;
      const newY = coords.y - dragOffset.y;

      // Verificar si el elemento es un radiador
      const isRadiator = radiators.some(r => r.id === selectedElementId);
      if (isRadiator) {
        updateRadiatorPosition(selectedElementId, newX, newY);
      }

      // Verificar si el elemento es una caldera
      const isBoiler = boilers.some(b => b.id === selectedElementId);
      if (isBoiler) {
        updateBoilerPosition(selectedElementId, newX, newY);
      }

      // Colector o zona de piso radiante: comparten updateElement
      const isManifoldOrZone =
        manifolds.some(m => m.id === selectedElementId) ||
        floorHeatingZones.some(z => z.id === selectedElementId);
      if (isManifoldOrZone) {
        updateElement(selectedElementId, { x: newX, y: newY });
      }
      return;
    }

    // Hover sobre un circuito de piso radiante: la etiqueta aparece tras
    // sostener el cursor HOVER_ETIQUETA_MS sobre el serpentín. Salir del
    // circuito la oculta al instante y cancela la espera pendiente.
    if (visibleLayers.circuitos && floorHeatingCircuits.length > 0) {
      const hit = floorHeatingCircuits.find(c =>
        isPointNearPipe(coords, c.ida, 8) || isPointNearPipe(coords, c.retorno, 8)
      );
      const key = hit ? `${hit.zoneId}:${hit.numero}` : null;
      if (key !== hoverCandidateRef.current) {
        hoverCandidateRef.current = key;
        if (hoverTimerRef.current !== null) {
          window.clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        if (key === null) {
          setHoveredCircuitKey(null);
        } else {
          hoverTimerRef.current = window.setTimeout(
            () => setHoveredCircuitKey(key),
            HOVER_ETIQUETA_MS
          );
        }
      }
    }
  };

  // Al salir del canvas, la etiqueta en hover se oculta y se cancela la
  // espera pendiente — si no, queda pegada sobre el plano
  const handleMouseLeaveCanvas = () => {
    hoverCandidateRef.current = null;
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredCircuitKey(null);
  };

  const handleMouseUp = () => {
    // Finalizar el dibujo de una zona de piso radiante
    if (zoneDraft) {
      const zx = Math.min(zoneDraft.startX, zoneDraft.endX);
      const zy = Math.min(zoneDraft.startY, zoneDraft.endY);
      const zw = Math.abs(zoneDraft.endX - zoneDraft.startX);
      const zh = Math.abs(zoneDraft.endY - zoneDraft.startY);

      // Contorno de habitación: guarda bounds en la habitación destino y
      // termina — no crea una zona de piso radiante
      if (roomBoundsTargetId) {
        if (zw >= 30 && zh >= 30) {
          updateRoom(roomBoundsTargetId, { bounds: { x: zx, y: zy, width: zw, height: zh } });
        }
        setRoomBoundsTarget(null);
        setZoneDraft(null);
        setIsDragging(false);
        setIsPanning(false);
        return;
      }

      // Mínimo 1×1 m (50×50 px): evita zonas creadas por un click accidental
      if (zw >= 50 && zh >= 50) {
        const newZone: FloorHeatingZone = {
          id: crypto.randomUUID(),
          type: 'floor-heating-zone',
          name: `Zona ${floorHeatingZones.length + 1}`,
          x: zx,
          y: zy,
          width: zw,
          height: zh,
          pasoCm: 15,
        };
        addFloorHeatingZone(newZone);
        setTool('select');
        // Dejarla seleccionada: así aparece el selector de habitación y paso
        setSelectedElement(newZone.id);
      }
      setZoneDraft(null);
    }

    // Desactivar dragging y panning
    setIsDragging(false);
    setIsPanning(false);
    setDraggingDoorZoneId(null);
  };

  // NOTE: Zoom functions are now provided by useCanvasZoom hook



  // NOTE: Touch and wheel handlers (getTouchDistance, handleTouchStart, handleTouchMove, 
  // handleTouchEnd, handleWheel) are now provided by useCanvasZoom hook

  // Determinar el cursor según el estado
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (tool === 'select' && (isDragging || draggingDoorZoneId)) return 'grabbing';
    if (tool === 'select') {
      // El marcador de la puerta también se agarra
      const overPuerta = currentFloorZones.some(z => {
        if (!z.puerta) return false;
        const p = puntoPuerta(z.puerta);
        return Math.hypot(mousePos.x - p.x, mousePos.y - p.y) <= 22;
      });
      // Verificar si el mouse está sobre algún elemento
      const overElement = overPuerta ||
        radiators.some(r => isPointInsideRadiator(mousePos.x, mousePos.y, r)) ||
        boilers.some(b => isPointInsideBoiler(mousePos.x, mousePos.y, b)) ||
        pipes.some(p => isPointNearPipe(mousePos, p.points, 10));

      if (overElement) return 'grab';
      return 'default';
    }
    if (tool === 'radiator' || tool === 'boiler' || tool === 'manifold') return 'copy';
    if (tool === 'vertical-pipe' || tool === 'floor-heating-zone' || tool === 'room-rect') return 'crosshair';

    return 'default';
  };

  // Prevenir menú contextual del click derecho (usamos click derecho para pan)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsPanning(false); handleMouseLeaveCanvas(); }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          cursor: getCursor(),
          touchAction: 'none', // Prevenir scroll nativo en touch
        }}
      />

      {/* Controles de Zoom */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10,
      }}>
        <button
          onClick={handleZoomIn}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid #2196F3',
            background: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          title="Acercar (Zoom In)"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid #2196F3',
            background: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          title="Alejar (Zoom Out)"
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid #757575',
            background: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          title="Restablecer Zoom"
        >
          ⟲
        </button>
        <button
          onClick={handleFitAll}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid #4CAF50',
            background: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          title="Encuadrar Todo"
        >
          ⊡
        </button>
      </div>

      {/* Botón de rotación (solo si hay un radiador seleccionado) */}
      {selectedElementId && currentFloorRadiators.some(r => r.id === selectedElementId) && (() => {
        const selectedRadiator = currentFloorRadiators.find(r => r.id === selectedElementId);
        if (!selectedRadiator) return null;

        // Calcular posición del botón en coordenadas de pantalla
        const screenX = selectedRadiator.x * zoom + panOffset.x + (selectedRadiator.width * zoom / 2);
        const screenY = selectedRadiator.y * zoom + panOffset.y - 35;

        return (
          <button
            onClick={() => rotateRadiator(selectedElementId)}
            style={{
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: 'translateX(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              border: '2px solid #2196F3',
              background: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
            title="Rotar radiador 90°"
          >
            ↻
          </button>
        );
      })()}

      {/* Botón de rotación (solo si hay un colector seleccionado) */}
      {selectedElementId && currentFloorManifolds.some(m => m.id === selectedElementId) && (() => {
        const selectedManifold = currentFloorManifolds.find(m => m.id === selectedElementId);
        if (!selectedManifold) return null;

        const screenX = selectedManifold.x * zoom + panOffset.x + (selectedManifold.width * zoom / 2);
        const screenY = selectedManifold.y * zoom + panOffset.y - 35;

        return (
          <button
            onClick={() => updateElement(selectedManifold.id, {
              width: selectedManifold.height,
              height: selectedManifold.width,
            })}
            style={{
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: 'translateX(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              border: '2px solid #2196F3',
              background: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
            title="Rotar colector 90° (horizontal/vertical)"
          >
            ↻
          </button>
        );
      })()}

      {/* Botón de rotación de la PUERTA (solo si la zona seleccionada tiene puerta).
          Va pegado a la puerta —no a la zona— igual que el ↻ del radiador va
          pegado al radiador, para que sea visible y descubrible justo donde está
          el elemento. Antes el control estaba en la barra de la zona, que aparece
          arriba del rectángulo y quedaba tapada por la toolbar cuando la zona
          está pegada al borde superior. */}
      {selectedElementId && (() => {
        const zoneWithDoor = currentFloorZones.find(z => z.id === selectedElementId && z.puerta);
        if (!zoneWithDoor?.puerta) return null;
        const p = zoneWithDoor.puerta;

        // Coordenadas de pantalla de la puerta. Por defecto el botón va arriba;
        // si eso lo dejaría clippeado contra la toolbar (puerta muy alta), se
        // voltea abajo de la puerta para que siempre quede a la vista.
        const screenX = p.x * zoom + panOffset.x;
        const arriba = p.y * zoom + panOffset.y - 40;
        const screenY = arriba < 4 ? p.y * zoom + panOffset.y + 24 : arriba;

        return (
          <button
            onClick={() => updateElement(zoneWithDoor.id, {
              puerta: { ...p, orientacion: p.orientacion === 'horizontal' ? 'vertical' : 'horizontal' },
            })}
            style={{
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: 'translateX(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              border: '2px solid #6D4C41',
              background: 'white',
              color: '#6D4C41',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
            title="Rotar la puerta 90° (horizontal / vertical), como un radiador"
          >
            ↻
          </button>
        );
      })()}

      {/* Selector de paso (solo si hay una zona de piso radiante seleccionada) */}
      {selectedElementId && currentFloorZones.some(z => z.id === selectedElementId) && (() => {
        const selectedZone = currentFloorZones.find(z => z.id === selectedElementId);
        if (!selectedZone) return null;

        const screenX = selectedZone.x * zoom + panOffset.x + (selectedZone.width * zoom / 2);
        const screenY = selectedZone.y * zoom + panOffset.y - 38;

        return (
          <div
            style={{
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '4px',
              background: 'white',
              border: '2px solid #E67E22',
              borderRadius: '4px',
              padding: '3px 6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 1000,
              alignItems: 'center',
              fontSize: '11px',
            }}
          >
            <span style={{ color: '#666' }}>Habitación:</span>
            <select
              value={selectedZone.roomId ?? ''}
              onChange={(e) => {
                const room = currentFloorRooms.find(r => r.id === e.target.value);
                const zoneIndex = floorHeatingZones.findIndex(z => z.id === selectedZone.id);
                updateElement(selectedZone.id, room
                  ? { roomId: room.id, name: room.name }
                  : { roomId: undefined, name: `Zona ${zoneIndex + 1}` });
              }}
              style={{
                padding: '2px 4px',
                borderRadius: '3px',
                border: '1px solid #E67E22',
                background: 'white',
                color: '#333',
                fontSize: '11px',
                maxWidth: '130px',
                cursor: 'pointer',
              }}
              title="Habitación del plano a la que pertenece esta zona"
            >
              <option value="">Sin asignar</option>
              {currentFloorRooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ color: '#666' }}>Colector:</span>
            <select
              value={selectedZone.manifoldId ?? ''}
              onChange={(e) => {
                updateElement(selectedZone.id, {
                  manifoldId: e.target.value || undefined,
                });
              }}
              style={{
                padding: '2px 4px',
                borderRadius: '3px',
                border: '1px solid #E67E22',
                background: 'white',
                color: '#333',
                fontSize: '11px',
                maxWidth: '110px',
                cursor: 'pointer',
              }}
              title="Colector al que van los circuitos de esta zona (Auto: el más cercano)"
            >
              <option value="">Auto (cercano)</option>
              {currentFloorManifolds.map((m, i) => (
                <option key={m.id} value={m.id}>Colector {i + 1}</option>
              ))}
            </select>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ color: '#666' }}>Paso:</span>
            {([15, 20] as const).map(paso => (
              <button
                key={paso}
                onClick={() => updateElement(selectedZone.id, { pasoCm: paso })}
                style={{
                  padding: '2px 8px',
                  borderRadius: '3px',
                  border: '1px solid #E67E22',
                  background: selectedZone.pasoCm === paso ? '#E67E22' : 'white',
                  color: selectedZone.pasoCm === paso ? 'white' : '#E67E22',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                title={`Separación entre tubos: ${paso} cm`}
              >
                {paso} cm
              </button>
            ))}
            <span style={{ color: '#ccc' }}>|</span>
            <button
              onClick={() => setPlacingDoorZoneId(
                placingDoorZoneId === selectedZone.id ? null : selectedZone.id
              )}
              style={{
                padding: '2px 8px',
                borderRadius: '3px',
                border: '1px solid #6D4C41',
                background: placingDoorZoneId === selectedZone.id ? '#6D4C41' : 'white',
                color: placingDoorZoneId === selectedZone.id ? 'white' : '#6D4C41',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              title={selectedZone.puerta
                ? 'La puerta ya está: arrastrala libre para acomodarla donde entra la cañería'
                : 'Marcar la puerta: click cerca de la zona por donde entra la cañería (después la arrastrás y rotás libre)'}
            >
              🚪 {selectedZone.puerta ? 'Mover' : 'Puerta'}
            </button>
            {selectedZone.puerta && (
              <button
                onClick={() => {
                  updateElement(selectedZone.id, { puerta: undefined });
                  setPlacingDoorZoneId(null);
                }}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid #6D4C41',
                  background: 'white',
                  color: '#6D4C41',
                  cursor: 'pointer',
                }}
                title="Quitar la puerta (la acometida vuelve al borde más cercano)"
              >
                ✕
              </button>
            )}
          </div>
        );
      })()}

      {/* Guía de orden de diseño de piso radiante */}
      {(currentFloorZones.length > 0 || currentFloorManifolds.length > 0 ||
        tool === 'floor-heating-zone' || tool === 'manifold') && (() => {
        const pasos: { ok: boolean; texto: string }[] = [
          { ok: rooms.length > 0, texto: '1. Definí las habitaciones' },
          { ok: currentFloorBoilers.length > 0, texto: '2. Colocá la caldera' },
          { ok: currentFloorManifolds.length > 0, texto: '3. Colocá los colectores (máx. 7 circuitos c/u)' },
          { ok: floorHeatingMontantes.length > 0, texto: '4. Montante caldera→colector Ø32 — se genera sola' },
          { ok: floorHeatingCircuits.length > 0, texto: '5. Dibujá las zonas: circuitos Ø20 automáticos' },
        ];
        return (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #E67E22',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            zIndex: 900,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 'bold', color: '#E67E22', marginBottom: 2 }}>🌀 Orden de diseño</div>
            {pasos.map((p) => (
              <div key={p.texto} style={{ color: p.ok ? '#2E7D32' : '#555' }}>
                {p.ok ? '✅' : '⬜'} {p.texto}
              </div>
            ))}
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#555' }}>🌡 Impulsión:</span>
              {TEMPERATURAS_IMPULSION.map(t => (
                <button
                  key={t}
                  onClick={() => setFloorHeatingTempC(t)}
                  style={{
                    padding: '1px 7px',
                    borderRadius: '3px',
                    border: '1px solid #E67E22',
                    background: floorHeatingTempC === t ? '#E67E22' : 'white',
                    color: floorHeatingTempC === t ? 'white' : '#E67E22',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                  title={`Agua de impulsión a ${t}°C → el piso entrega ${emisionKcalhM2(t)} kcal/h·m²`}
                >
                  {t}°
                </button>
              ))}
              <span style={{ color: '#888', fontSize: '11px' }}>→ {emisionKcalhM2(floorHeatingTempC)} kcal/h·m²</span>
            </div>
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#555' }}>🗂 Capas:</span>
              {([
                ['plano', 'Plano', 'Imagen de fondo del plano'],
                ['circuitos', 'Circuitos Ø20', 'Serpentines y acometidas de piso radiante'],
                ['montantes', 'Montantes Ø32', 'Primaria caldera→colector (capa inferior, por contrapiso)'],
              ] as const).map(([capa, nombre, detalle]) => (
                <button
                  key={capa}
                  onClick={() => toggleLayer(capa)}
                  style={{
                    padding: '1px 7px',
                    borderRadius: '3px',
                    border: '1px solid #607D8B',
                    background: visibleLayers[capa] ? '#607D8B' : 'white',
                    color: visibleLayers[capa] ? 'white' : '#90A4AE',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                  title={`${detalle} — click para ${visibleLayers[capa] ? 'ocultar' : 'mostrar'}`}
                >
                  {visibleLayers[capa] ? '👁' : '🚫'} {nombre}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(255,255,255,0.8)',
        padding: '5px 10px',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}>
        Tool: {tool} | Zoom: {(zoom * 100).toFixed(0)}% | Mouse: ({mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)})
        {tool === 'floor-heating-zone' && (
          <span style={{ color: '#E67E22', fontWeight: 'bold' }}>
            {' '}— Arrastrá un rectángulo sobre la habitación del plano: los circuitos se generan solos
          </span>
        )}
        {tool === 'room-rect' && (
          <span style={{ color: '#3F51B5', fontWeight: 'bold' }}>
            {' '}— Arrastrá un rectángulo sobre el contorno de {rooms.find(r => r.id === roomBoundsTargetId)?.name ?? 'la habitación'} en el plano
          </span>
        )}
        {placingDoorZoneId && (
          <span style={{ color: '#6D4C41', fontWeight: 'bold' }}>
            {' '}— 🚪 Click en el borde de la zona por donde entra la cañería (lejos de la zona cancela)
          </span>
        )}
        {tool === 'manifold' && (
          <span style={{ color: '#E67E22', fontWeight: 'bold' }}>
            {' '}— Click donde va el colector (pasillo/lavadero): las zonas se conectan al más cercano
          </span>
        )}
      </div>
    </div>
  );
};
