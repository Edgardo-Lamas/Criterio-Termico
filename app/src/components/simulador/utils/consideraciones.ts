// Consideraciones técnicas del presupuesto: se generan automáticamente a
// partir del diseño real (habitaciones, radiadores, circuitos de piso
// radiante) más las buenas prácticas de obra documentadas en los casos de
// Criterio Térmico. Se muestran en el BudgetPanel y en el PDF del presupuesto.

import type { Room } from '../models/Room';
import type { Radiator } from '../models/Radiator';
import type { TipoTiro } from '../data/catalog';
import type { FloorHeatingBudget } from './floorHeatingBudget';
import { MAX_CIRCUIT_LENGTH_M, MAX_CIRCUITOS_POR_COLECTOR } from './floorHeating';
import { calculateRoomPower } from './thermalCalculator';

// 'critica'      → compromete el funcionamiento: hay que resolverla antes de instalar
// 'atencion'     → decisión de diseño que el instalador debe contemplar
// 'recomendacion'→ buena práctica de obra que agrega valor al presupuesto
export type NivelConsideracion = 'critica' | 'atencion' | 'recomendacion';

export interface Consideracion {
  nivel: NivelConsideracion;
  titulo: string;
  detalle: string;
}

// Agua contenida en tubo PE-X 20×2 (Ø interior 16 mm): ~0,20 L por metro.
// Sirve para dimensionar el vaso de expansión cuando hay piso radiante.
const LITROS_POR_METRO_PEX20 = 0.2;

export interface ConsideracionesInput {
  rooms: Room[];
  radiators: Radiator[];
  floorHeating: FloorHeatingBudget | null;
  // Tipo de tiro de la caldera elegida en el presupuesto (si hay una elegida)
  boilerTipo?: TipoTiro | null;
}

