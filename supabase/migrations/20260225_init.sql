-- ── Tabla de perfiles ─────────────────────────────────────────────────────────
-- Almacena el tier de suscripción de cada usuario.
-- Se crea automáticamente al registrarse via trigger.

create table if not exists public.profiles (
    id          uuid        references auth.users(id) on delete cascade primary key,
    email       text        not null,
    tier        text        not null default 'free' check (tier in ('free', 'pro', 'premium')),
    created_at  timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- El usuario puede leer su propio perfil
create policy "Leer perfil propio"
    on public.profiles for select
    using (auth.uid() = id);

-- Solo el service role puede escribir (usado por el webhook de MP)
-- (Por defecto sin policy de insert/update, solo service_role puede hacerlo)

-- ── Trigger: crear perfil automáticamente al registrarse ──────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, tier)
    values (new.id, new.email, 'free');
    return new;
end;
$$;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
