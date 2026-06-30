-- ── Tabla de uso de IA por usuario/día ────────────────────────────────────────
-- Controla el rate limiting del asistente térmico según el tier del usuario.
-- La Edge Function hace UPSERT con onConflict(user_id, date).

create table if not exists public.ai_usage (
    id            uuid        default gen_random_uuid() primary key,
    user_id       uuid        not null references auth.users(id) on delete cascade,
    date          date        not null default current_date,
    request_count int         not null default 0,
    tokens_used   int         not null default 0,
    created_at    timestamptz not null default now(),

    constraint ai_usage_user_date unique (user_id, date)
);

-- ── Índice para las queries de rate limiting (user_id + date) ─────────────────

create index if not exists ai_usage_user_date_idx
    on public.ai_usage (user_id, date);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.ai_usage enable row level security;

-- El usuario puede leer su propio uso (para mostrar "X consultas restantes")
create policy "Leer uso propio"
    on public.ai_usage for select
    using (auth.uid() = user_id);

-- Solo service_role puede insertar/actualizar (lo hace la Edge Function)
-- Sin política de INSERT/UPDATE = solo service_role tiene acceso

-- ── Función atómica de rate limiting ─────────────────────────────────────────
-- Incrementa el contador y devuelve el nuevo valor en una sola operación.
-- Evita la race condition del patrón read-then-write.

create or replace function public.increment_ai_usage(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count int;
begin
    insert into public.ai_usage (user_id, date, request_count)
    values (p_user_id, current_date, 1)
    on conflict (user_id, date)
    do update set request_count = ai_usage.request_count + 1
    returning request_count into v_count;

    return v_count;
end;
$$;