export function generarConsideraciones({
  rooms,
  radiators,
  floorHeating,
  boilerTipo = null,
}: ConsideracionesInput): Consideracion[] {
  const criticas: Consideracion[] = [];
  const atencion: Consideracion[] = [];
  const recomendaciones: Consideracion[] = [];

  const fmt = (n: number) => n.toLocaleString('es-AR');

  // ── Del diseño de piso radiante ─────────────────────────────────────────
  if (floorHeating) {
    // Zonas que no cubren la carga térmica de la habitación (+15% de margen)
    const insuficientes = floorHeating.zonas.filter(z => z.suficiente === false);
    if (insuficientes.length > 0) {
      const lista = insuficientes
        .map(z => `${z.zoneName} (${z.coberturaPct}%)`)
        .join(', ');
      criticas.push({
        nivel: 'critica',
        titulo: `Cobertura térmica insuficiente: ${lista}`,
        detalle:
          'El piso radiante no alcanza el requerido con margen del 15% en esos ambientes. ' +
          'Opciones que no agregan otro circuito hidráulico: reducir el paso a 15 cm, subir ' +
          'la temperatura de impulsión (si la caldera lo permite), mejorar la aislación del ' +
          'ambiente, o cubrir el faltante con un panel eléctrico. OJO con confiar en el ' +
          'toallero para un baño: su potencia no suele cubrir la demanda, y con los toallones ' +
          'colgados encima pierde la convección — en ese caso, reforzar con un radiador.',
      });
    }

    // Circuitos que superan el límite hidráulico
    const excedidos = floorHeating.circuits.filter(c => c.excedeLimite);
    if (excedidos.length > 0) {
      const lista = excedidos
        .map(c => `${c.zoneName} ${c.etiqueta} (${Math.round(c.longitudTotal)} m)`)
        .join(', ');
      criticas.push({
        nivel: 'critica',
        titulo: `Circuitos que superan los ${MAX_CIRCUIT_LENGTH_M} m: ${lista}`,
        detalle:
          'Con PE-X Ø20 la pérdida de carga de un circuito tan largo compromete el caudal ' +
          'y el ambiente queda frío. Dividir la zona en más circuitos o acercar el colector.',
      });
    }

    // Colectores con más circuitos que el criterio de obra
    const porColector = new Map<string, number>();
    for (const c of floorHeating.circuits) {
      const key = c.manifoldId ?? 'sin-colector';
      porColector.set(key, (porColector.get(key) ?? 0) + 1);
    }
    const colectoresExcedidos = [...porColector.values()].filter(
      n => n > MAX_CIRCUITOS_POR_COLECTOR
    ).length;
    if (colectoresExcedidos > 0) {
      criticas.push({
        nivel: 'critica',
        titulo: `Colector con más de ${MAX_CIRCUITOS_POR_COLECTOR} circuitos`,
        detalle:
          'Más circuitos por colector dificultan el equilibrado hidráulico y reparten mal ' +
          'el caudal. Agregar un segundo colector y repartir las zonas.',
      });
    }

    // La caldera elegida no admite piso radiante: tiro natural con retornos
    // fríos condensa los gases de combustión y corroe el equipo.
    if (boilerTipo === 'natural') {
      criticas.push({
        nivel: 'critica',
        titulo: 'La caldera elegida es de tiro natural — no usar con piso radiante',
        detalle:
          'El piso devuelve el agua fría y eso hace condensar los gases de combustión dentro ' +
          'del equipo, que se corroe. Elegir una caldera de condensación (ideal: aprovecha ' +
          'ese retorno frío para rendir su máximo) o, como segunda opción, una de tiro forzado.',
      });
    }

    // Sistema mixto: radiadores (70-80°C) + piso radiante (35-45°C). En
    // vivienda es la excepción, no la regla: son dos circuitos con costo y
    // complejidad que la mayoría de los clientes no paga. Si el diseño lo
    // tiene, la advertencia justifica técnicamente qué implica sostenerlo.
    if (radiators.length > 0) {
      atencion.push({
        nivel: 'atencion',
        titulo: 'Sistema mixto: radiadores y piso radiante en la misma instalación',
        detalle:
          `Son dos circuitos con agua de impulsión incompatible (radiadores a más de 60°C, piso ${floorHeating.tempImpulsionC}°C como máximo): ` +
          'exige válvula mezcladora termostática, bomba propia para el piso y regulación ' +
          'independiente — más materiales y puesta en marcha, que encarecen la obra. En ' +
          'vivienda conviene evaluar resolver todo con un solo sistema; si el mixto se ' +
          'justifica (una ampliación, un ambiente puntual), presupuestar la mezcladora y ' +
          'explicar al cliente el porqué del costo. Nunca mandar el agua de radiadores ' +
          'directo a los circuitos de piso.',
      });
    }

    // Juntas de dilatación en paños grandes
    const zonasGrandes = floorHeating.zonas.filter(z => z.areaM2 > 40);
    if (zonasGrandes.length > 0) {
      atencion.push({
        nivel: 'atencion',
        titulo: `Paños de más de 40 m²: ${zonasGrandes.map(z => z.zoneName).join(', ')}`,
        detalle:
          'El contrapiso necesita junta de dilatación (y pasatubos con vaina en los cruces ' +
          'de tubería) para que no fisure con los ciclos térmicos.',
      });
    }

    // Caldera para piso radiante: el retorno frío del piso es justo lo que
    // la condensación aprovecha; en tiro natural ese mismo retorno condensa
    // los gases y corroe el equipo. Se omite si ya hay condensación elegida
    // (redundante) o si es tiro natural (ya disparó la crítica de arriba).
    if (boilerTipo !== 'condensacion' && boilerTipo !== 'natural') {
      recomendaciones.push({
        nivel: 'recomendacion',
        titulo: 'Caldera para piso radiante: condensación primero',
        detalle:
          'El piso trabaja con retornos fríos, y eso es exactamente lo que la caldera de ' +
          'condensación aprovecha para rendir su máximo: es la opción IDEAL. Segunda opción: ' +
          'tiro forzado (estanca). NUNCA una caldera de tiro natural: el retorno frío hace ' +
          'condensar los gases de combustión dentro del equipo y lo corroe.',
      });
    }

    // Buenas prácticas de obra — siempre que haya piso radiante
    recomendaciones.push({
      nivel: 'recomendacion',
      titulo: 'Prueba de presión antes del contrapiso',
      detalle:
        'Cargar los circuitos a presión de prueba (mínimo 6 bar, 24 h) y mantenerlos ' +
        'presurizados durante el hormigonado: cualquier daño de obra se detecta al instante.',
    });
    recomendaciones.push({
      nivel: 'recomendacion',
      titulo: 'Puesta en marcha gradual después del curado',
      detalle:
        'No calefaccionar hasta que el contrapiso cure (mínimo 21 días). Arrancar con agua ' +
        'a 20-25°C y subir de a 5°C por día hasta la temperatura de diseño.',
    });

    // Equilibrado: con circuitos de longitudes distintas, el corto roba caudal
    if (floorHeating.circuits.length > 1) {
      recomendaciones.push({
        nivel: 'recomendacion',
        titulo: 'Equilibrado de circuitos en la puesta en marcha',
        detalle:
          'El equilibrado hidráulico es fundamental: con longitudes distintas (ver tabla), el ' +
          'circuito corto roba caudal al largo y ese ambiente queda frío aunque el diseño esté ' +
          'bien. Los colectores de calidad ya traen los caudalímetros incorporados — elegir uno ' +
          'de esos y ajustarlos en la puesta en marcha.',
      });
    }

    recomendaciones.push({
      nivel: 'recomendacion',
      titulo: 'Cronotermostato: el piso tiene inercia',
      detalle:
        'El piso radiante tarda horas en entrar en régimen y en enfriarse. Un cronotermostato ' +
        'programable (arrancar antes de que se necesite, cortar antes de acostarse) mejora el ' +
        'confort y baja el consumo — vale la pena ofrecerlo. Las calderas nuevas suman sonda ' +
        'exterior para anticipar los saltos térmicos: si el equipo la admite, instalarla.',
    });

    const litrosPiso = Math.round(floorHeating.longitudTotalM * LITROS_POR_METRO_PEX20);
    if (litrosPiso > 0) {
      recomendaciones.push({
        nivel: 'recomendacion',
        titulo: `Vaso de expansión: el piso suma ~${fmt(litrosPiso)} L de agua`,
        detalle:
          `Los ${fmt(Math.round(floorHeating.longitudTotalM))} m de tubería Ø20 agregan ` +
          `~${fmt(litrosPiso)} L al volumen del sistema. Verificar que el vaso de expansión ` +
          'de la caldera alcance o agregar uno adicional (caso frecuente de sobrepresión).',
      });
    }
  }

  // ── De las habitaciones con radiadores ──────────────────────────────────
  // Habitaciones con radiadores asignados que no cubren el requerido. SIN
  // margen extra del 15% (criterio de Edgardo): el factor volumétrico ya viene
  // sobredimensionado con sus incrementos de pared exterior y ventanas. Las
  // habitaciones con piso radiante vinculado ya están cubiertas por el chequeo
  // de zonas de arriba (otra base de cálculo, ahí el 15% sí aplica).
  const roomsConPiso = new Set(
    (floorHeating?.zonas ?? []).map(z => z.roomId).filter(Boolean)
  );
  const radiadoresInsuficientes = rooms.filter(room => {
    if (room.radiatorIds.length === 0 || roomsConPiso.has(room.id)) return false;
    const instalado = room.radiatorIds.reduce((sum, id) => {
      const rad = radiators.find(r => r.id === id);
      return sum + (rad?.power ?? 0);
    }, 0);
    return instalado < Math.round(calculateRoomPower(room));
  });
  if (radiadoresInsuficientes.length > 0) {
    criticas.push({
      nivel: 'critica',
      titulo: `Radiadores insuficientes en: ${radiadoresInsuficientes.map(r => r.name).join(', ')}`,
      detalle:
        'La potencia instalada no cubre el requerido del ambiente. Agregar elementos ' +
        'o un radiador más en esos ambientes.',
    });
  }

  // Zona de frío intenso (factor 60): caso documentado de rotura por congelamiento
  if (rooms.some(r => r.thermalFactor === 60)) {
    atencion.push({
      nivel: 'atencion',
      titulo: 'Zona de frío intenso',
      detalle:
        'Si la vivienda queda deshabitada en invierno, evaluar anticongelante inhibido para ' +
        'calefacción (en la proporción del fabricante) o vaciado del sistema: el congelamiento ' +
        'rompe tuberías y cuerpos de caldera.',
    });
  }

  // Buenas prácticas generales de obra (casos y protocolo de Criterio Térmico)
  if (radiators.length > 0 || floorHeating) {
    // Protocolo de obra: la tubería queda cargada y vigilada hasta la entrega.
    // Diferencial profesional: cualquier daño de otro gremio se detecta en el
    // momento y el cliente recibe la red garantizada.
    recomendaciones.push({
      nivel: 'recomendacion',
      titulo: 'Tubería presurizada hasta el fin de obra',
      detalle:
        'Protocolo sugerido: dejar un manómetro montado en la posición de la caldera, unir ' +
        'ida y retorno con un by-pass y mantener toda la tubería cargada a 3 bar hasta ' +
        'terminar la obra. Si cualquier gremio daña un caño por accidente, el manómetro lo ' +
        'delata en el momento, y el control queda en manos del arquitecto o dueño de obra: ' +
        'la etapa de obra es cuando las reparaciones se pueden hacer. En la entrega se ' +
        'demuestra al cliente que la red quedó intacta de punta a punta.',
    });

    recomendaciones.push({
      nivel: 'recomendacion',
      titulo: 'Registro del tendido antes de tapar',
      detalle:
        'Fotografiar todo el tendido antes del contrapiso o cierre de paredes y archivarlo ' +
        'junto con el plano técnico de esta app. Ante una reforma futura o un reclamo se ' +
        'sabe exactamente por dónde pasa cada caño — evita perforaciones y discusiones.',
    });

    recomendaciones.push({
      nivel: 'recomendacion',
      titulo: 'Llenado y presión del sistema',
      detalle:
        'Cargar con el sistema frío a 1-1,5 bar, purgar todos los emisores y verificar la ' +
        'presión a las 48 h. Si la red de agua supera los 4 bar, llenar con reductora: la ' +
        'sobrepresión de red es causa frecuente de goteo por la válvula de seguridad.',
    });
  }

  return [...criticas, ...atencion, ...recomendaciones];
}
