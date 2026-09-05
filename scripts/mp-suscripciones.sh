#!/usr/bin/env bash
#
# Poner a cobrar las suscripciones del SaaS con Mercado Pago.
#
# Un paso por corrida, en este orden:
#
#   bash scripts/mp-suscripciones.sh --migracion    # crea la tabla `suscripciones`
#   bash scripts/mp-suscripciones.sh --planes       # crea los dos planes en MP
#   bash scripts/mp-suscripciones.sh --secrets      # carga los 4 secrets en Supabase
#   bash scripts/mp-suscripciones.sh --deploy       # sube el webhook nuevo
#   bash scripts/mp-suscripciones.sh --verificar    # controla que quedó todo
#
# 🔴 NINGÚN SECRETO SE ESCRIBE EN EL CHAT NI EN EL HISTORIAL DE LA TERMINAL.
# Los pasos que necesitan credenciales las leen de ~/.ct-mp-secrets, un archivo
# que se crea a mano, se usa y se borra:
#
#   touch ~/.ct-mp-secrets && chmod 600 ~/.ct-mp-secrets
#   # editarlo y poner, una por línea:
#   #   MP_ACCESS_TOKEN=APP_USR-...
#   #   MP_WEBHOOK_SECRET=...
#   #   MONTO_PRO=12000
#   #   MONTO_PREMIUM=21000
#   #   MP_PRO_PLAN_ID=        (lo completa el paso --planes)
#   #   MP_PREMIUM_PLAN_ID=
#
#   Al terminar todo:  rm ~/.ct-mp-secrets

set -euo pipefail

REF="ntxkjtirkgqkjlzphvtd"
APP_URL="https://app.crtermico.com"
SECRETOS="$HOME/.ct-mp-secrets"
MIGRACION="supabase/migrations/20260905_suscripciones.sql"

PASO="${1:---ayuda}"
cd "$(dirname "$0")/.."

# ── Token de Supabase (llavero) ───────────────────────────────────────────────
supabase_token() {
    if ! SUPABASE_ACCESS_TOKEN=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null \
            | sed 's/^go-keyring-base64://' | base64 -d 2>/dev/null); then
        echo "🔴 No hay token de Supabase en el llavero. Corré 'supabase login'."
        exit 1
    fi
    export SUPABASE_ACCESS_TOKEN
}

cargar_secretos() {
    if [[ ! -f "$SECRETOS" ]]; then
        echo "🔴 Falta $SECRETOS. Ver la cabecera de este script: se crea a mano y se borra al final."
        exit 1
    fi
    set -a; source "$SECRETOS"; set +a
}

case "$PASO" in

# ── 1. La tabla ───────────────────────────────────────────────────────────────
--migracion)
    supabase_token
    python3 -c "import json;print(json.dumps({'query':open('$MIGRACION').read()}))" > /tmp/ct-mig.json
    # Con curl y no con urllib: Cloudflare bloquea el User-Agent de Python (403).
    respuesta=$(curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
        -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        -H "Content-Type: application/json" --data-binary @/tmp/ct-mig.json)
    rm -f /tmp/ct-mig.json
    if [[ "$respuesta" == "[]" ]]; then
        echo '✓ Tabla suscripciones creada (la Management API devuelve [] cuando sale bien)'
    else
        echo "🔴 La migración devolvió: $respuesta"
        exit 1
    fi
    ;;

# ── 2. Los planes en MP ───────────────────────────────────────────────────────
--planes)
    cargar_secretos
    : "${MP_ACCESS_TOKEN:?falta MP_ACCESS_TOKEN en $SECRETOS}"
    : "${MONTO_PRO:?falta MONTO_PRO en $SECRETOS}"
    : "${MONTO_PREMIUM:?falta MONTO_PREMIUM en $SECRETOS}"

    crear_plan() {
        local nombre="$1" monto="$2"
        curl -s -X POST 'https://api.mercadopago.com/preapproval_plan' \
            -H "Authorization: Bearer $MP_ACCESS_TOKEN" \
            -H 'Content-Type: application/json' \
            -d "{
                \"reason\": \"Criterio Térmico $nombre\",
                \"auto_recurring\": {
                    \"frequency\": 1,
                    \"frequency_type\": \"months\",
                    \"transaction_amount\": $monto,
                    \"currency_id\": \"ARS\"
                },
                \"back_url\": \"$APP_URL/cuenta\"
            }"
    }

    for par in "PRO:$MONTO_PRO" "PREMIUM:$MONTO_PREMIUM"; do
        nombre="${par%%:*}"; monto="${par##*:}"
        salida=$(crear_plan "$nombre" "$monto")
        id=$(echo "$salida" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("id",""))' 2>/dev/null || true)
        if [[ -n "$id" ]]; then
            echo "✓ Plan $nombre creado — \$$monto/mes ARS"
            echo "   MP_${nombre}_PLAN_ID=$id   ← copiar a $SECRETOS"
        else
            echo "🔴 No se pudo crear el plan $nombre. MP contestó:"
            echo "$salida" | head -c 500; echo
            exit 1
        fi
    done
    ;;

