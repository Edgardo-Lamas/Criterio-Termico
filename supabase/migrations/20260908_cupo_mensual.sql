-- ── El cupo del asistente pasa de diario a mensual ───────────────────────────
--
-- POR QUÉ. El límite diario hacía lo contrario de lo que hacía falta: frenaba
-- al instalador que estaba trabajando en serio un martes a la tarde —el uso
-- real es a ráfagas: siete consultas armando un presupuesto y después nada por
-- una semana— y al mismo tiempo dejaba pasar 300 consultas al mes en el plan
-- gratuito, que a USD 0,09 la consulta salen más caras que lo que paga un PRO.
--
-- Medido sobre `ai_usage` el 2026-09-08: 23 usuarios, 69 consultas en dos
-- meses, pico de 7 en un día, promedio de 1,92 por día activo. Nadie llegó
-- nunca al tope diario.
--
-- Cupos nuevos: 15 gratuito · 80 PRO · 120 PREMIUM, por mes.

-- ── El ciclo arranca el día que se registró, no el 1° ─────────────────────────
--
-- Si el contador se reiniciara el 1° de cada mes, el que se da de alta el 28
-- tendría el mes entero para gastar en tres días y otro mes entero el 1°.
-- El ancla es `profiles.created_at`: no cambia si sube o baja de plan, así que
-- el día de renovación es siempre el mismo y se le puede decir al instalador.
--
-- La suma de meses de Postgres ya resuelve los fines de mes: un ancla del 31 de
-- enero cae en el 28 de febrero y vuelve al 31 en marzo.

create or replace function public.inicio_del_ciclo(p_ancla date, p_hoy date default current_date)
returns date
language sql
immutable
as $$
    select (p_ancla + (
        (extract(year  from age(p_hoy, p_ancla)) * 12
       + extract(month from age(p_hoy, p_ancla)))::int || ' months'
    )::interval)::date;
$$;

comment on function public.inicio_del_ciclo(date, date) is
    'Primer día del ciclo mensual vigente, anclado al día del mes de p_ancla.';

-- ── Consumir una consulta ────────────────────────────────────────────────────
--
-- Reemplaza a `increment_ai_usage`, que incrementaba a ciegas y dejaba la
-- decisión afuera: el que llamaba sumaba primero y comparaba después, así que
-- una consulta rechazada por pasarse del tope ya se había descontado igual.
-- Acá la decisión y el descuento son la misma operación: si no hay cupo, no se
-- descuenta nada.
--
-- 🔴 EL LOCK NO ES DECORATIVO. El cupo vive repartido en una fila por día, así
-- que hay que sumarlas para saber cuántas van. Sin serializar por usuario, dos
-- consultas simultáneas leen la misma suma, las dos se creen dentro del cupo y
-- las dos pasan. Es la misma race condition que ya había mordido en el rate
-- limiting diario. `pg_advisory_xact_lock` se suelta solo al cerrar la
-- transacción y sólo traba a ESE usuario: dos instaladores distintos no se
-- esperan entre sí.
--
-- p_ancla NULL = sin ciclo, se cuenta todo el historial. Es el caso del
-- visitante sin cuenta: su cupo son 3 consultas y se terminan, no se le
-- renuevan, porque una sesión anónima no tiene mes que cumplir.

create or replace function public.consumir_consulta_ia(
    p_user_id uuid,
    p_limite  int,
    p_ancla   date default null,
    p_cantidad int default 1
)
returns table (
    usadas    int,
    limite    int,
    permitido boolean,
    renueva   date
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_inicio  date;
    v_renueva date;
    v_usadas  int;
begin
    perform pg_advisory_xact_lock(hashtext(p_user_id::text));

    if p_ancla is null then
        v_inicio  := null;
        v_renueva := null;
    else
        v_inicio  := public.inicio_del_ciclo(p_ancla);
        -- Anclado al día original, no al inicio del ciclo: si no, un ancla de
        -- fin de mes se iría corriendo hacia atrás mes a mes.
        v_renueva := (p_ancla + ((
            (extract(year  from age(current_date, p_ancla)) * 12
           + extract(month from age(current_date, p_ancla)))::int + 1
        ) || ' months')::interval)::date;
    end if;

    select coalesce(sum(u.request_count), 0)::int
      into v_usadas
      from public.ai_usage u
     where u.user_id = p_user_id
       and (v_inicio is null or u.date >= v_inicio);

    -- Con p_cantidad > 1 se pide que la operación pese más de una consulta.
    -- Hoy todo pesa 1 —un análisis de plano cuesta lo mismo que una consulta
    -- con historial: no arrastra la conversación—, pero el parámetro está para
    -- cuando se midan los tokens de verdad y para los paquetes comprados.
    if v_usadas + p_cantidad > p_limite then
        return query select v_usadas, p_limite, false, v_renueva;
        return;
    end if;

    insert into public.ai_usage as a (user_id, date, request_count)
    values (p_user_id, current_date, p_cantidad)
    on conflict (user_id, date)
    do update set request_count = a.request_count + p_cantidad;

    return query select v_usadas + p_cantidad, p_limite, true, v_renueva;
end;
$$;

comment on function public.consumir_consulta_ia(uuid, int, date, int) is
    'Descuenta una consulta del cupo mensual si hay lugar. Decide y descuenta en la misma operación.';

-- ── Lo que se consumió, para mostrarlo ───────────────────────────────────────
--
-- El instalador tiene que poder ver cuánto le queda ANTES de quedarse sin cupo,
-- no enterarse cuando le dicen que no. Esta no descuenta: sólo lee.
-- La RLS de `ai_usage` ya deja que cada uno lea lo suyo (política «Leer uso
-- propio»), así que la puede llamar el frontend con la sesión del usuario.

create or replace function public.cupo_ia(
    p_user_id uuid,
    p_ancla   date default null
)
returns table (usadas int, renueva date)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_inicio date;
begin
    -- Sin esto, cualquiera con una sesión podría leer el consumo ajeno: la
    -- función es SECURITY DEFINER y se saltea la RLS de la tabla.
    if auth.uid() is null or auth.uid() <> p_user_id then
        raise exception 'No autorizado';
    end if;

    if p_ancla is null then
        v_inicio := null;
    else
        v_inicio := public.inicio_del_ciclo(p_ancla);
    end if;

    return query
    select coalesce(sum(u.request_count), 0)::int,
           case when p_ancla is null then null::date
                else (p_ancla + ((
                    (extract(year  from age(current_date, p_ancla)) * 12
                   + extract(month from age(current_date, p_ancla)))::int + 1
                ) || ' months')::interval)::date
           end
      from public.ai_usage u
     where u.user_id = p_user_id
       and (v_inicio is null or u.date >= v_inicio);
end;
$$;

comment on function public.cupo_ia(uuid, date) is
    'Cuántas consultas lleva usadas el usuario en su ciclo y cuándo se le renueva. Sólo lee.';

-- ── Permisos ─────────────────────────────────────────────────────────────────
-- `consumir_consulta_ia` la llama la Edge Function con service_role y nadie
-- más: si la pudiera llamar el cliente, se descontaría cupo sin consultar nada.
revoke all on function public.consumir_consulta_ia(uuid, int, date, int) from public, anon, authenticated;

-- `cupo_ia` sí la llama el frontend para dibujar el contador.
grant execute on function public.cupo_ia(uuid, date) to authenticated, anon;
grant execute on function public.inicio_del_ciclo(date, date) to authenticated, anon;
