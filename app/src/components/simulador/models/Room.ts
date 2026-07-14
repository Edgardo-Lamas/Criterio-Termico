export interface Room {
  id: string;
  name: string;
  area: number; // m²
  height: number; // metros (altura de techo)
  
  // Factor térmico base (Kcal/h por m³) — condensa la calidad constructiva:
  // 40 = buena aislación, 50 = estándar argentino, 60 = poca (ver cap4-potencia).
  // Es la ÚNICA fuente de la calidad constructiva del ambiente: vale igual para
  // radiadores y para piso radiante, porque la pérdida de calor no depende del
  // emisor.
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
