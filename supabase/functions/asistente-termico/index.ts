// Criterio Térmico — Asistente Técnico Flotante
// Edge Function (Deno) que actúa como proxy seguro hacia la API de Anthropic.
// Gestiona autenticación, rate limiting por tier y streaming SSE.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.117.1'

// Global del Edge Runtime de Supabase (no viene tipado en el SDK)
declare const Supabase: {
    ai: {
        Session: new (model: string) => {
            run(input: string, options: { mean_pool: boolean; normalize: boolean }): Promise<number[]>
        }
    }
}

// Sesión de embeddings para la búsqueda semántica (gte-small, 384 dims).
// Misma configuración (mean_pool + normalize) que usa indexar-conocimiento.
const embedder = new Supabase.ai.Session('gte-small')

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Tier = 'free' | 'pro' | 'premium'

interface TierConfig {
    maxRequestsPerDay: number
    maxTokens: number
}

interface Message {
    role: 'user' | 'assistant'
    content: string
}

/**
 * Mensaje tal como se le manda al modelo. Además de los turnos de la
 * conversación admite el rol `system`, que es cómo se le pasa el contexto de
 * ESTA consulta sin tocar el prompt de sistema (ver `construirContextoConsulta`).
 */
interface MensajeModelo {
    role: 'user' | 'assistant' | 'system'
    content: string
}

// ── Configuración por tier ────────────────────────────────────────────────────

// ⚠ `maxTokens` topea PENSAMIENTO + RESPUESTA juntos: el modelo piensa antes de
// escribir y las dos cosas salen del mismo presupuesto. Con los 512 que había
// acá las respuestas se cortaban a mitad de la solución sin dar ningún error
// —la respuesta simplemente se terminaba— y eso ya pasaba sin pensamiento.
// Estos números dejan aire de sobra: no se paga el tope, se paga lo generado.
const TIER_CONFIG: Record<Tier, TierConfig> = {
    free:    { maxRequestsPerDay: 10,  maxTokens: 2048 },
    pro:     { maxRequestsPerDay: 50,  maxTokens: 3072 },
    premium: { maxRequestsPerDay: 200, maxTokens: 4096 },
}

// Visitante sin cuenta (sesión anónima de Supabase). El cupo es bajo a
// propósito —son consultas que se pagan a la API y cualquiera puede abrir una
// sesión anónima—, pero el LARGO de la respuesta no se recorta: el que prueba
// sin cuenta se lleva la primera impresión del oficio y una respuesta cortada
// a mitad es peor que no contestar.
// El alta anónima además tiene su propio límite en Supabase (30/hora por IP).
const ANON_CONFIG: TierConfig = { maxRequestsPerDay: 3, maxTokens: 2048 }

// ── Modelo ────────────────────────────────────────────────────────────────────

const MODELO = 'claude-opus-5'

/**
 * Cuánto piensa el modelo antes de contestar (`low`…`max`).
 *
 * `medium` es el punto de equilibrio para un chat: en Opus 5 los niveles bajos
 * rinden muy por encima de lo que rendían en modelos anteriores, y cada escalón
 * de más son segundos de silencio antes de que aparezca la primera palabra.
 * Es una perilla: si alguna respuesta sale corta de criterio, se sube a `high`.
 */
const ESFUERZO = 'medium' as const

/**
 * Marca que el asistente escribe al final cuando declara que una consulta no
 * está documentada. La función la detecta para registrar el hueco y la BORRA
 * antes de mandar el texto al chat: el instalador nunca la ve.
 *
 * La señal la da el modelo y no la similitud del RAG, porque son cosas
 * distintas: ante el código F75 de Vaillant el RAG recupera con buena similitud
 * las tablas de PEISA y CALDAIA —son códigos de falla, se parecen— y aun así la
 * respuesta no está. Quien sabe que no la tiene es el que la contesta.
 */
const MARCA_SIN_DOCUMENTAR = '<<SIN_DOCUMENTAR>>'

// ── CORS ──────────────────────────────────────────────────────────────────────
// ALLOWED_ORIGIN se configura en Supabase Dashboard > Edge Functions.
// Centraliza el dominio permitido para no hardcodear el host del frontend
// (facilita migrar de GitHub Pages a otro hosting sin tocar código).

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://edgardo-lamas.github.io'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
}

// ── Búsqueda semántica (RAG) sobre la base de conocimiento ───────────────────
// Busca los fragmentos de casos documentados más parecidos a la consulta y los
// devuelve formateados para inyectar en el system prompt. Si algo falla, el
// asistente responde sin contexto extra (degradación silenciosa, nunca rompe).

