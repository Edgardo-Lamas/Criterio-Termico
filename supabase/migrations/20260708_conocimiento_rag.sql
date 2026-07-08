-- Base de conocimiento para búsqueda semántica (RAG) del asistente técnico.
-- Cada fila es un fragmento (sección de un caso de error o del manual) con su
-- embedding gte-small (384 dims, generado en la Edge Function indexar-conocimiento).

create extension if not exists vector;

create table if not exists public.conocimiento (
    id uuid primary key default gen_random_uuid(),
    source_id text not null unique,          -- ej: 'caso:radiadores-frios#2'
    tipo text not null check (tipo in ('caso', 'manual')),
    titulo text not null,                    -- título del caso/capítulo de origen
    seccion text,                            -- título de la sección del fragmento
    categoria text,
    contenido text not null,
    embedding vector(384),
    updated_at timestamptz not null default now()
);

-- Solo la Edge Function (service_role) lee y escribe. Sin policies públicas:
-- el contenido completo ya se sirve por la app con su propio gating de tier.
alter table public.conocimiento enable row level security;

create index if not exists conocimiento_embedding_idx
    on public.conocimiento using hnsw (embedding vector_cosine_ops);

-- Búsqueda por similitud coseno. security definer para que la Edge Function
-- pueda invocarla vía service_role sin exponer la tabla.
create or replace function public.match_conocimiento(
    query_embedding vector(384),
    match_count int default 4,
    min_similarity float default 0.35
)
returns table (
    source_id text,
    tipo text,
    titulo text,
    seccion text,
    categoria text,
    contenido text,
    similarity float
)
language sql stable security definer
set search_path = public
as $$
    select
        c.source_id, c.tipo, c.titulo, c.seccion, c.categoria, c.contenido,
        1 - (c.embedding <=> query_embedding) as similarity
    from public.conocimiento c
    where c.embedding is not null
      and 1 - (c.embedding <=> query_embedding) >= min_similarity
    order by c.embedding <=> query_embedding
    limit match_count;
$$;

revoke execute on function public.match_conocimiento(vector, int, float) from public, anon, authenticated;
