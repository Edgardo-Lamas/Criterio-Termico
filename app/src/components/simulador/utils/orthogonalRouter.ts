// Ruteo ortogonal sobre grilla (A*) para acometidas y montantes de piso
// radiante. Esquiva rectángulos prohibidos (zonas ajenas), penaliza los giros
// (prefiere tramos rectos, como un tendido real) y penaliza pisar celdas ya
// ocupadas por otros tubos, de modo que varios recorridos al mismo colector
// corren en paralelo ("peine") en vez de superponerse.

export interface RouterPoint {
  x: number;
  y: number;
}

export interface RouterRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RuteoParams {
  start: RouterPoint;
  goal: RouterPoint;
  obstaculos: RouterRect[];   // prohibido atravesar
  ocupadas: Set<string>;      // celdas con tubos ya tendidos (penalizadas, no prohibidas)
  area: RouterRect;           // límites de búsqueda
  gridSize?: number;          // px por celda (default 10 px = 0.2 m a 50 px/m)
}

const GRID_DEFAULT = 10;
// Costos en unidades de celda ×10 para trabajar con enteros
const COSTO_PASO = 10;
const COSTO_GIRO = 30;      // prefiere tramos rectos
const COSTO_OCUPADA = 60;   // pisar otro tubo es caro pero no imposible
const MAX_NODOS = 60000;    // corte de seguridad

const clave = (cx: number, cy: number) => cx * 100000 + cy;
export const claveCelda = (cx: number, cy: number): string => `${cx},${cy}`;

// dx, dy por dirección: 0=derecha 1=abajo 2=izquierda 3=arriba
const DIRS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
];

/** Bounding box de un conjunto de rectángulos con margen alrededor. */
export function areaDeTrabajo(rects: RouterRect[], margenPx = 150): RouterRect {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return {
    x: minX - margenPx,
    y: minY - margenPx,
    width: maxX - minX + 2 * margenPx,
    height: maxY - minY + 2 * margenPx,
  };
}

/** Marca las celdas de una polilínea ortogonal como ocupadas (para el peine). */
export function marcarRuta(ocupadas: Set<string>, path: RouterPoint[], gridSize = GRID_DEFAULT): void {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const pasos = Math.max(
      Math.abs(Math.round((b.x - a.x) / gridSize)),
      Math.abs(Math.round((b.y - a.y) / gridSize)),
      1
    );
    for (let s = 0; s <= pasos; s++) {
      const x = a.x + ((b.x - a.x) * s) / pasos;
      const y = a.y + ((b.y - a.y) * s) / pasos;
      ocupadas.add(claveCelda(Math.round(x / gridSize), Math.round(y / gridSize)));
    }
  }
}

// Cola de prioridad mínima (binary heap) para A*
class MinHeap {
  private costos: number[] = [];
  private valores: number[] = [];

  get size(): number { return this.costos.length; }

  push(costo: number, valor: number): void {
    this.costos.push(costo);
    this.valores.push(valor);
    let i = this.costos.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.costos[p] <= this.costos[i]) break;
      this.swap(i, p);
      i = p;
    }
  }

  pop(): number {
    const top = this.valores[0];
    const lastC = this.costos.pop() as number;
    const lastV = this.valores.pop() as number;
    if (this.costos.length > 0) {
      this.costos[0] = lastC;
      this.valores[0] = lastV;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let m = i;
        if (l < this.costos.length && this.costos[l] < this.costos[m]) m = l;
        if (r < this.costos.length && this.costos[r] < this.costos[m]) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    [this.costos[a], this.costos[b]] = [this.costos[b], this.costos[a]];
    [this.valores[a], this.valores[b]] = [this.valores[b], this.valores[a]];
  }
}

/**
 * Rutea un camino ortogonal de start a goal esquivando los obstáculos.
 * Devuelve la polilínea simplificada (vértices en los giros) o null si no
 * encontró camino dentro del límite de búsqueda.
 */