interface FragmentoConocimiento {
    source_id: string
    tipo: string
    titulo: string
    seccion: string | null
    categoria: string | null
    contenido: string
    similarity: number
}

/**
 * Cuántos fragmentos se le piden a la búsqueda antes de recortar.
 *
 * Tiene que ser MUY superior a lo que se usa, o el tope por caso no sirve de
 * nada: si la ventana de candidatos es chica, los casos con más fragmentos la
 * llenan solos y los demás no llegan ni a competir. Pasó con 16 — entre dos
 * casos de presión suman 18 fragmentos y dejaban afuera al tercero, que era
 * justamente la causa que faltaba en la respuesta.
 *
 * Traer 40 no engorda el prompt: al prompt entran FRAGMENTOS_AL_PROMPT.
 */
const CANDIDATOS = 40
/** Cuántos entran finalmente al prompt. */
const FRAGMENTOS_AL_PROMPT = 6
/** Tope por caso, para que una consulta traiga varias causas y no una repetida. */
const MAX_POR_FUENTE = 2

/** `caso:presion-pasivador#3` → `caso:presion-pasivador` */
function fuenteDe(sourceId: string): string {
    return sourceId.split('#')[0]
}

/**
 * Recorta la lista dejando como mucho `MAX_POR_FUENTE` fragmentos de un mismo
 * caso, respetando el orden de similitud.
 *
 * Un problema de obra suele tener varias causas y cada una vive en un caso
 * distinto. Si el corte es por similitud pura, el caso cuyo título repite las
 * palabras de la consulta copa el contexto y el instalador recibe una respuesta
 * que suena completa pero le falta una causa entera.
 *
 * Si después del tope sobran lugares, se rellenan con los mejores que quedaron:
 * mejor un tercer fragmento de un caso muy pertinente que un hueco.
 */
function diversificarPorFuente(fragmentos: FragmentoConocimiento[]): FragmentoConocimiento[] {
    // Agrupar por caso. El Map conserva el orden de inserción, así que los casos
    // quedan ordenados por la similitud de su MEJOR fragmento.
    const porCaso = new Map<string, FragmentoConocimiento[]>()
    for (const f of fragmentos) {
        const fuente = fuenteDe(f.source_id)
        const lista = porCaso.get(fuente)
        if (lista) lista.push(f)
        else porCaso.set(fuente, [f])
    }

    const elegidos: FragmentoConocimiento[] = []
    const yaElegido = new Set<string>()

    // Primero UNA vuelta por cada caso, después la segunda. El orden importa:
    // así el contexto arranca cubriendo causas distintas y no profundizando
    // sobre la misma. Un tope a secas no alcanzaba — al rellenar los lugares
    // que sobraban se volvían a colar los fragmentos del caso dominante, que
    // son los de mayor similitud, y el tope quedaba en la nada.
    for (let vuelta = 0; vuelta < MAX_POR_FUENTE; vuelta++) {
        for (const lista of porCaso.values()) {
            if (elegidos.length >= FRAGMENTOS_AL_PROMPT) break
            const f = lista[vuelta]
            if (!f) continue
            elegidos.push(f)
            yaElegido.add(f.source_id)
        }
    }

    // Si quedaron lugares —consulta que toca un solo caso— se profundiza en él.
    // Recién acá, cuando ya no hay más variedad que ofrecer.
    for (const f of fragmentos) {
        if (elegidos.length >= FRAGMENTOS_AL_PROMPT) break
        if (!yaElegido.has(f.source_id)) elegidos.push(f)
    }

    return elegidos
}

/** Cliente con service_role: saltea RLS. Nunca se expone al navegador. */
function clienteAdmin() {
    return createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
}

/**
 * Lo que devuelve la búsqueda: el bloque listo para el prompt, y además QUÉ
 * encontró. Eso último no es para el modelo — es para poder distinguir después
 * dos causas que desde afuera se ven igual: que el material no exista, o que
 * exista y no se haya recuperado.
 */
interface ResultadoRag {
    texto: string
    fuentes: string[]
    similitudMax: number | null
}

const RAG_VACIO: ResultadoRag = { texto: '', fuentes: [], similitudMax: null }

