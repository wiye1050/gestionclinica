#!/usr/bin/env bash
set -euo pipefail

# Copia este archivo a scripts/load-listener-env.sh y rellena las rutas/secretos reales.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1) Clave de servicio (mantén service-account.json fuera del control de versiones)
export FIREBASE_SERVICE_ACCOUNT_KEY="$(cat "$REPO_ROOT/service-account.json")"

# 2) SMTP / notificaciones (ajusta según tu proveedor)
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="tu_correo@gmail.com"
export SMTP_PASS="tu_contraseña_de_aplicación"
export SMTP_FROM="tu_correo@gmail.com"
export NOTIFY_EMAIL_TO="destinatario@tuclinica.com"

# 3) Opcional: Slack
# export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T000/B000/XXXX"

echo "Variables cargadas. Ejecuta ahora: npm run events:listen"