export function rutearOrtogonal(params: RuteoParams): RouterPoint[] | null {
  const grid = params.gridSize ?? GRID_DEFAULT;
  const area = params.area;
  const minCX = Math.floor(area.x / grid);
  const minCY = Math.floor(area.y / grid);
  const maxCX = Math.ceil((area.x + area.width) / grid);
  const maxCY = Math.ceil((area.y + area.height) / grid);

  const startCX = Math.round(params.start.x / grid);
  const startCY = Math.round(params.start.y / grid);
  const goalCX = Math.round(params.goal.x / grid);
  const goalCY = Math.round(params.goal.y / grid);

  // Celdas prohibidas: se bloquean solo las celdas cuyo CENTRO cae dentro
  // del obstáculo inflado media celda (ceil/floor exactos, no round, para
  // no comerse un carril extra alrededor de cada zona).
  const bloqueadas = new Set<number>();
  const inflado = grid * 0.6;
  for (const r of params.obstaculos) {
    const x0 = Math.ceil((r.x - inflado) / grid);
    const y0 = Math.ceil((r.y - inflado) / grid);
    const x1 = Math.floor((r.x + r.width + inflado) / grid);
    const y1 = Math.floor((r.y + r.height + inflado) / grid);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        bloqueadas.add(clave(cx, cy));
      }
    }
  }
  // Origen y destino siempre transitables (pueden estar pegados a un borde)
  bloqueadas.delete(clave(startCX, startCY));
  bloqueadas.delete(clave(goalCX, goalCY));

  // Estado A*: celda + dirección de llegada (para penalizar giros).
  // id = ((cx - minCX) * ancho + (cy - minCY)) * 4 + dir
  const anchoY = maxCY - minCY + 1;
  const idDe = (cx: number, cy: number, dir: number) =>
    ((cx - minCX) * anchoY + (cy - minCY)) * 4 + dir;

  const gCosto = new Map<number, number>();
  const padre = new Map<number, number>();
  const heap = new MinHeap();
  const h = (cx: number, cy: number) => (Math.abs(cx - goalCX) + Math.abs(cy - goalCY)) * COSTO_PASO;

  // Arranque: sin dirección previa (las 4 salidas cuestan igual)
  for (let dir = 0; dir < 4; dir++) {
    const ncx = startCX + DIRS[dir].dx;
    const ncy = startCY + DIRS[dir].dy;
    if (ncx < minCX || ncx > maxCX || ncy < minCY || ncy > maxCY) continue;
    if (bloqueadas.has(clave(ncx, ncy))) continue;
    let costo = COSTO_PASO;
    if (params.ocupadas.has(claveCelda(ncx, ncy))) costo += COSTO_OCUPADA;
    const id = idDe(ncx, ncy, dir);
    gCosto.set(id, costo);
    padre.set(id, -1 - dir); // marca de "vino del arranque con dirección dir"
    heap.push(costo + h(ncx, ncy), id);
  }

  let visitados = 0;
  let idFinal = -1;

  while (heap.size > 0 && visitados < MAX_NODOS) {
    const id = heap.pop();
    visitados++;

    const dir = id % 4;
    const resto = (id - dir) / 4;
    const cy = (resto % anchoY) + minCY;
    const cx = (resto - (cy - minCY)) / anchoY + minCX;

    if (cx === goalCX && cy === goalCY) {
      idFinal = id;
      break;
    }

    const gAct = gCosto.get(id) as number;

    for (let ndir = 0; ndir < 4; ndir++) {
      if ((ndir + 2) % 4 === dir) continue; // no volver sobre sus pasos
      const ncx = cx + DIRS[ndir].dx;
      const ncy = cy + DIRS[ndir].dy;
      if (ncx < minCX || ncx > maxCX || ncy < minCY || ncy > maxCY) continue;
      if (bloqueadas.has(clave(ncx, ncy))) continue;

      let costo = gAct + COSTO_PASO;
      if (ndir !== dir) costo += COSTO_GIRO;
      if (params.ocupadas.has(claveCelda(ncx, ncy))) costo += COSTO_OCUPADA;

      const nid = idDe(ncx, ncy, ndir);
      const previo = gCosto.get(nid);
      if (previo !== undefined && previo <= costo) continue;
      gCosto.set(nid, costo);
      padre.set(nid, id);
      heap.push(costo + h(ncx, ncy), nid);
    }
  }

  if (idFinal < 0) return null;

  // Reconstruir el camino en celdas
  const celdas: { cx: number; cy: number }[] = [];
  let id: number = idFinal;
  while (id >= 0) {
    const dir = id % 4;
    const resto = (id - dir) / 4;
    const cy = (resto % anchoY) + minCY;
    const cx = (resto - (cy - minCY)) / anchoY + minCX;
    celdas.push({ cx, cy });
    id = padre.get(id) as number;
  }
  celdas.push({ cx: startCX, cy: startCY });
  celdas.reverse();

  // A puntos px (centros de celda) y simplificar colineales
  const pts: RouterPoint[] = celdas.map(c => ({ x: c.cx * grid, y: c.cy * grid }));
  const simple: RouterPoint[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = simple[simple.length - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const colineal = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!colineal) simple.push(b);
  }
  simple.push(pts[pts.length - 1]);

  // Camino de un solo tramo: devolver una L exacta entre los puntos reales
  if (simple.length <= 2) {
    return [
      { ...params.start },
      { x: params.goal.x, y: params.start.y },
      { ...params.goal },
    ];
  }

  // Reemplazar extremos por los puntos exactos manteniendo ortogonalidad:
  // se ajusta la coordenada libre del vértice vecino.
  const p1 = simple[1];
  if (p1.x === simple[0].x) p1.x = params.start.x; else p1.y = params.start.y;
  simple[0] = { ...params.start };

  const pu = simple[simple.length - 2];
  if (pu.x === simple[simple.length - 1].x) pu.x = params.goal.x; else pu.y = params.goal.y;
  simple[simple.length - 1] = { ...params.goal };

  return simple;
}