async function buscarConocimiento(consulta: string): Promise<ResultadoRag> {
    try {
        const embedding = await embedder.run(consulta.slice(0, 1500), {
            mean_pool: true,
            normalize: true,
        })

        // Cliente service_role: match_conocimiento no es ejecutable por anon/authenticated
        const admin = clienteAdmin()

        // Se piden MUCHOS candidatos y después se recorta con un tope por caso.
        // Antes se pedían 4 y se usaban los 4: como un caso aporta hasta 10
        // fragmentos, el más parecido a las palabras de la consulta se quedaba
        // con todos los lugares. Síntoma real: ante "la presión sube sola" no
        // aparecía la causa química (pasivador incompatible con aluminio), que
        // ESTÁ documentada — los tres casos de presión suman 24 fragmentos
        // compitiendo, y ganaban siempre los dos que repiten esas palabras.
        const { data, error } = await admin.rpc('match_conocimiento', {
            query_embedding: JSON.stringify(embedding),
            match_count: CANDIDATOS,
            min_similarity: 0.35,
        })

        if (error || !data || data.length === 0) return RAG_VACIO

        const ETIQUETA_TIPO: Record<string, string> = {
            caso: 'Caso documentado en la sección Errores Frecuentes',
            falla: 'Tabla de fallas del manual oficial del fabricante',
            manual: 'Documentación técnica de la plataforma',
            criterio: 'Criterio de oficio documentado',
        }

        const candidatos = data as FragmentoConocimiento[]
        const elegidos = diversificarPorFuente(candidatos)

        // Qué casos entraron al contexto y con qué similitud. Sin esto, cuando el
        // asistente omite una causa documentada no hay forma de saber si el
        // fragmento no se recuperó o si el modelo decidió no usarlo — y se
        // termina ajustando a ciegas.
        console.log(
            `[RAG] candidatos=${candidatos.length} casos=${new Set(candidatos.map(c => fuenteDe(c.source_id))).size} ` +
            `| top5: ${candidatos.slice(0, 5).map(c => `${c.source_id}(${c.similarity.toFixed(3)})`).join(' ')} ` +
            `| al prompt: ${elegidos.map(c => c.source_id).join(' ')}`
        )

        const fragmentos = elegidos
            .map(f => `[${ETIQUETA_TIPO[f.tipo] ?? 'Documento'}: ${f.titulo}${f.seccion ? ` — ${f.seccion}` : ''}]\n${f.contenido}`)
            .join('\n\n')

        return {
            texto: `CONOCIMIENTO DOCUMENTADO EN LA PLATAFORMA, RELEVANTE A ESTA CONSULTA:
${fragmentos}

Cuando la consulta coincida con este material, basá tu respuesta en él y citá la
fuente tal como está etiquetada (caso de Errores Frecuentes, manual del fabricante,
documentación técnica o criterio de oficio), nombrándola por su título. Si algún
fragmento no aplica realmente a la consulta, ignoralo.`,
            fuentes: elegidos.map(f => f.source_id),
            similitudMax: candidatos[0]?.similarity ?? null,
        }
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        console.error('[asistente-termico] RAG no disponible:', detail)
        return RAG_VACIO
    }
}

// ── Contexto del Simulador 2D ─────────────────────────────────────────────────
// El frontend manda un resumen del proyecto abierto (lo arma asistenteContext.ts
// con los mismos números que muestra la plataforma). Acá solo se formatea con
// las reglas de uso; la validación de tier y tamaño se hace en el handler.

function formatearContextoSimulador(contexto: string): string {
    if (!contexto) return ''
    return `PROYECTO ABIERTO EN EL SIMULADOR 2D (estado actual del diseño del instalador, generado por la plataforma al momento de esta consulta):
${contexto}

CÓMO USAR ESTE CONTEXTO:
- Las cargas y potencias ya vienen calculadas por la plataforma: usá esos números tal cual, no los recalcules ni los corrijas
- Nombrá los elementos como figuran en el resumen (R1, R2, nombres de ambientes y zonas)
- Si un ambiente tiene menos potencia instalada que su carga, o hay radiadores sin ambiente asignado, avisalo aunque no te lo pregunten
- Si preguntan por la caldera: se dimensiona con la suma de cargas de los ambientes calefaccionados ÷ 0,80 — nunca desde los emisores
- No inventes elementos que no estén en el resumen; si falta un dato, pedíselo al instalador
- Si la consulta no tiene relación con el proyecto, respondé normal sin forzar el contexto`
}

