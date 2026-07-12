// Cliente del análisis de plano con IA (Etapa 3 del auto-diseño).
// Manda la imagen del plano de fondo a la Edge Function analizar-plano y
// devuelve, por ambiente, los datos térmicos que Claude lee del plano:
// pared exterior, nivel de ventanas y lado de la puerta.

import { supabase } from '../../../lib/supabase';

export interface AmbienteAnalizado {
  nombre: string;
  areaM2: number | null;
  paredExterior: boolean;
  ventanas: 'sin-ventanas' | 'pocas' | 'normales' | 'muchas';
  puertaLado: 'arriba' | 'abajo' | 'izquierda' | 'derecha' | null;
  confianza: 'alta' | 'media' | 'baja';
}

/**
 * Analiza el plano de fondo con IA. `imagenDataUrl` es la data URL del plano
 * (floorPlans[floor].image); `nombresConocidos` son los nombres de las
 * habitaciones ya cargadas, para que el análisis use exactamente esos rótulos.
 * Lanza Error con mensaje legible si algo falla (el llamador lo muestra).
 */
export async function analizarPlano(
  imagenDataUrl: string,
  nombresConocidos: string[]
): Promise<AmbienteAnalizado[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sesión no válida. Iniciá sesión nuevamente.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/analizar-plano`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      imageBase64: imagenDataUrl,
      nombresConocidos,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: string; message?: string };
    const msg = errorBody.message ?? errorBody.error ?? `Error ${response.status}`;
    if (response.status === 401) throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');
    throw new Error(msg);
  }

  const data = await response.json() as { ambientes?: AmbienteAnalizado[] };
  return data.ambientes ?? [];
}
