import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';
import type { Manifold } from '../models/Manifold';
import type { FloorHeatingZone, LadoZona } from '../models/FloorHeatingZone';
import type { Room } from '../models/Room';
import { puertaEnLado } from './floorHeating';

// Migra puertas guardadas con el modelo viejo ({ lado, t }) al nuevo (posición
// libre { x, y, orientacion }). Sin esto, un proyecto viejo cargaría una puerta
// sin coordenadas y el ruteo/dibujo daría NaN.
function migrarPuertas(zones: FloorHeatingZone[] | undefined): FloorHeatingZone[] | undefined {
  if (!zones) return zones;
  return zones.map(z => {
    const p = z.puerta as (typeof z.puerta & { lado?: LadoZona; t?: number }) | undefined;
    if (p && 'lado' in p && p.lado && p.x === undefined) {
      return { ...z, puerta: puertaEnLado(z, p.lado, p.t ?? 0.5) };
    }
    return z;
  });
}

export interface Project {
  projectName: string;
  version: string;
  createdAt: string;
  lastModified: string;
  radiators: Radiator[];
  boilers: Boiler[];
  pipes: PipeSegment[];
  // Piso radiante — opcionales para poder leer proyectos guardados antes de v1.1
  manifolds?: Manifold[];
  floorHeatingZones?: FloorHeatingZone[];
  // Habitaciones (v1.2): datos térmicos, aislación y contorno sobre el plano
  rooms?: Room[];
  scale: number; // píxeles por metro
}

const CURRENT_PROJECT_KEY = 'currentProject';

/**
 * Guardar proyecto en localStorage (autoguardado). El plano de fondo no se
 * persiste: son imágenes grandes para localStorage. Se conservan los datos de
 * obra (elementos, circuitos, habitaciones), que es lo que cuesta rehacer.
 */
export const saveToLocalStorage = (
  radiators: Radiator[],
  boilers: Boiler[],
  pipes: PipeSegment[],
  projectName?: string,
  manifolds: Manifold[] = [],
  floorHeatingZones: FloorHeatingZone[] = [],
  rooms: Room[] = []
): void => {
  const project: Project = {
    projectName: projectName || 'Proyecto sin nombre',
    version: '1.2',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    radiators,
    boilers,
    pipes,
    manifolds,
    floorHeatingZones,
    rooms,
    scale: 50, // Por ahora fijo, después será configurable
  };

  localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
};

/**
 * Cargar el proyecto autoguardado desde localStorage. Lo consume Simulador2D al
 * montar para restaurar el trabajo tras una recarga o actualización de la PWA.
 */
export const loadFromLocalStorage = (): Project | null => {
  try {
    const saved = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!saved) return null;

    const project: Project = JSON.parse(saved);
    project.floorHeatingZones = migrarPuertas(project.floorHeatingZones);
    return project;
  } catch {
    return null;
  }
};
