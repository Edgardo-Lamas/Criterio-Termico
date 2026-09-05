# Setup: Supabase + MercadoPago

Guía paso a paso para conectar autenticación real y pagos en producción.

---

## 1. Supabase — Crear proyecto

1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Elegir organización, nombre `criterio-termico`, región `South America (São Paulo)`
3. Guardar la contraseña de la base de datos (la vas a necesitar)

### 1.1 Ejecutar la migración

En el dashboard de Supabase: **SQL Editor** → pegar y ejecutar el contenido de:

```
supabase/migrations/20260225_init.sql
```

Esto crea la tabla `profiles` y el trigger que crea un perfil automáticamente al registrarse.

### 1.2 Obtener las credenciales del frontend

**Settings → API:**
- `VITE_SUPABASE_URL` → Project URL (`https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` → `anon` `public` key

### 1.3 Configurar el archivo .env

```bash
# En app/
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

### 1.4 Deshabilitar confirmación de email (opcional para desarrollo)

**Authentication → Providers → Email** → desactivar "Confirm email".
En producción conviene dejarlo activado.

---

## 2. Supabase Edge Functions — Deploy

### 2.1 Instalar Supabase CLI

```bash
brew install supabase/tap/supabase
```

### 2.2 Inicializar y linkear el proyecto

```bash
# Desde la raíz del proyecto
supabase init
supabase login
supabase link --project-ref <tu-project-ref>
# El project-ref está en Settings → General
```

### 2.3 Configurar variables de entorno de las funciones

```bash
supabase secrets set MP_ACCESS_TOKEN="APP_USR-xxxx"
supabase secrets set MP_PRO_PLAN_ID="2c9380847xxxx"
supabase secrets set MP_PREMIUM_PLAN_ID="2c9380847yyyy"
supabase secrets set APP_URL="https://edgardolamas.github.io/Criterio-Termico"
```

### 2.4 Deploy de las funciones

```bash
supabase functions deploy create-subscription
supabase functions deploy mercadopago-webhook --no-verify-jwt
```

> 🔴 **El `--no-verify-jwt` del webhook no es opcional.** Supabase exige por defecto
> un JWT de sesión en toda Edge Function y lo rechaza en su gateway, antes de que el
> código se ejecute. MercadoPago no manda JWT: manda su firma en `x-signature`. Con
> la verificación puesta, cada aviso de pago recibe
> `{"code":"UNAUTHORIZED_NO_AUTH_HEADER"}` y **el tier del usuario nunca sube, aunque
> el pago se haya cobrado bien**. Verificado contra producción el 2026-08-28.
>
> La función no queda desprotegida: valida la firma HMAC de MP antes de tocar nada.
> Se reemplaza un control que no aplica por el que sí. `supabase/config.toml` ya lo
> deja declarado, así que el CLI lo toma solo.

### 2.5 Obtener la URL de las funciones

```
https://<project-ref>.supabase.co/functions/v1
```

Agregar al `.env`:
```bash
VITE_SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1
```

---

## 3. MercadoPago — Configurar suscripciones

### 3.0 🔴 Una aplicación PROPIA para el SaaS — no la del sitio

La cuenta ya tiene la aplicación **«Criterio Termico»**, y su webhook apunta al sitio
Astro (`crtermico.com/api/mp-webhook`, evento Pagos), que **cobra de verdad desde el
1/9**.

**No se reutiliza esa aplicación para el SaaS.** Motivo, documentado en el otro repo
(`docs/mercadopago.md`) después de costar una tarde entera de 401: en *Webhooks →
Configurar notificaciones*, **cada vez que se aprieta Guardar, MP emite una clave
secreta nueva y descarta la anterior**. Entrar ahí para sumarle los eventos del SaaS
deja vencida la clave del sitio en el mismo acto, y el síntoma es que los avisos de las
ventas de repuestos empiezan a rebotar con 401 sin que nada avise.

Cada aplicación tiene su propia URL de webhook y su propia clave. El dinero cae en la
misma cuenta igual.

**La aplicación del SaaS ya existe: «Criterio Termico Plataforma», AppID
`4528717241708762`** (creada el 2026-09-05, producto *suscripciones*, MLA). De ahí salen
el `MP_ACCESS_TOKEN` y la clave del webhook. La del sitio, «Criterio Termico»
(`1426858103774532`), no se toca.

### 3.1 Crear los planes de suscripción

Los planes se crean por API, no a mano, así queda registrado con qué valores:

```bash
bash scripts/mp-suscripciones.sh --planes
```

Lee los montos y el token de `~/.ct-mp-secrets` (ver la cabecera del script; el archivo
se crea a mano y se borra al terminar) y hace un `POST /preapproval_plan` con
`frequency: 1`, `frequency_type: "months"` y `currency_id: "ARS"`. Devuelve el `id` de
cada plan, que es lo que va en `MP_PRO_PLAN_ID` y `MP_PREMIUM_PLAN_ID`.

⚠ **Los montos van en pesos.** MP Argentina cobra en ARS: el plan lleva un número fijo
en pesos, no en dólares. Lo que la pantalla de `/cuenta` muestre en USD es otra
decisión, y hoy no coincide con nada cobrado.

⚠ **El plan anual que anuncia `/cuenta` no existe.** `create-subscription` maneja un
solo plan por tier. O se crean dos planes más (`frequency: 12`) y se amplía la función,
o se saca el cartel.

Para cambiar el precio de un plan que ya existe: `PUT /preapproval_plan/{id}` — no hace
falta crear otro ni migrar a los suscriptos.

### 3.2 Configurar el webhook

En la aplicación NUEVA, **Webhooks → Configurar notificaciones**:
- URL: `https://ntxkjtirkgqkjlzphvtd.supabase.co/functions/v1/mercadopago-webhook`
- Eventos: **`subscription_preapproval` Y `subscription_authorized_payment`**
- Copiar la **clave secreta** → va a `~/.ct-mp-secrets` como `MP_WEBHOOK_SECRET`

**Los dos eventos, no uno.** El primero avisa del alta y de cada cambio de estado; el
segundo, de cada cobro mensual. Con sólo el primero, a quien le rebote la tarjeta el
segundo mes le sigue funcionando todo hasta que MP dé la suscripción por vencida.

🔑 **Copiar la clave y salir SIN volver a guardar**, por lo dicho en 3.0: guardar
otra vez emite una clave nueva y deja vencida la que acabás de copiar.

#### La firma del webhook

MP firma cada aviso con HMAC-SHA256 sobre este texto exacto:

```
id:<data.id>;request-id:<x-request-id>;ts:<ts>;
```

El `id` sale del **query de la URL** (`?data.id=…`), no del cuerpo. Si alguna de las
tres partes no viene, se omite junto con su clave.

⚠ Esto es fácil de equivocar y **equivocarlo no da error**: el webhook rechaza todos
los pagos legítimos con 401 y no se entera nadie hasta que un cliente reclama que pagó
y sigue en `free`. Estuvo mal en este repo hasta el 2026-08-28.

### 3.3 Obtener credenciales

**Credenciales → Producción:**
- `MP_ACCESS_TOKEN` → Access Token (secreto — solo va en Supabase Secrets, NUNCA en el frontend)

---

## 4. Variables de entorno completas

Archivo `app/.env` en producción:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_FUNCTIONS_URL=https://xxxx.supabase.co/functions/v1
```

> `MP_ACCESS_TOKEN` y los IDs de planes van SOLO en Supabase Secrets (nunca en `.env` del frontend).

---

## 5. Flujo completo del usuario

```
Usuario → "Actualizar a PRO"
  → Frontend llama a Edge Function create-subscription (con token Supabase)
  → Edge Function crea preapproval en MP y devuelve init_point
  → Usuario redirigido a checkout de MercadoPago
  → Pago exitoso → MP llama al webhook
  → Webhook actualiza profiles.tier = 'pro' en Supabase
  → Próximo login: el store lee el tier actualizado
```

---

## 6. Modo demo (sin Supabase configurado)

Si `VITE_SUPABASE_URL` está vacío, la app funciona en **modo demo**:
- Login con cualquier email, sin contraseña real
- Tier siempre `free`
- Los botones de upgrade no hacen nada

---

## 7. Qué queda guardado de cada suscripción

Desde el 2026-09-05 el webhook no sólo pisa `profiles.tier`: escribe la tabla
`suscripciones` (migración `20260905_suscripciones.sql`) con el `preapproval_id`, el
tier, el estado crudo de MP, el monto, la moneda, el último cobro y el próximo. Sin eso
no había con qué contestarle a alguien que reclama un pago, ni forma de cancelar una
suscripción desde la app (cancelar es un `PUT /preapproval/{id}` y ese id no se
guardaba).

**El tier ya no sale del último aviso: se recalcula.** Vale el más alto entre las
suscripciones `authorized` del usuario, y `free` si no queda ninguna. Con el modelo
viejo, alguien con una suscripción vieja cancelada y una nueva activa bajaba a `free`
cuando llegaba un aviso de la vieja — y los avisos de MP pueden llegar fuera de orden.

Puesta en marcha completa, un paso por corrida:

```bash
bash scripts/mp-suscripciones.sh --migracion   # crea la tabla
bash scripts/mp-suscripciones.sh --planes      # crea los planes en MP
bash scripts/mp-suscripciones.sh --secrets     # carga los 4 secrets
bash scripts/mp-suscripciones.sh --deploy      # sube el webhook nuevo
bash scripts/mp-suscripciones.sh --verificar   # controla que quedó todo
```