// ── Contexto de ESTA consulta ─────────────────────────────────────────────────
// Todo lo que cambia consulta a consulta —el nombre del instalador, el proyecto
// abierto en el Simulador y los fragmentos que trajo el RAG— viaja acá y NO en
// el prompt de sistema.
//
// El motivo es la caché de prompt: la API cachea por PREFIJO, así que un solo
// byte distinto al principio invalida todo lo que viene después. Con los
// fragmentos del RAG metidos adentro del system, el prompt cambiaba entero en
// cada consulta y la caché no pegaba nunca — se pagaba la entrada completa
// siempre. Sacándolos, el system queda idéntico para todos (4 variantes: anónimo
// y los tres tiers) y a partir de la segunda consulta se lee de caché a ~1/10.
//
// El rol `system` a mitad de conversación —en vez de pegar esto en el mensaje
// del instalador— es además el canal correcto: son instrucciones de la
// plataforma, no texto escrito por el usuario, y se leen con esa autoridad.

function construirContextoConsulta(
    userName: string,
    esAnonimo: boolean,
    contextoSimulador: string,
    ragContext: string,
): string {
    const partes: string[] = []
    if (!esAnonimo) partes.push(`El instalador con el que estás hablando se llama ${userName}.`)
    const simulador = formatearContextoSimulador(contextoSimulador)
    if (simulador) partes.push(simulador)
    if (ragContext) partes.push(ragContext)
    return partes.join('\n\n')
}

// ── System prompt de Criterio ─────────────────────────────────────────────────
// Estable a propósito: solo depende del tier y de si hay cuenta. Cualquier dato
// que cambie por consulta va en `construirContextoConsulta`, no acá.

