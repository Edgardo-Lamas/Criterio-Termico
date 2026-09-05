-- Suscripciones de Mercado Pago — el registro que hasta hoy no existía.
--
-- El webhook venía haciendo una sola cosa: pisar `profiles.tier` y contestar
-- 200. Eso alcanza para que la app funcione y no alcanza para cobrar:
--
--   · Si un instalador reclama que pagó, no hay dónde mirar. No queda el id de
--     la suscripción, ni el monto, ni la fecha, ni qué dijo MP.
--   · No se puede cancelar ni pausar desde la app: cancelar es un PUT a
--     /preapproval/{id} y ese id no se guardaba en ningún lado.
--   · Con dos suscripciones del mismo usuario (una vieja cancelada y una nueva
--     activa), el aviso de la vieja bajaba el tier de la nueva a `free`. El
--     último aviso mandaba, sin mirar el resto.
--
-- Por eso el tier deja de salir del último aviso y pasa a salir de ESTA tabla:
-- se recalcula mirando todas las suscripciones autorizadas del usuario.

create table if not exists public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- El id del preapproval en MP. Es la identidad de la suscripción y la clave
  -- del upsert: cada aviso vuelve a escribir la misma fila.
  preapproval_id text not null unique,

  tier text not null check (tier in ('pro', 'premium')),

  -- El status crudo de MP, sin traducir: pending, authorized, paused,
  -- cancelled. Se guarda tal cual para que un reclamo se pueda contrastar
  -- contra el panel de MP sin adivinar equivalencias.
  estado text not null,

  monto numeric(12,2),
  moneda text,

  -- Del último cobro recurrente (evento subscription_authorized_payment).
  -- `ultimo_pago_estado` es el del pago, no el de la suscripción: un pago
  -- rechazado no cancela la suscripción, MP reintenta.
  ultimo_pago_at timestamptz,
  ultimo_pago_estado text,
  proximo_cobro_at timestamptz,

  creada_at timestamptz not null default now(),
  actualizada_at timestamptz not null default now()
);

create index if not exists suscripciones_user_idx on public.suscripciones (user_id);
create index if not exists suscripciones_estado_idx on public.suscripciones (estado);

comment on table public.suscripciones is
  'Suscripciones de MP. La escribe el webhook con service_role; el tier de profiles se recalcula desde acá.';

-- ── Row Level Security ────────────────────────────────────────────────────────
--
-- Mismo criterio que `profiles`: el usuario lee lo suyo y nada más. Sin policy
-- de insert/update, así que sólo el service_role escribe — que es el webhook.

alter table public.suscripciones enable row level security;

create policy "Leer suscripciones propias"
  on public.suscripciones for select
  using (auth.uid() = user_id);
