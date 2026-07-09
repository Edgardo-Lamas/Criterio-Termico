export interface ElementBase {
  id: string;
  type: 'radiator' | 'boiler' | 'pipe' | 'manifold' | 'floor-heating-zone';
  x: number;
  y: number;
}
