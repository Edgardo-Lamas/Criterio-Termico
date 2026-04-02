import { useRef, useState, useEffect } from 'react';
import { useToolsStore } from '../../store/useToolsStore';
import { useElementsStore } from '../../store/useElementsStore';
import { useCanvasZoom } from './hooks/useCanvasZoom';
import type { Radiator } from '../../models/Radiator';
import type { Boiler } from '../../models/Boiler';
import { CATALOG } from '../../data/catalog';
import { isPointNearPipe } from '../../utils/geometry';




export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pipeStartElement, setPipeStartElement] = useState<{ id: string, type: 'radiator' | 'boiler' } | null>(null);

  // NOTE: Zoom/pan state and handlers are now in useCanvasZoom hook (initialized below after filtering elements)

  const { tool, setTool } = useToolsStore();
  const {
    radiators,
    boilers,
    pipes,
    rooms,
    currentFloor,
    addRadiator,
    addBoiler,
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

    // Dibujar imagen de fondo del plano (si existe)
    if (backgroundImage) {
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

      // Mostrar potencia y nombre de habitación
      const assignedRoom = currentFloorRooms.find(r => r.radiatorIds.includes(radiator.id));

      if (assignedRoom) {
        // Mostrar nombre de habitación
        ctx.fillStyle = '#1976D2';
        ctx.font = 'bold 11px Arial';
        const roomNameText = assignedRoom.name;
        const textWidth = ctx.measureText(roomNameText).width;

        // Posición del texto (al lado derecho del radiador)
        const textX = radiator.x + radiator.width + 8;
        const textY = radiator.y + radiator.height / 2 - 5;

        // Fondo blanco semitransparente para el texto
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(textX - 2, textY - 10, textWidth + 4, 14);

        // Texto del nombre
        ctx.fillStyle = '#1976D2';
        ctx.fillText(roomNameText, textX, textY);

        // Mostrar potencia debajo del nombre
        ctx.fillStyle = '#666';
        ctx.font = '9px Arial';
        ctx.fillText(
          `${radiator.power.toLocaleString()} Kcal/h`,
          textX,
          textY + 12
        );
      } else if (radiator.id === selectedElementId) {
        // Si no está asignado, solo mostrar potencia cuando está seleccionado
        ctx.fillStyle = '#333';
        ctx.font = '9px Arial';
        ctx.fillText(
          `${radiator.power} Kcal/h`,
          radiator.x + radiator.width + 5,
          radiator.y + radiator.height / 2
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
  }, [radiators, boilers, pipes, selectedElementId, zoom, panOffset, backgroundImage, tool, pipeStartElement, currentFloor]);

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
        console.log('Elemento eliminado:', selectedElementId);
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
          console.log(`📐 Snap horizontal a Y=${finalY}`);
          break;
        }
      }

      // Intentar alinear verticalmente (misma X)
      for (const rad of nearbyRadiators) {
        if (Math.abs(rad.x - coords.x) < SNAP_DISTANCE) {
          finalX = rad.x; // Alinear a la misma X
          console.log(`📐 Snap vertical a X=${finalX}`);
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
      console.log('Radiador creado en', currentFloor === 'ground' ? 'Planta Baja' : 'Planta Alta', ':', newRadiator);
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
      console.log('Caldera creada en', currentFloor === 'ground' ? 'Planta Baja' : 'Planta Alta', ':', newBoiler);
    }

    // Si la herramienta es "select", intentar seleccionar o arrastrar
    if (tool === 'select') {
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



      if (foundRadiator) {
        // Seleccionar el radiador
        setSelectedElement(foundRadiator.id);

        // Activar modo dragging y guardar offset
        setIsDragging(true);
        setDragOffset({
          x: coords.x - foundRadiator.x,
          y: coords.y - foundRadiator.y,
        });

        console.log('Radiador seleccionado:', foundRadiator.id);
      } else if (foundBoiler) {
        // Seleccionar la caldera
        setSelectedElement(foundBoiler.id);

        // Activar modo dragging y guardar offset
        setIsDragging(true);
        setDragOffset({
          x: coords.x - foundBoiler.x,
          y: coords.y - foundBoiler.y,
        });

        console.log('Caldera seleccionada:', foundBoiler.id);
      } else if (foundPipeId) {
        // Seleccionar la tubería
        setSelectedElement(foundPipeId);
        setIsDragging(false);
        console.log('Tubería seleccionada:', foundPipeId);

      } else {
        // No se encontró ningún elemento
        setSelectedElement(null);
        setIsDragging(false);
        console.log('Deseleccionado');
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
          console.log(`⇅ Inicio de tubería VERTICAL desde:`, clickedElement.id);
        } else {
          // Segundo click: crear tubería vertical
          createManualPipe(pipeStartElement.id, clickedElement.id, 'vertical');

          console.log(`✅ Tubería VERTICAL creada:`, {
            from: pipeStartElement.id,
            to: clickedElement.id,
            floor: 'vertical'
          });

          // Resetear y volver a modo select
          setPipeStartElement(null);
          setTool('select');
        }
      } else {
        // Click en vacío: cancelar
        if (pipeStartElement) {
          console.log('❌ Marcado de tubería vertical cancelado');
          setPipeStartElement(null);
        } else {
          console.log('⚠️ Click en tubería vertical: selecciona un elemento primero');
        }
      }


      console.log('MouseDown:', {
        tool,
        action: 'down',
      });
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


    }
  };

  const handleMouseUp = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    // Desactivar dragging y panning
    setIsDragging(false);
    setIsPanning(false);
  };

  // NOTE: Zoom functions are now provided by useCanvasZoom hook



  // NOTE: Touch and wheel handlers (getTouchDistance, handleTouchStart, handleTouchMove, 
  // handleTouchEnd, handleWheel) are now provided by useCanvasZoom hook

  // Determinar el cursor según el estado
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (tool === 'select' && isDragging) return 'grabbing';
    if (tool === 'select') {
      // Verificar si el mouse está sobre algún elemento
      const overElement = radiators.some(r => isPointInsideRadiator(mousePos.x, mousePos.y, r)) ||
        boilers.some(b => isPointInsideBoiler(mousePos.x, mousePos.y, b)) ||
        pipes.some(p => isPointNearPipe(mousePos, p.points, 10));

      if (overElement) return 'grab';
      return 'default';
    }
    if (tool === 'radiator' || tool === 'boiler' || tool === 'manifold') return 'copy';
    if (tool === 'vertical-pipe') return 'crosshair';

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
        onMouseLeave={() => setIsPanning(false)}
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
      </div>
    </div>
  );
};
