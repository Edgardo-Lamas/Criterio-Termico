-- ── Medir lo que consume cada consulta, en vez de estimarlo ──────────────────
--
-- POR QUÉ. Hasta hoy `ai_usage.tokens_used` estuvo en 0 en las 36 filas de la
-- tabla: 69 consultas entre el 2026-07-08 y el 2026-09-08 y ni un solo token
-- registrado. El costo de USD 0,09 por consulta con el que se fijaron los
-- precios es una ESTIMACIÓN hecha en papel, y el 0,05 al que se quiere bajar
-- acotando el historial también. La API devuelve el consumo real en cada
-- respuesta y se estaba tirando.
--
-- Sin esto, acotar el historial es a ciegas: no habría forma de saber si el
-- recorte sirvió, ni cuánto, ni si conviene mover la ventana.
--
-- ⚠ Los tres precios son distintos y por eso se guardan separados: la entrada
-- vale una cosa, la salida cinco veces más, y lo que se lee de caché una
-- décima parte de la entrada. Sumar todo en un solo número no permitiría
-- calcular el costo.

alter table public.ai_usage
    add column if not exists input_tokens      bigint  not null default 0,
    add column if not exists output_tokens     bigint  not null default 0,
    add column if not exists cache_read_tokens bigint  not null default 0,
    add column if not exists cache_write_tokens bigint not null default 0,
    add column if not exists trimmed_count     integer not null default 0;

comment on column public.ai_usage.input_tokens is
    'Tokens de entrada facturados en el día (no incluye los leídos de caché).';
comment on column public.ai_usage.output_tokens is
    'Tokens generados por el modelo en el día. Son los más caros.';
comment on column public.ai_usage.cache_read_tokens is
    'Tokens del prompt de sistema leídos de caché. Valen ~1/10 de la entrada.';
comment on column public.ai_usage.cache_write_tokens is
    'Tokens escritos a caché la primera vez. Se pagan más caros que la entrada y una sola vez.';
comment on column public.ai_usage.trimmed_count is
    'Cuántas consultas del día llegaron con más conversación de la que entra en la ventana. Dice si la ventana está mordiendo.';

-- ── Registrar el consumo de una consulta ─────────────────────────────────────
--
-- Corre DESPUÉS de que la respuesta terminó, con los números que devolvió la
-- API. Suma sobre la fila del día, que ya existe porque la creó
-- `consumir_consulta_ia` al descontar el cupo.
--
-- 🔑 Si la fila no estuviera —no debería pasar, pero un cambio futuro en el
-- orden lo haría posible— se crea con `request_count = 0`: acá se mide, no se
-- descuenta cupo. Confundir las dos cosas le cobraría al instalador una
-- consulta de más.
--
-- Nunca hace fallar la consulta: el que llama ignora el error. El instalador ya
-- tuvo su respuesta y lo único que se pierde es una medición.

create or replace function public.registrar_consumo_ia(
    p_user_id     uuid,
    p_input       int,
    p_output      int,
    p_cache_read  int default 0,
    p_cache_write int default 0,
    p_recortada   boolean default false
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    insert into public.ai_usage as a (
        user_id, date, request_count, tokens_used,
        input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
        trimmed_count
    )
    values (
        p_user_id, current_date, 0, coalesce(p_input, 0) + coalesce(p_output, 0),
        coalesce(p_input, 0), coalesce(p_output, 0),
        coalesce(p_cache_read, 0), coalesce(p_cache_write, 0),
        case when p_recortada then 1 else 0 end
    )
    on conflict (user_id, date) do update set
        -- `tokens_used` existía y siempre estuvo en 0. Se sigue llenando con
        -- entrada + salida para que deje de mentir, pero el detalle que sirve
        -- para calcular el costo son las columnas separadas.
        tokens_used        = a.tokens_used        + coalesce(p_input, 0) + coalesce(p_output, 0),
        input_tokens       = a.input_tokens       + coalesce(p_input, 0),
        output_tokens      = a.output_tokens      + coalesce(p_output, 0),
        cache_read_tokens  = a.cache_read_tokens  + coalesce(p_cache_read, 0),
        cache_write_tokens = a.cache_write_tokens + coalesce(p_cache_write, 0),
        trimmed_count      = a.trimmed_count      + case when p_recortada then 1 else 0 end;
end;
$$;

comment on function public.registrar_consumo_ia(uuid, int, int, int, int, boolean) is
    'Suma al día el consumo real que devolvió la API para una consulta. No toca el cupo.';

-- La llama la Edge Function con service_role y nadie más: si la pudiera llamar
-- el cliente, cualquiera podría inflar o falsear las métricas de costo.
revoke all on function public.registrar_consumo_ia(uuid, int, int, int, int, boolean) from public, anon, authenticated;
