export interface Room {
  id: string;
  name: string;
  area: number; // m²
  height: number; // metros (altura de techo)
  
  // Factor térmico base (Kcal/h por m³)
  thermalFactor: 40 | 50 | 60; // Default: 50
  
  // Ajustes opcionales
  hasExteriorWall: boolean; // +15% si tiene pared exterior
  windowsLevel: 'sin-ventanas' | 'pocas' | 'normales' | 'muchas'; // 0%, +5%, +10%, +20%

  // Calidad de aislación del ambiente — define la carga de diseño en W/m²
  // cuando la habitación se calefacciona por PISO RADIANTE (ver
  // CARGA_PISO_WM2 en utils/floorHeating.ts). Default: 'media'.
  aislacion?: 'buena' | 'media' | 'mala';
  
  // Radiadores asignados a esta habitación
  radiatorIds: string[];
  
  // Planta donde está ubicada
  floor?: 'ground' | 'first';
  
  // Posición visual en el canvas (para dibujar el polígono/área)
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
