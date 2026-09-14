-- 2026-09-14 — Cerrar la puerta que dejó el mecanismo VIEJO de cupo.
--
-- 🔴 EL PROBLEMA, medido en producción el 14/9:
-- `increment_ai_usage(p_user_id)` e `increment_plano_usage(p_user_id)` son
-- SECURITY DEFINER, reciben el usuario POR PARÁMETRO y no preguntan quién llama.
-- Estaban ejecutables por `anon` y `authenticated`, o sea desde afuera con la
-- clave pública que viaja en el bundle. Y escriben en `ai_usage.request_count`,
-- que es la MISMA columna con la que `consumir_consulta_ia` lleva el cupo
-- mensual: cualquiera que conociera el uuid de un instalador podía sumarle
-- consultas hasta dejarlo sin cupo, y ensuciar la tabla con la que se deciden
-- los precios.
--
-- 🔑 NO SE REPARAN, SE BORRAN: no las llama nadie. Son la versión anterior del
-- mecanismo, reemplazada por `consumir_consulta_ia` el 2026-09-08 —esa sí está
-- bien cerrada (ni anon ni authenticated pueden ejecutarla) y la invocan las
-- Edge Functions con `clienteAdmin()`—. Verificado antes de escribir esto:
-- cero llamadas en `app/src` y en `supabase/functions`, y cero triggers colgando
-- de ellas.

drop function if exists public.increment_ai_usage(uuid);
drop function if exists public.increment_plano_usage(uuid);

-- `cupo_ia` SÍ valida identidad (compara auth.uid() contra el parámetro), así
-- que no era explotable. Se va igual porque tampoco la llama nadie: cada función
-- publicada en la API es una puerta que hay que seguir cuidando.
drop function if exists public.cupo_ia(uuid, date);

-- `handle_new_user()` es el trigger que crea el perfil al registrarse. No es una
-- API, pero estaba publicada como si lo fuera (/rest/v1/rpc/handle_new_user).
-- Revocar el EXECUTE no toca el trigger: el motor lo dispara con el dueño de la
-- función, no con el rol del que se registra.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Las tres funciones que quedaban con el `search_path` suelto. Sin esto, quien
-- pueda crear objetos en un schema que caiga antes en la búsqueda puede hacer
-- que la función use SU tabla en vez de la nuestra. `pg_temp` va último y
-- explícito por la misma razón.
alter function public.tocar_updated_at() set search_path = public, pg_temp;
alter function public.tocar_ficha_instalador() set search_path = public, pg_temp;
alter function public.inicio_del_ciclo(date, date) set search_path = public, pg_temp;
