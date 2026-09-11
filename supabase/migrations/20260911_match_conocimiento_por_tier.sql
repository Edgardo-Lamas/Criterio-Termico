-- ── El asistente deja de regalar el contenido pago, y lo dice ────────────────
--
-- La columna `conocimiento.tier` existe desde el 2026-08-13 pero nunca se usó:
-- a `match_conocimiento` se le pasaban embedding, cantidad y similitud, así que
-- Martín le citaba un caso PRO a una cuenta gratuita. La página del caso mostraba
-- el muro de pago y el asistente contaba lo mismo por la otra puerta.
--
-- Aquella migración lo dejó apagado a propósito: «hoy no hay cobros activos y
-- ahí juega a favor mostrar el producto real». Desde el 1/9 hay cobros activos.
-- Por eso se enciende ahora.
--
-- 🔑 LA DECISIÓN DE DISEÑO, que es lo que hay que entender antes de tocar esto:
-- el 46% de la base es de tier pago (68 fragmentos PRO + 12 Premium de 174).
-- Filtrar y callarse dejaría a Martín contestando peor SIN QUE SE ENTIENDA POR
-- QUÉ: el instalador gratuito no ve un candado, ve un asistente flojo. Así que
-- la función devuelve DOS listas:
--   · lo accesible, con su contenido, que es lo único que entra al prompt;
--   · los BLOQUEADOS, sin contenido (`contenido` viene en null desde el SQL, no
--     se recorta después), sólo con título y tier, para que Martín pueda decir
--     «esto está documentado en tal caso, y ese caso es PRO».
-- El muro deja de ser una ausencia y pasa a ser un motivo para suscribirse.
--
-- ⚠ El `contenido` de un bloqueado NO SALE DE LA BASE. Es a propósito: así no
-- hay forma de que un cambio distraído en la Edge Function lo meta al prompt.

-- El viejo se borra: agregar parámetros con default no reemplaza la función,
-- crea una sobrecarga, y una llamada de tres argumentos quedaría ambigua.
drop function if exists public.match_conocimiento(vector, int, float);

create or replace function public.match_conocimiento(
    query_embedding vector(384),
    match_count int default 4,
    min_similarity float default 0.35,
    -- Default deliberadamente restrictivo: si algún día alguien la llama sin
    -- decir qué tier es, que devuelva lo gratuito y no la base entera.
    tiers_permitidos text[] default array['free'],
    -- Cuántos bloqueados se informan. No van al prompt como contenido: son el
    -- aviso de que hay material documentado del otro lado del muro.
    bloqueados_count int default 3
)
returns table (
    source_id text,
    tipo text,
    titulo text,
    seccion text,
    categoria text,
    contenido text,
    tier text,
    accesible boolean,
    similarity float
)
language sql stable security definer
set search_path to 'public'
as $$
    (
        select
            c.source_id, c.tipo, c.titulo, c.seccion, c.categoria, c.contenido,
            c.tier, true as accesible,
            1 - (c.embedding <=> query_embedding) as similarity
        from public.conocimiento c
        where c.embedding is not null
          and c.tier = any(tiers_permitidos)
          and 1 - (c.embedding <=> query_embedding) >= min_similarity
        order by c.embedding <=> query_embedding
        limit match_count
    )
    union all
    (
        -- Un caso por aviso. Sin el `row_number` los tres lugares se los lleva
        -- el mismo caso —está medido: ante «la caldera arranca y para», los tres
        -- mejores bloqueados eran los fragmentos #1, #3 y #2 del MISMO caso— y el
        -- instalador se entera de uno solo cuando había tres para nombrarle.
        select
            m.source_id, m.tipo, m.titulo, m.seccion, m.categoria,
            null::text as contenido,
            m.tier, false as accesible,
            m.similarity
        from (
            select
                c.source_id, c.tipo, c.titulo, c.seccion, c.categoria, c.tier,
                1 - (c.embedding <=> query_embedding) as similarity,
                row_number() over (
                    partition by split_part(c.source_id, '#', 1)
                    order by c.embedding <=> query_embedding
                ) as rn
            from public.conocimiento c
            where c.embedding is not null
              and not (c.tier = any(tiers_permitidos))
              and 1 - (c.embedding <=> query_embedding) >= min_similarity
        ) m
        where m.rn = 1
        order by m.similarity desc
        limit bloqueados_count
    );
$$;

comment on function public.match_conocimiento(vector, int, float, text[], int) is
    'Búsqueda semántica de la base de conocimiento, acotada a los tiers que el usuario pagó. Devuelve además los mejores fragmentos BLOQUEADOS sin su contenido, para que el asistente pueda nombrar el caso sin contarlo.';

comment on column public.conocimiento.tier is
    'Tier del contenido de origen. Filtra la búsqueda del asistente desde el 2026-09-11.';

-- Sólo la Edge Function, con service_role. Se revoca igual que la anterior; el
-- grant explícito a service_role va escrito y no heredado, porque una migración
-- que revoca sin volver a otorgar ya dejó al asistente mudo una vez (8/9).
revoke all on function public.match_conocimiento(vector, int, float, text[], int) from public, anon, authenticated;
grant execute on function public.match_conocimiento(vector, int, float, text[], int) to service_role;
