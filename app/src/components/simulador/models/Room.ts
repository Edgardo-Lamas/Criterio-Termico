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
