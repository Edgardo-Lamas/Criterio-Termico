export interface Point {
  x: number;
  y: number;
}

export type PipeType = 'supply' | 'return'; // IDA = supply, RETORNO = return

export interface PipeSegment {
  id: string;
  type: 'pipe';
  pipeType: PipeType; // IDA o RETORNO
  points: Point[];
  diameter: number;
  material: string;
  fromElementId?: string | null;
  toElementId?: string | null;
  length?: number;
  zone?: string | null; // ID de la habitación/zona asociada
  zIndex?: number; // Para manejar cruces (qué tubería va arriba)
  floor?: 'ground' | 'first' | 'vertical'; // Planta donde está ubicado o si es vertical entre plantas
}
