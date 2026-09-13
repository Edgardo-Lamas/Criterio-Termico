-- ── El resumen de la consulta por correo: el registro de los envíos ─────────
--
-- Idea suya del 11/9: «podríamos enviar por correo un resumen de la consulta
-- para que le quede de repaso al instalador». Sale con un BOTÓN al pie de la
-- respuesta, no automático: el que lo pide lo quiere, uno por consulta se
-- vuelve ruido, y de paso cada clic dice qué respuestas valieron la pena.
--
-- 🔑 ESTA TABLA NO GUARDA LA CONSULTA. Guarda que hubo un envío y de qué
-- tamaño. Es a propósito: guardar lo que se dice en el chat es la etapa 2 de la
-- memoria de Martín y arrastra una decisión que todavía no está tomada —ahí
-- quedan escritos datos de clientes de terceros, y eso no se arranca sin la
-- política de privacidad y el borrado. El correo se arma con lo que ya está en
-- la pantalla del instalador y no se escribe en ningún lado.
--
-- 🔴 PARA QUÉ SIRVE ENTONCES: para el tope diario. Sin un lugar donde contar,
-- cualquiera con cuenta puede apretar el botón mil veces y quemar la cuota de
-- Resend (3.000 correos al mes en el plan gratuito). El destinatario siempre es
-- su propia dirección, así que no es spam a terceros, pero la cuota es una sola
-- y la paga el producto.

create table if not exists public.envios_resumen (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    enviado_at timestamptz not null default now(),

    -- El tamaño, no el texto. Sirve para saber cuánto ocupa un resumen real
    -- antes de decidir nada sobre guardar las charlas.
    pregunta_chars int,
    respuesta_chars int
);

comment on table public.envios_resumen is
    'Un renglón por correo de resumen enviado. NO guarda el contenido de la consulta: sólo que se envió, cuándo y de qué tamaño.';

-- El tope se cuenta por usuario y por día: es la única consulta que hace la
-- función antes de mandar.
create index if not exists envios_resumen_usuario_fecha
    on public.envios_resumen (user_id, enviado_at desc);

alter table public.envios_resumen enable row level security;

-- Cada uno ve lo suyo. No hay policy de INSERT a propósito: el único que
-- escribe acá es la Edge Function con `service_role`, que saltea RLS. Si el
-- cliente pudiera insertar, podría inventarse envíos ajenos o —peor— borrarse
-- el propio historial para saltear el tope.
create policy "envios propios: leer" on public.envios_resumen
    for select using (auth.uid() = user_id);
