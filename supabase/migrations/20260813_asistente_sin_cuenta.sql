-- ── El asistente se abre a visitantes sin cuenta ─────────────────────────────
--
-- La sesión anónima de Supabase crea una fila REAL en auth.users
-- (is_anonymous = true), así que dispara el trigger on_auth_user_created que
-- inserta el perfil. Un usuario anónimo no tiene email, y profiles.email era
-- NOT NULL: el trigger fallaba, y como el trigger corre dentro de la
-- transacción del alta, se caía el alta entera. El visitante veía "Database
-- error saving new user" al escribir su primera pregunta.
--
-- Un perfil sin email es exactamente lo que es un visitante anónimo: no se
-- rellena con un placeholder, se deja nulo.

alter table public.profiles alter column email drop not null;

comment on column public.profiles.email is
    'Nulo para sesiones anónimas (visitantes que usan el asistente sin cuenta).';