# ── 3. Los secrets en Supabase ────────────────────────────────────────────────
--secrets)
    cargar_secretos
    : "${MP_ACCESS_TOKEN:?falta MP_ACCESS_TOKEN}"
    : "${MP_WEBHOOK_SECRET:?falta MP_WEBHOOK_SECRET}"
    : "${MP_PRO_PLAN_ID:?falta MP_PRO_PLAN_ID — sale del paso --planes}"
    : "${MP_PREMIUM_PLAN_ID:?falta MP_PREMIUM_PLAN_ID — sale del paso --planes}"
    supabase_token

    supabase secrets set --project-ref "$REF" \
        "MP_ACCESS_TOKEN=$MP_ACCESS_TOKEN" \
        "MP_WEBHOOK_SECRET=$MP_WEBHOOK_SECRET" \
        "MP_PRO_PLAN_ID=$MP_PRO_PLAN_ID" \
        "MP_PREMIUM_PLAN_ID=$MP_PREMIUM_PLAN_ID" > /dev/null
    echo "✓ Cargados los 4 secrets de MercadoPago"
    ;;

# ── 4. Desplegar ──────────────────────────────────────────────────────────────
--deploy)
    supabase_token
    for f in mercadopago-webhook create-subscription; do
        supabase functions deploy "$f" --project-ref "$REF" > /dev/null 2>&1 \
            && echo "✓ desplegada: $f" || { echo "🔴 FALLÓ: $f"; exit 1; }
    done
    ;;

# ── 5. Control ────────────────────────────────────────────────────────────────
--verificar)
    supabase_token
    echo "Secrets cargados:"
    curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        "https://api.supabase.com/v1/projects/$REF/secrets" | python3 -c '
import json, sys
nombres = {s["name"] for s in json.load(sys.stdin)}
for req in ("MP_ACCESS_TOKEN", "MP_WEBHOOK_SECRET", "MP_PRO_PLAN_ID", "MP_PREMIUM_PLAN_ID"):
    print("  " + ("✓" if req in nombres else "🔴 FALTA") + " " + req)
'
    echo
    echo "Tabla suscripciones (filas, RLS y policies — sin RLS la tabla queda abierta):"
    cat > /tmp/ct-q.sql <<'SQL'
select
    (select count(*) from public.suscripciones)                          as filas,
    c.relrowsecurity                                                     as rls_activa,
    (select count(*) from pg_policies where tablename = 'suscripciones') as policies
from pg_class c
where c.relname = 'suscripciones'
SQL
    python3 -c "import json;print(json.dumps({'query':open('/tmp/ct-q.sql').read()}))" > /tmp/ct-q.json
    curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
        -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        -H "Content-Type: application/json" --data-binary @/tmp/ct-q.json
    rm -f /tmp/ct-q.json /tmp/ct-q.sql
    echo
    echo
    echo "Webhook (con los secrets cargados tiene que dar 401 por FIRMA, ya no 500):"
    curl -s -o /dev/null -w "  HTTP %{http_code}\n" -X POST \
        "https://$REF.supabase.co/functions/v1/mercadopago-webhook" \
        -H "Content-Type: application/json" -d '{"type":"test"}'
    ;;

# ── Registros de las funciones ────────────────────────────────────────────────
# Lectura pura. Para ver qué contestó MercadoPago cuando el navegador falla sin
# decir nada. Segundo argumento: function_logs (los console.log de la función,
# por defecto) o function_edge_logs (los pedidos que entran).
--logs)
    supabase_token
    TABLA="${2:-function_logs}"
    # -G con --data-urlencode arma el query string solo: nada de escapar a mano.
    curl -s -G "https://api.supabase.com/v1/projects/$REF/analytics/endpoints/logs.all" \
        -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        --data-urlencode "sql=select timestamp, event_message from $TABLA order by timestamp desc limit 30" \
        | python3 -c '
import json, sys
crudo = sys.stdin.read()
try:
    d = json.loads(crudo)
except Exception:
    print(crudo[:600]); raise SystemExit
if isinstance(d, dict) and d.get("error"):
    print("error:", d["error"]); raise SystemExit
filas = d.get("result") if isinstance(d, dict) else d
if not filas:
    print("(sin registros en esa tabla)")
for fila in filas or []:
    print(fila.get("timestamp"), "·", str(fila.get("event_message"))[:400])
'
    ;;

*)
    sed -n '2,30p' "$0"
    ;;
esac
