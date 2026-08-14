-- Bandeja de revisión — las dos entradas por donde crece la base de conocimiento.
--
-- El modelo NO aprende por conversar: lo que crece es el RAG, y ese crecimiento
-- se fabrica. Estas dos tablas son la materia prima, y las dos desembocan en lo
-- mismo: Edgardo revisa → el caso entra a `content/errores/` → el reindexado
-- automático lo indexa → el asistente ya lo contesta.
--
--   1. consultas_abiertas — el HUECO que el propio asistente declara ("esta no
--      la tengo documentada, la llevo para estudiarla"). Hasta hoy esa promesa
--      no iba a ningún lado.
--   2. contribuciones — el CASO que aporta el instalador. Valor doble: material
--      nuevo, y que el instalador se sienta parte de una comunidad.
--
-- 🔴 Lo que NO existe acá, por criterio de Edgardo: un canal para que el
-- instalador corrija el contenido de la plataforma. "Si el instalador hace eso
-- el sistema pierde valor, coloca al instalador por sobre el sistema, y eso no
-- puede pasar." El crecimiento entra por casos, nunca por corrección.

-- ── 1. Consultas que el asistente no pudo responder ──────────────────────────

create table if not exists public.consultas_abiertas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  es_anonimo boolean not null default false,
  tier text,                       -- tier al momento de preguntar (null si anónimo)

  pregunta text not null,          -- la consulta del instalador, tal cual
  respuesta text,                  -- lo que el asistente terminó contestando

  -- Qué llegó a encontrar el RAG. Sirve para separar dos causas distintas que
  -- se ven igual desde afuera: que el material NO EXISTA (hay que escribirlo) o
  -- que exista y no se haya recuperado (hay que arreglar la recuperación).
  -- Ya pasó: el manual decía 5 cm de separación a la pared y el asistente dijo
  -- 3 porque esa tabla nunca entró al contexto.
  rag_fuentes text[] not null default '{}',
  rag_similitud_max numeric(4,3),

  estado text not null default 'nueva'
    check (estado in ('nueva', 'en_estudio', 'respondida', 'descartada')),
  notas text,                      -- lo que Edgardo anota al estudiarla
  caso_slug text,                  -- si terminó documentada, qué caso la cubre

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS SIN NINGUNA POLICY: nadie llega a esta tabla desde el navegador.
-- La escribe la Edge Function con service_role y la lee el panel a través de
-- otra Edge Function, que es donde se valida quién es admin. El panel hoy
-- compara el email en el FRONTEND, y eso alcanza para métricas de SEO pero no
-- para consultas de instaladores: la restricción real la hace la base.
alter table public.consultas_abiertas enable row level security;

-- Las nuevas primero: es una bandeja de trabajo, no un historial.
create index consultas_abiertas_bandeja_idx
  on public.consultas_abiertas (estado, created_at desc);

-- ── 2. Aportes de los instaladores ───────────────────────────────────────────

create table if not exists public.contribuciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- ⚠ Estos tres ids vienen del formulario que ya estaba escrito. "error" NO
  -- significa "el contenido de la plataforma está mal": significa una situación
  -- problemática encontrada en la obra. Las etiquetas visibles están pendientes
  -- de revisión con Edgardo justamente para que eso no se preste a confusión.
  tipo text not null check (tipo in ('mejora', 'caso-obra', 'error')),
  titulo text not null,
  descripcion text not null,
  solucion text,

  estado text not null default 'nueva'
    check (estado in ('nueva', 'en_estudio', 'aprobada', 'rechazada')),
  notas text,                      -- devolución de Edgardo
  caso_slug text,                  -- si se publicó, en qué caso quedó

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contribuciones enable row level security;

-- El instalador aporta lo suyo y ve lo suyo. Que pueda seguir el estado de su
-- aporte es parte del punto: se sumó a algo y quiere saber en qué quedó.
create policy "contribuciones_insertar_propia" on public.contribuciones
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "contribuciones_leer_propias" on public.contribuciones
  for select to authenticated
  using (auth.uid() = user_id);

-- Sin policy de update ni delete a propósito: una vez enviado, el aporte es
-- material a revisar. Editarlo o borrarlo después de que Edgardo lo trabajó
-- rompería la revisión.

create index contribuciones_bandeja_idx
  on public.contribuciones (estado, created_at desc);
create index contribuciones_usuario_idx
  on public.contribuciones (user_id, created_at desc);

-- ── updated_at al día en las dos ─────────────────────────────────────────────

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger consultas_abiertas_updated_at
  before update on public.consultas_abiertas
  for each row execute function public.tocar_updated_at();

create trigger contribuciones_updated_at
  before update on public.contribuciones
  for each row execute function public.tocar_updated_at();
