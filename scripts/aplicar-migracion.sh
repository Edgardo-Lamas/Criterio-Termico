#!/usr/bin/env bash
#
# Aplica UNA migración a la base de producción.
#
#   bash scripts/aplicar-migracion.sh supabase/migrations/20260908_cupo_mensual.sql
#   bash scripts/aplicar-migracion.sh <archivo.sql> --ver    # la muestra y no aplica nada
#
# POR QUÉ ESTE SCRIPT Y NO `supabase db push`. El registro de migraciones de la
# base está desfasado del disco: `20260813_asistente_sin_cuenta`,
# `20260813_conocimiento_tier`, `20260814_bandeja_revision` y
# `20260905_suscripciones` se aplicaron a mano y no figuran como aplicadas.
# Un `db push` intentaría correrlas todas de nuevo. Este script aplica una sola,
# la que se le pasa, y nada más.
#
# ⚠ LO CORRE EDGARDO, no el asistente: el token sale del llavero de macOS y eso
# pide huella o contraseña. Desde Claude Code el comando se queda esperando un
# diálogo que nadie contesta.

set -euo pipefail

REF="ntxkjtirkgqkjlzphvtd"
MIGRACION="${1:-}"
MODO="${2:-}"

if [[ -z "$MIGRACION" ]]; then
    echo "Uso: bash scripts/aplicar-migracion.sh <archivo.sql> [--ver]"
    exit 2
fi

if [[ ! -f "$MIGRACION" ]]; then
    echo "🔴 No existe: $MIGRACION"
    exit 1
fi

if [[ "$MODO" == "--ver" ]]; then
    echo "── $MIGRACION ──"
    cat "$MIGRACION"
    exit 0
fi

# ⚠ El llavero guarda el token de DOS formas según la versión del CLI: en texto
# plano (`sbp_…`) o en base64 con el prefijo `go-keyring-base64:`. Decodificar
# siempre —que es lo que hacen `mp-suscripciones.sh` y `dominio-a-supabase.sh`—
# destroza el token plano y lo deja en 29 bytes de basura: la Management API
# contesta 400 CON EL CUERPO VACÍO, que no dice nada. Verificado el 2026-09-08.
if ! RAW=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null); then
    echo "🔴 No hay token de Supabase en el llavero. Corré 'supabase login'."
    exit 1
fi

case "$RAW" in
    go-keyring-base64:*) TOKEN=$(printf '%s' "${RAW#go-keyring-base64:}" | base64 -d) ;;
    *)                   TOKEN="$RAW" ;;
esac

if [[ -z "$TOKEN" ]]; then
    echo "🔴 El token del llavero quedó vacío al leerlo."
    exit 1
fi

TMP=$(mktemp /tmp/ct-migracion.XXXXXX.json)
trap 'rm -f "$TMP"' EXIT

python3 -c "import json,sys;print(json.dumps({'query':open(sys.argv[1],encoding='utf-8').read()}))" \
    "$MIGRACION" > "$TMP"

echo "Aplicando $(basename "$MIGRACION") a ${REF}…"

# Con curl y no con urllib: Cloudflare bloquea el User-Agent de Python (403).
respuesta=$(curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    --data-binary @"$TMP")

# La Management API devuelve [] cuando el SQL no produce filas, que es el caso
# normal de una migración. Cualquier otra cosa es un error o un resultado.
if [[ "$respuesta" == "[]" ]]; then
    echo "✓ Aplicada."
else
    echo "🔴 La base contestó:"
    echo "$respuesta"
    exit 1
fi
