#!/usr/bin/env bash
#
# Mudanza del SaaS a app.crtermico.com — la parte que vive en Supabase.
#
# Se corre A MANO porque necesita el token del llavero, que el asistente no
# puede leer. Con `--solo-diagnostico` no cambia nada: sólo muestra el estado.
#
#   bash scripts/dominio-a-supabase.sh --solo-diagnostico   # no cambia nada
#   bash scripts/dominio-a-supabase.sh --auth
#   bash scripts/dominio-a-supabase.sh --secrets
#   bash scripts/dominio-a-supabase.sh --deploy
#   bash scripts/dominio-a-supabase.sh --verificar
#
# Qué hace, en orden:
#   1. Site URL de Auth  → app.crtermico.com (de ahí salen los links de los
#      correos de confirmación y de recuperar contraseña).
#   2. Lista de redirects permitidos → se le AGREGAN los dominios que falten,
#      nunca se pisa lo que ya había.
#   3. Secrets ALLOWED_ORIGIN (los dos dominios) y APP_URL (a dónde vuelve el
#      comprador desde MercadoPago).
#   4. Despliega las Edge Functions.
#   5. Verifica el CORS real contra producción.

set -euo pipefail

REF="ntxkjtirkgqkjlzphvtd"
NUEVO="https://app.crtermico.com"
VIEJO="https://criterio-termico.vercel.app"
LOCAL="http://localhost:5173"

PASO="${1:---solo-diagnostico}"
case "$PASO" in
    --solo-diagnostico|--auth|--secrets|--deploy|--verificar) ;;
    *) echo "Uso: $0 [--solo-diagnostico|--auth|--secrets|--deploy|--verificar]"; exit 2 ;;
esac

cd "$(dirname "$0")/.."

# ── Token ─────────────────────────────────────────────────────────────────────
# El CLI se cuelga MUDO en shell no interactiva si no lo encuentra: por eso se
# pasa a mano y se corta acá si no está.
if ! SUPABASE_ACCESS_TOKEN=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null \
        | sed 's/^go-keyring-base64://' | base64 -d 2>/dev/null); then
    echo "🔴 No hay token de Supabase en el llavero. Corré 'supabase login' y volvé a intentar."
    exit 1
fi
export SUPABASE_ACCESS_TOKEN
API="https://api.supabase.com/v1/projects/$REF"
AUTH=(-H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN")

# ── 1. Estado actual ──────────────────────────────────────────────────────────
config=$(curl -s "${AUTH[@]}" "$API/config/auth")

if [[ "$PASO" == "--solo-diagnostico" ]]; then
echo "══ ESTADO ═══════════════════════════════════════════════════════════════"
echo "$config" | python3 -c '
import json, sys
d = json.load(sys.stdin)
print("site_url          :", d.get("site_url"))
print("uri_allow_list    :", d.get("uri_allow_list") or "(vacía)")
print("mailer_autoconfirm:", d.get("mailer_autoconfirm"), "  ← en true el registro no verifica el email")
'
echo
echo "Secrets cargados (nombres, sin valores):"
curl -s "${AUTH[@]}" "$API/secrets" | python3 -c '
import json, sys
for s in sorted(json.load(sys.stdin), key=lambda x: x["name"]):
    print("  ·", s["name"])
'

echo
echo "Diagnóstico nada más: no se tocó nada."
exit 0
fi

# ── 2. Auth ───────────────────────────────────────────────────────────────────
if [[ "$PASO" == "--auth" ]]; then
lista=$(echo "$config" | NUEVO="$NUEVO" VIEJO="$VIEJO" LOCAL="$LOCAL" python3 -c '
import json, os, sys
actual = json.load(sys.stdin).get("uri_allow_list") or ""
entradas = [e.strip() for e in actual.split(",") if e.strip()]
for dominio in (os.environ["NUEVO"], os.environ["VIEJO"], os.environ["LOCAL"]):
    for patron in (dominio, dominio + "/**"):
        if patron not in entradas:
            entradas.append(patron)
print(",".join(entradas))
')
python3 -c "
import json, os
print(json.dumps({'site_url': '$NUEVO', 'uri_allow_list': '$lista'}))" > /tmp/ct-auth.json
curl -s -X PATCH "${AUTH[@]}" -H "Content-Type: application/json" \
     --data-binary @/tmp/ct-auth.json "$API/config/auth" > /dev/null
echo "✓ Auth: site_url y lista de redirects al día"
rm -f /tmp/ct-auth.json
curl -s "${AUTH[@]}" "$API/config/auth" | python3 -c '
import json, sys
d = json.load(sys.stdin)
print("  site_url      :", d.get("site_url"))
print("  uri_allow_list:", d.get("uri_allow_list"))
'
fi

# ── 3. Secrets ────────────────────────────────────────────────────────────────
if [[ "$PASO" == "--secrets" ]]; then
supabase secrets set --project-ref "$REF" \
    "ALLOWED_ORIGIN=$NUEVO,$VIEJO" \
    "APP_URL=$NUEVO" > /dev/null
echo "✓ Secrets: ALLOWED_ORIGIN y APP_URL"
fi

# ── 4. Edge Functions ─────────────────────────────────────────────────────────
# El webhook de MercadoPago va sin verificación de JWT — MP no manda ninguno y
# el gateway de Supabase lo rechazaría antes de ejecutar el código. Está
# declarado en supabase/config.toml, así que el CLI lo toma solo.
if [[ "$PASO" == "--deploy" ]]; then
for f in asistente-termico analizar-plano create-subscription mercadopago-webhook; do
    supabase functions deploy "$f" --project-ref "$REF" > /dev/null 2>&1 \
        && echo "✓ desplegada: $f" \
        || echo "🔴 FALLÓ: $f"
done
fi

# ── 5. Verificación contra producción ─────────────────────────────────────────
if [[ "$PASO" == "--verificar" ]]; then
echo
echo "══ VERIFICACIÓN ═════════════════════════════════════════════════════════"
echo "Preflight CORS desde $NUEVO (tiene que contestar ese mismo dominio):"
for f in asistente-termico analizar-plano create-subscription; do
    permitido=$(curl -s -X OPTIONS "https://$REF.supabase.co/functions/v1/$f" \
        -H "Origin: $NUEVO" \
        -H "Access-Control-Request-Method: POST" \
        -D - -o /dev/null | grep -i "access-control-allow-origin" | tr -d '\r' | cut -d' ' -f2-)
    echo "  $f → ${permitido:-🔴 sin cabecera}"
done
echo
echo "Webhook de MercadoPago (tiene que dar 401 por FIRMA, no 401 por falta de JWT):"
curl -s -X POST "https://$REF.supabase.co/functions/v1/mercadopago-webhook" \
     -H "Content-Type: application/json" -d '{"type":"test"}' | head -c 200
echo
fi
