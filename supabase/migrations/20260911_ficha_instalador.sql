-- ── La ficha del instalador: la primera etapa de la memoria de Martín ────────
--
-- Lo que Martín sabe de cada instalador para no volver a preguntárselo: dónde
-- trabaja, qué instala, con qué marcas. Entra en cada consulta por
-- `construirContextoConsulta()`, NO por el system prompt (que está cacheado y
-- tiene que seguir siendo estable; ver CLAUDE.md).
--
-- 🔑 LA DECISIÓN QUE HACE SEGURA ESTA ETAPA: la ficha LA ESCRIBE EL INSTALADOR,
-- Martín no infiere nada. El cuidado del diseño era que «una memoria equivocada
-- es peor que no tener»: si se acordara solo de que alguien usa una marca y esa
-- persona cambió, arrastraría el error en todas las respuestas con total
-- seguridad. Cargándola a mano, ese riesgo no existe. Que Martín PROPONGA
-- recordar algo es una etapa posterior.
--
-- 🔑 POR QUÉ CASI TODO ES DE OPCIONES CERRADAS Y NO TEXTO LIBRE: la ficha
-- también es la base para segmentar (ofertas, temarios, qué capítulo escribir
-- primero). Un campo libre se lee pero no se cuenta: «zona norte», «Vicente
-- López», «GBA» y «Bs As» son cuatro respuestas para el mismo instalador. Lo
-- único libre es la nota, que es para Martín y no para la estadística.
--
-- ⚠ TODO ES OPCIONAL. Una ficha vacía deja a Martín exactamente como está hoy.
-- El instalador está en obra: si la pantalla se siente un formulario, no la
-- completa nadie.

create table if not exists public.ficha_instalador (
    user_id uuid primary key references auth.users(id) on delete cascade,

    -- Define la temperatura de diseño y las pérdidas. Cerrada, para poder
    -- agrupar por región.
    provincia text check (provincia in (
        'buenos-aires', 'caba', 'catamarca', 'chaco', 'chubut', 'cordoba',
        'corrientes', 'entre-rios', 'formosa', 'jujuy', 'la-pampa', 'la-rioja',
        'mendoza', 'misiones', 'neuquen', 'rio-negro', 'salta', 'san-juan',
        'san-luis', 'santa-cruz', 'santa-fe', 'santiago-del-estero',
        'tierra-del-fuego', 'tucuman'
    )),

    instala text check (instala in ('radiadores', 'piso-radiante', 'ambas')),

    -- Varios a la vez: el mismo instalador hace obra nueva y service.
    trabajos text[] not null default '{}'
        check (trabajos <@ array['obra-nueva', 'reforma', 'service']),

    combustible text check (combustible in ('natural', 'envasado', 'ambos')),

    -- Sólo las tres que tienen tabla de fallas en `conocimiento`. El resto va en
    -- `marcas_otras`, que además sirve para saber qué manual conviene sumar.
    marcas text[] not null default '{}'
        check (marcas <@ array['peisa', 'baxi', 'caldaia']),
    marcas_otras text check (char_length(marcas_otras) <= 120),

    -- Lo único libre. Tope corto a propósito: viaja en CADA consulta, así que un
    -- texto largo se paga una y otra vez.
    nota text check (char_length(nota) <= 400),

    actualizada_at timestamptz not null default now()
);

comment on table public.ficha_instalador is
    'Lo que el instalador le contó a Martín sobre su trabajo. La carga él, es toda opcional y entra en el contexto de cada consulta.';

alter table public.ficha_instalador enable row level security;

-- Cada uno ve, escribe y borra SÓLO lo suyo. Sin excepción para el admin: la
-- vista agregada para segmentar es otra etapa y se diseña aparte, con su aviso
-- en la política de privacidad.
create policy "ficha propia: leer" on public.ficha_instalador
    for select using (auth.uid() = user_id);
create policy "ficha propia: crear" on public.ficha_instalador
    for insert with check (auth.uid() = user_id);
create policy "ficha propia: modificar" on public.ficha_instalador
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ficha propia: borrar" on public.ficha_instalador
    for delete using (auth.uid() = user_id);

-- `actualizada_at` la pone la base, no el cliente: si la manda el navegador,
-- miente el día que alguien toque la API a mano.
create or replace function public.tocar_ficha_instalador()
returns trigger language plpgsql as $$
begin
    new.actualizada_at := now();
    return new;
end $$;

drop trigger if exists ficha_instalador_actualizada on public.ficha_instalador;
create trigger ficha_instalador_actualizada
    before insert or update on public.ficha_instalador
    for each row execute function public.tocar_ficha_instalador();