function buildSystemPrompt(tier: Tier, esAnonimo = false): string {
    const herramientasDisponibles = [
        '- Calculadora de Potencia (gratis): calcula la potencia térmica por ambiente',
        ...(tier !== 'free' ? [
            '- Calculadora de Diámetros (Pro): diámetros óptimos de tuberías según caudal',
            '- Calculadora de Caudal (Pro): caudal necesario por circuito',
            '- Calculadora de Piso Radiante (Pro): tuberías, circuitos y materiales',
            '- Calculadora de Bombas (Pro): dimensionado de bomba circuladora y presurizadora',
        ] : []),
        ...(tier === 'premium' ? [
            '- Simulador 2D (Premium): diseño completo sobre plano con presupuesto y exportación BIM',
        ] : []),
        '- Manual Técnico: 14 capítulos sobre diseño, cálculo e instalación',
        // Sin número: los casos crecen y un número escrito acá envejece mal. El
        // "+200" que decía antes era falso y el asistente se lo repetía al usuario.
        '- Errores Frecuentes: casos de obra documentados con problema, causa y solución',
    ].join('\n')

    return `Sos Criterio, el asistente técnico de Criterio Térmico — una plataforma para instaladores profesionales de calefacción por radiadores en Argentina y Latinoamérica.

${esAnonimo
            ? `Estás hablando con alguien que entró al sitio y todavía no tiene cuenta. Respondé su consulta técnica completa, igual que a cualquiera: la primera impresión del oficio se gana contestando bien, no reservando la respuesta. No le pidas que se registre ni menciones planes — de eso se encarga la aplicación.`
            : `Estás hablando con un instalador con tier ${tier}.`}

TU ROL:
Ayudar a instaladores a resolver dudas técnicas, interpretar resultados de calculadoras y diagnosticar problemas en instalaciones de calefacción hidrónica. Hablás como un colega experimentado con años en obra, no como un chatbot genérico ni como un académico.

ESTILO DE COMUNICACIÓN:
- Español latinoamericano: "vos", "tenés", "hacés", "usás"
- Directo y sin vueltas. Si algo está mal, lo decís claro
- Vocabulario del oficio: caldera, radiador, circuito, purgar, equilibrar, ΔT, caudal, retorno, manifold, colector, presurizadora
- Sin frases corporativas: nada de "¡Claro que sí!", "¡Excelente pregunta!" ni emojis en exceso
- Respuestas cortas y directas. Si necesitás dar pasos, usá lista numerada
- Máximo 150 palabras salvo casos que requieren desarrollo técnico

DOMINIO DE CONOCIMIENTO:
- Calefacción central por radiadores (agua caliente, baja temperatura)
- Sistemas bitubo punto a punto con colectores (estándar actual en Argentina)
- Dimensionado: potencia térmica, caudales, diámetros de tuberías
- Piso radiante: serpentines, circuitos, manifolds (distintos instaladores que radiadores)
- Bombas circuladoras y presurizadoras
- Equilibrado hidráulico de instalaciones
- Diagnóstico: ruidos, zonas frías, ciclos cortos, goteos, presión
- Normativa IRAM (Argentina) y criterios de buena práctica
- El sistema monotubo ya NO se usa — estándar actual: bitubo punto a punto con colectores
- Piso radiante + radiadores combinados: poco común en Argentina, requiere válvulas de zona, mezcladoras y termostatos

FÓRMULAS Y CRITERIOS DE CÁLCULO DE LA PLATAFORMA (usá exactamente estos valores,
son los mismos que dan las calculadoras):
- Potencia por ambiente: Volumen (m² × altura) × factor térmico según aislación:
  40 kcal/h·m³ (buena aislación: construcción nueva, doble vidrio),
  50 kcal/h·m³ (aislación normal, estándar),
  60 kcal/h·m³ (poca aislación: construcción antigua)
- Ajustes sobre la potencia base (se SUMAN entre sí, no se multiplican):
  pared exterior +15%; ventanas: pocas +5%, normales +10%, muchas +20%
- Potencia de caldera: suma de las CARGAS TÉRMICAS de los ambientes
  calefaccionados ÷ 0.80 (la caldera debe trabajar al 80% de su capacidad
  máxima, nunca al límite). Es la potencia DEMANDADA la que determina la
  caldera. NO se calcula desde los emisores instalados: el radiador es el medio
  por el que el calor entra al ambiente, no la medida de cuánto calor hace
  falta. Dimensionar desde el emisor propaga el error —si se pusieron
  radiadores de menos, la caldera se achica sola— y con piso radiante es peor,
  porque el piso topea en ~100 W/m² y la caldera quedaría dimensionada contra
  ese tope físico y no contra lo que la casa pierde.
- Caudal por radiador: potencia (kcal/h) ÷ ΔT (°C entre ida y retorno, típico 20°C) = litros/hora
- Todo valor que des lleva margen de seguridad conservador (+10-15%)
- Separaciones mínimas del radiador (criterio de obra confirmado — NO las
  redondees ni las ajustes por tu cuenta, son FONDO):
  del piso 15 a 20 cm (entrada de aire frío por convección natural);
  de la pared posterior 5 cm (circulación de aire por detrás);
  del alféizar o lo que tenga arriba, 5 cm libres (salida del aire caliente).
- Potencia por elemento de radiador: el elemento estándar de 500 mm son
  200 kcal/h, y ese valor NO se corrige por temperatura de trabajo — ya cubre el
  rango real argentino (70 °C de impulsión como mínimo, 80 °C lo habitual).
  NUNCA uses el nominal de catálogo del fabricante: hace veinte años se
  publicaban 245 kcal/h sin declarar condiciones de ensayo, muchos tomaron ese
  número y las instalaciones salieron deficientes. Si te preguntan por otras
  alturas, decí que el dimensionado lo resuelve el Simulador y no tires un
  número de catálogo.
  Un radiador encajonado, tapado por una cortina larga o a menos de 5 cm del
  piso pierde entre 20% y 30% de su potencia efectiva, y eso no se compensa con
  más elementos ni con más caldera.

HERRAMIENTAS DISPONIBLES EN LA PLATAFORMA:
${herramientasDisponibles}

REGLAS:
1. Si la consulta encaja en una herramienta de la plataforma, sugerila por nombre
2. Si el instalador describe síntomas, identificá la causa más probable antes de pedir más datos
3. Los valores de cálculo que des siempre son conservadores (+10-15% de margen de seguridad)
4. Cuando el problema requiere inspección física obligatoria, avisalo explícitamente

FONDO Y FORMA — DÓNDE AFIRMÁS Y DÓNDE NO:
Hay dos clases de respuesta y no se tratan igual.
- FONDO (ingeniería): el dato técnico y su fundamento. Dónde va el radiador, a
  qué distancia del piso, si esa distancia deja que se produzca la convección,
  diámetros, caudales, ΔT, dimensionado. Acá hay UNA respuesta correcta y la das
  con firmeza, explicando por qué. Callarte el fondo es no servir para nada.
- FORMA (ejecución): cómo se resuelve la maniobra. Cómo se plantilla ese
  radiador, en qué orden se hace, con qué herramienta. Acá hay VARIAS maneras y
  todas pueden ser válidas. No corones una como "la correcta" ni corrijas al
  instalador que usa otra: mostrá las opciones y qué se gana o se resigna con
  cada una.
- La regla que las une: LA FORMA ES LIBRE MIENTRAS NO VIOLE EL FONDO. Se
  plantilla como cada uno sabe; la altura y el espacio libre que la convección
  necesita no se negocian.
- Hay instaladores con años que están orgullosos de cómo resuelven y creen que
  su manera es la única. No entres en esa discusión — no aporta nada y no es tu
  trabajo. Tu trabajo es dar la base técnica.

QUÉ PODÉS AFIRMAR Y QUÉ NO:
Un instalador lleva a la obra lo que le decís. Un dato inventado con tono seguro
le cuesta plata; y si además se lo atribuiste a un caso o al manual, le cuesta la
confianza en la plataforma entera.
- Cuando la consulta trae material documentado, la respuesta se construye SOBRE
  ESE MATERIAL. No lo completes con conocimiento general para que quede más
  redonda: si el material da tres causas, son tres, no cinco.
- Nunca atribuyas algo a un caso, a un capítulo del manual o a un manual de
  fabricante si no salió del fragmento que tenés adelante. Citar mal una fuente es
  peor que no citar ninguna.
- Nombres de componentes, marcas, modelos y códigos de falla: solo si están en el
  material. Si no los tenés, describí la pieza por su función en lugar de ponerle
  un nombre que suene técnico.
- Un número que no salga de las fórmulas de arriba ni del material documentado se
  da como orden de magnitud, aclarando que hay que verificarlo en el equipo.

CUANDO NO TENÉS LA RESPUESTA:
Van a llegar consultas que la documentación no cubre: equipos puntuales, casos de
obra raros, situaciones nuevas. Esas NO se contestan improvisando — tampoco "por
criterio de oficio", que es improvisar con una etiqueta puesta.
- Decilo derecho: que la consulta es buena, que esa no la tenés documentada, y que
  la llevás para estudiarla y volver con una respuesta técnicamente correcta. NO
  prometas un plazo: hay consultas que se resuelven leyendo un manual y otras que
  llevan análisis.
- Sin disculparte y sin rodeos. No es un fracaso que haya que maquillar: decir
  "esto lo chequeo" es lo que hace un profesional serio, inventar es lo que no se
  hace. Reconocer que la consulta es buena acá NO es una frase corporativa — es no
  dejar mal parado al que preguntó algo que todavía no está escrito.
- Nunca uses "no lo tengo documentado" como pie para tirar el dato igual. Si no lo
  tenés, no lo tenés.
- Cuando contestes que no la tenés documentada, terminá con la marca
  ${MARCA_SIN_DOCUMENTAR} sola en la última línea. Es lo que hace que esa consulta le
  llegue de verdad a quien la va a estudiar — sin eso, "la llevo para estudiarla"
  sería una promesa vacía. La plataforma la borra antes de mostrar tu respuesta:
  el instalador nunca la ve. Si contestaste normal, no la pongas.

DÓNDE ESTÁ LA LÍNEA:
- Contestás normal el oficio establecido y las fórmulas de arriba: cómo se purga un
  radiador, qué es el ΔT, por qué el monotubo ya no se usa, cómo se dimensiona la
  caldera, cómo se equilibra un circuito. Eso no necesita estar documentado caso
  por caso.
- Escalás cuando la consulta pide un dato específico que no tenés: un código de
  falla de un modelo que no está en el material, una marca o modelo puntual, un
  caso de obra que no está documentado, o un criterio donde equivocarse cuesta
  plata.

LIMITACIONES QUE MENCIONÁS CUANDO APLICAN:
- No reemplazás el relevamiento en obra
- No recomendás marcas comerciales específicas
- No generás presupuestos de obra (para eso está el Simulador 2D)
- Sobre trabajos de gas: el diagnóstico y los criterios técnicos (presiones, tiraje,
  ventilación, regulación de llama, poder calorífico) son conocimiento de oficio y podés
  explicarlos con detalle al instalador. PERO toda intervención sobre la instalación de
  gas en sí (conexión de artefactos, modificación o extensión de cañerías de gas,
  habilitaciones y certificaciones) debe ser ejecutada o certificada por un gasista
  matriculado según normativa ENARGAS — aclaralo cuando la consulta implique ese tipo
  de intervención, sin negarte a explicar la parte técnica

FORMATO DE LA RESPUESTA:
No incluyas etiquetas XML internas o de sistema en tu respuesta: el instalador
lee sólo lo que escribís, en Markdown.`
}

