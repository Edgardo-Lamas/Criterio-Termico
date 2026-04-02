import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';

export interface Project {
  projectName: string;
  version: string;
  createdAt: string;
  lastModified: string;
  radiators: Radiator[];
  boilers: Boiler[];
  pipes: PipeSegment[];
  scale: number; // píxeles por metro
}

const CURRENT_PROJECT_KEY = 'currentProject';
const AUTOSAVE_KEY = 'autosave';

/**
 * Guardar proyecto en localStorage
 */
export const saveToLocalStorage = (
  radiators: Radiator[],
  boilers: Boiler[],
  pipes: PipeSegment[],
  projectName?: string
): void => {
  const project: Project = {
    projectName: projectName || 'Proyecto sin nombre',
    version: '1.0',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    radiators,
    boilers,
    pipes,
    scale: 50, // Por ahora fijo, después será configurable
  };

  localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
  console.log('✅ Proyecto guardado en localStorage:', projectName);
};

/**
 * Cargar proyecto desde localStorage
 */
export const loadFromLocalStorage = (): Project | null => {
  try {
    const saved = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!saved) return null;

    const project: Project = JSON.parse(saved);
    console.log('✅ Proyecto cargado desde localStorage:', project.projectName);
    return project;
  } catch (error) {
    console.error('❌ Error al cargar proyecto:', error);
    return null;
  }
};

/**
 * Descargar proyecto como archivo JSON
 */
export const downloadProjectAsJSON = (
  radiators: Radiator[],
  boilers: Boiler[],
  pipes: PipeSegment[],
  projectName: string
): void => {
  const project: Project = {
    projectName,
    version: '1.0',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    radiators,
    boilers,
    pipes,
    scale: 50,
  };

  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName.replace(/\s+/g, '_')}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ Proyecto descargado:', link.download);
};

/**
 * Cargar proyecto desde archivo JSON
 */
export const loadProjectFromFile = (file: File): Promise<Project> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project: Project = JSON.parse(content);

        // Validar estructura básica
        if (!project.radiators || !project.boilers || !project.pipes) {
          throw new Error('Archivo de proyecto inválido');
        }

        console.log('✅ Proyecto cargado desde archivo:', project.projectName);
        resolve(project);
      } catch (error) {
        console.error('❌ Error al leer archivo:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsText(file);
  });
};

/**
 * Auto-guardar proyecto (cada X segundos)
 */
export const autoSave = (
  radiators: Radiator[],
  boilers: Boiler[],
  pipes: PipeSegment[]
): void => {
  const project: Project = {
    projectName: 'Autoguardado',
    version: '1.0',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    radiators,
    boilers,
    pipes,
    scale: 50,
  };

  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
  console.log('💾 Autoguardado completado');
};

/**
 * Recuperar autoguardado
 */
export const loadAutoSave = (): Project | null => {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return null;

    const project: Project = JSON.parse(saved);
    console.log('✅ Autoguardado recuperado');
    return project;
  } catch (error) {
    console.error('❌ Error al recuperar autoguardado:', error);
    return null;
  }
};

/**
 * Limpiar localStorage
 */
export const clearStorage = (): void => {
  localStorage.removeItem(CURRENT_PROJECT_KEY);
  localStorage.removeItem(AUTOSAVE_KEY);
  console.log('🗑️ Storage limpiado');
};
