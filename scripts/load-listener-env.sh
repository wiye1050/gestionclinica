#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "No se encontró $ENV_FILE. Añade tus credenciales ahí antes de lanzar el listener." >&2
  exit 1
fi

get_var() {
  local key="$1"
  sed -n "s/^${key}=//p" "$ENV_FILE"
}

export FIREBASE_SERVICE_ACCOUNT_KEY="$(get_var FIREBASE_SERVICE_ACCOUNT_KEY)"
export SMTP_HOST="$(get_var SMTP_HOST)"
export SMTP_PORT="$(get_var SMTP_PORT)"
export SMTP_USER="$(get_var SMTP_USER)"
export SMTP_PASS="$(get_var SMTP_PASS)"
export SMTP_FROM="$(get_var SMTP_FROM)"
export NOTIFY_EMAIL_TO="$(get_var NOTIFY_EMAIL_TO)"
export SLACK_WEBHOOK_URL="$(get_var SLACK_WEBHOOK_URL)"

if [ -z "${FIREBASE_SERVICE_ACCOUNT_KEY:-}" ]; then
  echo "Falta FIREBASE_SERVICE_ACCOUNT_KEY en .env.local" >&2
  exit 1
fi

echo "Variables cargadas. Ejecuta ahora: npm run events:listen"
