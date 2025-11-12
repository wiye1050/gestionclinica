## Automatizaciones sobre el Event Bus

Este documento resume cómo consumir los eventos canónicos (`events/*`) para disparar notificaciones, tareas o cálculos de KPIs.

### Script local (`npm run events:listen`)

Hemos añadido un listener ligero en `scripts/events-listener.ts`:

```bash
# 1) Abre una terminal y colócate en la raíz del repo
cd "/Users/<tu-usuario>/Visual Studio/gestionclinica"

# 2) Carga las variables (una sola vez por terminal)
#    - Método rápido: copia scripts/load-listener-env.example.sh → scripts/load-listener-env.sh,
#      rellena los secretos y ejecútalo.
#    - Método manual: exporta cada variable como hicimos durante la sesión.
source scripts/load-listener-env.sh

# 3) Lanza el listener
npm run events:listen
```
> Nota: `scripts/load-listener-env.sh` está en `.gitignore` para que puedas guardar tus credenciales sin subirlas al repositorio. Mantén `service-account.json` fuera de control de versiones.

Requisitos:

1. En `.env.local` guarda al menos:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON del service account con permisos de lectura en `events/*`).
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `NOTIFY_EMAIL_TO` si quieres correo (usa contraseña de aplicación de Gmail).
   - Opcional `SLACK_WEBHOOK_URL` si quieres avisos en Slack.
2. Cada vez que abras una terminal nueva ejecuta `source .env.local` antes de correr scripts para cargar las variables.
3. El listener se conecta vía Firebase Admin, reescucha los últimos 5 minutos y procesa lo que vaya llegando.
4. Handlers preconfigurados:
   - `Inventory.Deducted`: crea tarea + mensaje Slack para reposiciones.
   - `FollowUp.Scheduled`: genera recordatorio y avisa vía Slack.
   - `Episode.StateChanged`: registra KPIs.
   - `Quote.Presented` / `Quote.Accepted`: seguimiento comercial + KPIs.

Cada handler se implementa en `scripts/events-listener.ts` (`handlers` object). Allí puedes enchufar Slack, email, Twilio, etc. o crear documentos en `tasks`.

### Cloud Function (`automateEvents`)

- Código en `functions/src/index.ts`. Usa Firebase Functions v2 (`onDocumentCreated('events/{eventId}')`) y comparte la misma lógica que el listener local a través de `lib/events/processEvent.ts`.
- Build/deploy:

  ```bash
  # 1) Instala dependencias de functions (solo la primera vez)
  npm install --prefix functions

  # 2) Compila antes de desplegar
  npm run build --prefix functions

  # 3) Despliega solo esta codebase
  firebase deploy --only functions
  # o usa el atajo definido en package.json
  npm run deploy --prefix functions
  ```

- Variables de entorno en producción:
  - Usa `firebase functions:config:set` para guardar los secretos bajo el bloque `automations`. Ejemplo:
    ```bash
    firebase functions:config:set \
      automations.smtp_host="smtp.gmail.com" \
      automations.smtp_port="587" \
      automations.smtp_user="guillemenendez1050@gmail.com" \
      automations.smtp_pass="tu_app_password" \
      automations.smtp_from="guillemenendez1050@gmail.com" \
      automations.notify_email_to="guillemenendez1050@gmail.com" \
      automations.slack_webhook_url=""
    ```
  - Si necesitas limpiar el valor, usa `firebase functions:config:unset automations.slack_webhook_url`.
  - Tras configurar los valores, despliega con `firebase deploy --only functions`. La función lee primero `process.env` (para uso local) y, si no existe, cae en `functions.config().automations`.
- Observabilidad: los logs se ven en la consola de Firebase (`Functions > Logs`) gracias a `firebase-functions/logger`.
- Limpieza automática (`automation-processed`): cada evento almacenado incluye `expireAt` (30 días). Activa el TTL de Firestore para esa colección desde la consola o con:
  ```bash
  gcloud firestore fields ttls update \
    --collection-group=automation-processed \
    --field=expireAt
  ```
  Así no tendrás que ejecutar scripts manuales para borrar deduplicaciones antiguas.

#### Próximo paso recomendado

1. Si quieres un enfoque pull en lugar de triggers, prepara un cron (Cloud Scheduler + Cloud Run job) que invoque una build empaquetada del listener (`scripts/events-listener.ts`). Usa Secret Manager para inyectar `FIREBASE_SERVICE_ACCOUNT_KEY`, `SMTP_*` y `SLACK_WEBHOOK_URL`.
2. Documenta en este archivo cómo añadir nuevos canales de notificación (SMS, ERP, etc.) para que el equipo lo extienda sin romper la trazabilidad.

### Ideas de automatización

| Evento | Acción actual (script) | Ideas futuras |
|--------|------------------------|---------------|
| `Inventory.Deducted` | Crea `INVENTORY_ALERT` en `tasks/`, avisa por Slack y correo a compras. | Generar pedido automático o integrar con ERP. |
| `FollowUp.Scheduled` | Registra `FOLLOW_UP_REMINDER` + aviso Slack/correo con fecha. | Enviar SMS/email al paciente, crear cita en Google Calendar. |
| `Episode.StateChanged` | Guarda un documento en `kpi-events/<eventId>` con `from/to/trigger` para analítica. | Calcular KPIs (tiempo en estado, funnel) y alimentar dashboards o BigQuery. |
| `Quote.Presented` | Crea `QUOTE_FOLLOWUP` y notifica al canal comercial en Slack. | Integrar con CRM para asignación automática a ventas. |
| `Quote.Accepted` | Registra el evento en `kpi-events/quote-…` y envía confirmación a Slack. | Avisar a facturación y desbloquear ejecución del plan. |
| `Procedure.Completed` | *(pendiente)* | Generar informe automático o ajustar stock/billing. |

### Buenas prácticas

- Mantén el `handler` idempotente (puede reintentarse).
- Almacena logs/errores en `auditLogs` o en un canal de observabilidad.
- Para notificaciones externas utiliza colas (Pub/Sub) si aumenta la carga.
- Refresca periódicamente los índices (`events`: `subject.id + timestamp`) para mantener las consultas rápidas.
- Si necesitas avisos en Slack, configura `SLACK_WEBHOOK_URL` antes de ejecutar el listener o desplegar la función.

Con este esquema puedes implementar nuevas automatizaciones simplemente añadiendo un caso al objeto `handlers` o desplegando la Cloud Function correspondiente.