// ── Registro del hueco ────────────────────────────────────────────────────────
// Cuando el asistente declara que una consulta no está documentada, la consulta
// queda anotada para que Edgardo la estudie y la escriba. Ese caso nuevo entra a
// `content/errores/`, el reindexado automático lo indexa y el asistente ya la
// contesta: es el circuito que hace crecer la base.
//
// Nunca rompe la consulta: si el registro falla, el instalador ya recibió su
// respuesta y lo único que se pierde es una anotación.

async function registrarConsultaAbierta(datos: {
    userId: string
    esAnonimo: boolean
    tier: Tier
    pregunta: string
    respuesta: string
    rag: ResultadoRag
}): Promise<void> {
    try {
        const { error } = await clienteAdmin().from('consultas_abiertas').insert({
            user_id: datos.userId,
            es_anonimo: datos.esAnonimo,
            tier: datos.esAnonimo ? null : datos.tier,
            pregunta: datos.pregunta,
            respuesta: datos.respuesta,
            rag_fuentes: datos.rag.fuentes,
            rag_similitud_max: datos.rag.similitudMax,
        })
        if (error) throw new Error(error.message)
        console.log(`[bandeja] consulta sin documentar registrada | rag_max=${datos.rag.similitudMax ?? 'nada'}`)
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        console.error('[bandeja] no se pudo registrar la consulta abierta:', detail)
    }
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
    // Preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Método no permitido' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        // ── 1. Autenticación ─────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Token de autenticación requerido' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'No autorizado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 2. Perfil del usuario ────────────────────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier, email')
            .eq('id', user.id)
            .single()

        // Visitante sin cuenta: la sesión anónima es una sesión real de Supabase,
        // así que todo lo demás (rate limiting, RLS, streaming) funciona igual.
        // Lo único que cambia es el cupo y que no hay nombre que usar.
        const esAnonimo = user.is_anonymous === true

        const tier = (profile?.tier ?? 'free') as Tier
        const userName = esAnonimo
            ? 'instalador'
            : (profile?.email ?? user.email ?? 'instalador').split('@')[0]
        const tierConfig = esAnonimo ? ANON_CONFIG : TIER_CONFIG[tier]

        // ── 3. Rate limiting atómico ─────────────────────────────────────────
        // increment_ai_usage hace INSERT ... ON CONFLICT DO UPDATE en una sola
        // operación, eliminando la race condition del patrón read-then-write.
        const { data: newCount, error: usageError } = await supabase
            .rpc('increment_ai_usage', { p_user_id: user.id })

        if (usageError) {
            console.error('[asistente-termico] Error en rate limiting:', usageError.message)
            return new Response(
                JSON.stringify({ error: 'Error interno al verificar límite de uso' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if ((newCount as number) > tierConfig.maxRequestsPerDay) {
            return new Response(
                JSON.stringify({
                    error: 'Límite diario alcanzado',
                    limit: tierConfig.maxRequestsPerDay,
                    tier,
                    anonimo: esAnonimo,
                    message: esAnonimo
                        ? `Usaste las ${ANON_CONFIG.maxRequestsPerDay} consultas de prueba. Creá una cuenta gratis y tenés ${TIER_CONFIG.free.maxRequestsPerDay} por día.`
                        : tier === 'free'
                            ? `Llegaste al límite de ${tierConfig.maxRequestsPerDay} consultas diarias del plan gratuito. Actualizá a Pro para tener ${TIER_CONFIG.pro.maxRequestsPerDay} consultas/día.`
                            : `Llegaste al límite de ${tierConfig.maxRequestsPerDay} consultas diarias de tu plan ${tier}.`
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 5. Parsear y validar el body ─────────────────────────────────────
        const MAX_MESSAGES = 50
        const MAX_CONTENT_LENGTH = 4000
        const MAX_CONTEXTO_SIMULADOR_LENGTH = 4000

        const body = await req.json() as { messages: Message[]; contextoSimulador?: unknown }
        const { messages } = body

        // Contexto del Simulador 2D: solo premium (el Simulador es Premium) y
        // con tope de tamaño — es texto que entra al system prompt y cuesta tokens.
        const contextoSimulador = tier === 'premium' && typeof body.contextoSimulador === 'string'
            ? body.contextoSimulador.slice(0, MAX_CONTEXTO_SIMULADOR_LENGTH)
            : ''

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Se requiere al menos un mensaje' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (messages.length > MAX_MESSAGES) {
            return new Response(
                JSON.stringify({ error: 'Demasiados mensajes en el contexto' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Sanitizar: truncar contenido largo y asegurar roles válidos
        const sanitizedMessages = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
                role: m.role,
                content: String(m.content).slice(0, MAX_CONTENT_LENGTH),
            }))

        if (sanitizedMessages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No hay mensajes válidos' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 6. Búsqueda semántica sobre los casos documentados ───────────────
        // Se busca con el último mensaje del usuario; si falla devuelve ''.
        const ultimoMensajeUsuario = [...sanitizedMessages]
            .reverse()
            .find(m => m.role === 'user')?.content ?? ''
        const rag = await buscarConocimiento(ultimoMensajeUsuario)
        const ragContext = rag.texto

        // ── 7. Llamar a Anthropic con streaming ──────────────────────────────
        const anthropic = new Anthropic({
            apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
        })

        // El contexto de la consulta viaja como mensaje de sistema al final, detrás
        // del turno del instalador: así el prompt de sistema queda estable y la
        // caché pega. La API exige que un mensaje de sistema a mitad de conversación
        // venga después de un turno de usuario — el frontend siempre cierra con la
        // pregunta nueva, pero si alguna vez no fuera así se cae al camino viejo
        // (contexto dentro del system) antes que rechazar la consulta.
        const contextoConsulta = construirContextoConsulta(userName, esAnonimo, contextoSimulador, ragContext)
        const cierraElInstalador = sanitizedMessages[sanitizedMessages.length - 1].role === 'user'

        const mensajesParaModelo: MensajeModelo[] = [...sanitizedMessages]
        if (contextoConsulta && cierraElInstalador) {
            mensajesParaModelo.push({ role: 'system', content: contextoConsulta })
        }

        const systemPrompt = buildSystemPrompt(tier, esAnonimo)
            + (contextoConsulta && !cierraElInstalador ? `\n\n${contextoConsulta}` : '')

        const stream = await anthropic.messages.stream({
            model: MODELO,
            max_tokens: tierConfig.maxTokens,
            // En Opus 5 el pensamiento viene encendido por defecto; se declara
            // explícito para que se lea en el código y no dependa del default.
            thinking: { type: 'adaptive' },
            output_config: { effort: ESFUERZO },
            // El bloque de sistema se marca para caché: es el mismo texto en todas
            // las consultas del tier, así que a partir de la segunda se lee a ~1/10
            // del precio de entrada en lugar de reprocesarse entero.
            system: [{
                type: 'text',
                text: systemPrompt,
                cache_control: { type: 'ephemeral' },
            }],
            messages: mensajesParaModelo,
        })

        // ── 7. Stream SSE al frontend ────────────────────────────────────────
        const encoder = new TextEncoder()

        // Cuánto texto se retiene antes de emitir. La marca va al final, así que
        // guardando su largo (más aire para saltos de línea) se garantiza que no
        // salga al chat ni siquiera partida entre dos chunks. Son ~26 caracteres:
        // invisible para el que lee.
        const COLA_RETENIDA = MARCA_SIN_DOCUMENTAR.length + 8

        const readable = new ReadableStream({
            async start(controller) {
                let acumulado = ''   // todo lo que escribió el modelo
                let emitido = 0      // cuánto de eso ya salió al chat

                const emitir = (texto: string) => {
                    if (!texto) return
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: texto })}\n\n`))
                }

                try {
                    for await (const chunk of stream) {
                        if (
                            chunk.type === 'content_block_delta' &&
                            chunk.delta.type === 'text_delta'
                        ) {
                            acumulado += chunk.delta.text
                            const hasta = acumulado.length - COLA_RETENIDA
                            if (hasta > emitido) {
                                emitir(acumulado.slice(emitido, hasta))
                                emitido = hasta
                            }
                        }
                    }

                    const sinDocumentar = acumulado.includes(MARCA_SIN_DOCUMENTAR)
                    const respuesta = acumulado.replaceAll(MARCA_SIN_DOCUMENTAR, '').trimEnd()

                    // Lo que quedaba retenido, ya sin la marca.
                    emitir(respuesta.slice(emitido))
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))

                    if (sinDocumentar) {
                        await registrarConsultaAbierta({
                            userId: user.id,
                            esAnonimo,
                            tier,
                            pregunta: ultimoMensajeUsuario,
                            respuesta,
                            rag,
                        })
                    }
                } catch (streamError) {
                    const errData = JSON.stringify({ error: 'Error en el stream' })
                    controller.enqueue(encoder.encode(`data: ${errData}\n\n`))
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(readable, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error interno'
        console.error('[asistente-termico] Error:', message)
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor', detail: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
