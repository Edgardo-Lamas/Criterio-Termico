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
supabase functions deploy mercadopago-webhook
```

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

### 3.1 Crear los planes de suscripción

En [Developers → Panel](https://www.mercadopago.com.ar/developers/panel):

1. Ir a **Suscripciones → Planes**
2. Crear plan **Criterio Térmico PRO**:
   - Frecuencia: mensual
   - Monto: USD 10 (o ARS según precios actuales)
3. Crear plan **Criterio Térmico PREMIUM**:
   - Frecuencia: mensual
   - Monto: USD 18
4. Guardar los IDs de cada plan (`2c9380847xxxx`)

### 3.2 Configurar el webhook

En **Configuración → Webhooks**:
- URL: `https://<project-ref>.supabase.co/functions/v1/mercadopago-webhook`
- Eventos: `subscription_preapproval`

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
