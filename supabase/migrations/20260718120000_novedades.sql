-- Novedades del rubro en la Home: espacio administrable sin deploy.
-- Hoy muestra contenido temático propio. El destino del espacio es B2B:
-- empresas que compren suscripciones para sus clientes (p. ej. distribuidores)
-- podrán publicar acá charlas técnicas, promociones y productos. Edgardo no
-- promociona nada propio: administra las filas por el dashboard (service_role).

create table public.novedades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  bajada text not null,
  etiqueta text,                -- chip visible en la card: "Novedad", "Charla técnica", "Promoción"
  imagen_url text not null,     -- asset propio (/novedades/*.svg) o URL absoluta
  link_url text,                -- opcional: adónde lleva la card (ruta interna o URL externa)
  orden integer not null default 0,
  activa boolean not null default true,
  vigencia_desde timestamptz,   -- null = desde siempre
  vigencia_hasta timestamptz,   -- null = sin vencimiento
  created_at timestamptz not null default now()
);

alter table public.novedades enable row level security;

-- Lectura pública: la Home la ve cualquiera, logueado o no. La vigencia se
-- resuelve acá y no en el cliente, así una promo vencida desaparece sola.
-- Escritura: ninguna policy — solo service_role (dashboard), que saltea RLS.
create policy "novedades_lectura_publica" on public.novedades
  for select using (
    activa
    and (vigencia_desde is null or vigencia_desde <= now())
    and (vigencia_hasta is null or vigencia_hasta >= now())
  );

create index novedades_orden_idx on public.novedades (activa, orden);
