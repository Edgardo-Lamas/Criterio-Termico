-- ── El tier de cada fragmento de la base de conocimiento ─────────────────────
--
-- La página de un caso PRO muestra el muro de pago, pero el asistente responde
-- con el contenido de ese mismo caso a cualquiera: la búsqueda del RAG nunca
-- supo de qué tier era cada fragmento. Dos puertas a la misma habitación, una
-- cerrada con llave y la otra abierta.
--
-- ⚠ Esta migración SOLO agrega el dato. El filtro NO se activa todavía: por
-- decisión de Edgardo (2026-08-13) el asistente sigue abierto hasta después del
-- CoderCup, porque hoy no hay cobros activos y ahí juega a favor mostrar el
-- producto real. Encenderlo después es pasarle el tier a match_conocimiento.
--
-- El default 'free' es deliberado: si un fragmento nuevo llegara sin tier, es
-- preferible que quede accesible a que desaparezca en silencio del asistente.
-- El extractor lo manda siempre; esto es sólo la red.

alter table public.conocimiento
    add column if not exists tier text not null default 'free'
    check (tier in ('free', 'pro', 'premium'));

comment on column public.conocimiento.tier is
    'Tier del contenido de origen. Preparado para filtrar la búsqueda por lo que el usuario pagó; sin usar todavía.';

-- Índice para cuando el filtro se encienda: la búsqueda vectorial ya ordena por
-- distancia, esto acota antes de ordenar.
create index if not exists conocimiento_tier_idx on public.conocimiento (tier);
