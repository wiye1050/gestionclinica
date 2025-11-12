## Episodios Clínicos – Guía Operativa

Esta guía resume cómo funciona el **pipeline de episodios** (captación → mantenimiento), qué endpoints lo soportan y cómo aprovechar el bus de eventos para auditoría, notificaciones y KPIs.

---

### 1. Estados y transiciones

```text
CAPTACION --(Lead.Qualified)--> TRIAJE --(Triage.Routed)--> CITACION --(Appointment.Confirmed)--> RECIBIMIENTO
RECIBIMIENTO --(Consent.Signed.Base)--> EXPLORACION --(Exploration.Completed)--> DIAGNOSTICO --(Plan.Created)--> PLAN
PLAN --(Plan.Proposed)--> PRESUPUESTO --(Quote.Accepted + Consent.Signed.Specific)--> TRATAMIENTO
TRATAMIENTO --(Treatment.ControlReached)--> SEGUIMIENTO --(Episode.Closed)--> ALTA --(Recall.Scheduled)--> MANTENIMIENTO
```

- Las transiciones se calculan en `lib/workflows/episodeMachine.ts`.
- `applyEpisodeTransition` actualiza el episodio y emite siempre `Episode.StateChanged`.
- Los guards (consentimientos, presupuesto aceptado, control clínico, recall) se pasan como `context`.

---

### 2. Endpoints por fase

| Paso | Endpoint | Roles | Evento emitido | Notas |
|------|----------|-------|----------------|-------|
| Captar lead | `POST /api/leads` | admin, coordinacion | `Lead.Created` (+ opcional `Lead.Qualified`) | Crea paciente si es necesario y abre episodio en `CAPTACION`. |
| Triaje | `POST /api/triage/submit` | admin, coordinacion, terapeuta | `Triage.Submitted` | Guarda formulario y marca riesgos. |
| Derivar a citación | `POST /api/triage/route` | admin, coordinacion | `Triage.Routed` | Crea “orden de citación” en `tasks`. |
| Agendar cita | `POST /api/appointments/book` | admin, coordinacion, terapeuta | `Appointment.Booked` | Uso actual del formulario de agenda. |
| Confirmar cita | `POST /api/appointments/confirm` | admin, coordinacion, terapeuta | `Appointment.Confirmed` | Avanza a `RECIBIMIENTO`. |
| Consentimiento base | `POST /api/consents/sign` (type `BASE`) | admin, coordinacion, doctor | `Consent.Signed.Base` | Activa paso a `EXPLORACION`. |
| Plan terapéutico | `POST /api/plan/propose` | admin, coordinacion, terapeuta | `Plan.Proposed` | Transición `PLAN -> PRESUPUESTO`. |
| Presentar presupuesto | `POST /api/quote/present` | admin, coordinacion | `Quote.Presented` | Genera/actualiza documento. |
| Aceptar presupuesto | `POST /api/quote/accept` | admin, coordinacion, terapeuta | `Quote.Accepted` | Requiere consentimiento específico previo, avanza a `TRATAMIENTO`. |
| Procedimiento | `POST /api/procedures/complete` | admin, doctor, terapeuta | `Procedure.Completed`, `Inventory.Deducted` | Permite checklist e impactos en inventario. |
| Seguimiento | `POST /api/followups/schedule` | admin, coordinacion, terapeuta | `FollowUp.Scheduled` | Agenda PROs / revisiones posteriores. |
| Alta & mantenimiento | `POST /api/episodes/discharge` | admin, coordinacion, doctor | `Episode.Closed` (+ `Recall.Scheduled` opcional) | Cierra episodio y agenda recall si se indica fecha. |

Lecturas auxiliares:

- `/api/episodios` → lista episodios con paciente embebido (`state`, `tags`, `riskFlags`…).
- `/api/episodios/[id]/events` → timeline ordenado de eventos canónicos.
- `/api/pacientes`, `/api/profesionales`, `/api/catalogo-servicios`, `/api/salas` → fuentes server-side para formularios y combos.

Cada endpoint valida con **Zod**, usa el **Admin SDK** para persistir y emite exactamente un evento canónico mediante `emitEvent`.

---

### 3. Bus de eventos (`events/*`)

Campos:

```ts
type CanonicalEvent = {
  type: string;                // p.ej. "Quote.Accepted"
  subject: { kind: 'episode' | 'patient' | 'plan' | 'procedure' | 'appointment' | 'quote'; id: string };
  actorUserId?: string;
  timestamp: number;           // milisegundos
  meta?: Record<string, unknown>;
}
```

- Todos los eventos se escriben en la colección `events`.
- Se consultan desde `/api/episodios/[id]/events` (orden `timestamp ASC`).
- Firestore index requerido: `subject.id ASC` + `timestamp ASC` (ya definido en `firestore.indexes.json`).

**Ideas de suscripciones (Cloud Functions):**

| Evento | Acción sugerida |
|--------|-----------------|
| `Appointment.Booked` | Enviar recordatorio WhatsApp/SMS al paciente y crear tarea para recepción. |
| `Quote.Presented` | Notificar a coordinación para seguimiento comercial. |
| `Inventory.Deducted` | Actualizar stock y disparar `Inventory.ReplenishAlert` si cae bajo umbral. |
| `FollowUp.Scheduled` | Programar email de PROs (VAS/ODI) y registrar SLA. |
| `Episode.StateChanged` | Calcular KPIs (tiempo por estado, funnel). |

---

### 4. Integrar un módulo con el pipeline

1. **Agregar endpoint** (si aún no existe) siguiendo el patrón:
   - Validar con `zod`.
   - Comprobar roles vía `getCurrentUser`.
   - Operar con `adminDb`.
   - Emitir evento con `emitEvent`.
   - Si cambia de estado, usar `applyEpisodeTransition`.
2. **Crear hook/React Query** que consuma el endpoint (`fetch` + caché). Evita `getDocs` en cliente.
3. **Actualizar UI** para usar el hook/endpoint nuevo (ej. `AgendaEventForm` ya consume `/api/profesionales`, `/api/pacientes`, etc.).
4. **Documentar triggers**: añade la fila correspondiente a la tabla de arriba.
5. **Ejecutar** `npm run lint && npm run typecheck && npm run build` antes de desplegar.

---

### 5. Próximos pasos

- **Cobertura**: terminar de migrar los módulos restantes (inventario, tratamientos) para que toda lectura/escritura pase por API + event bus.
- **Automatización**: crear Cloud Functions sobre `events/*` (notificaciones, KPIs, stock, NPS).
- **Tests e2e**: cubrir la secuencia principal (lead → alta) invocando los endpoints para asegurar que los triggers y guards siguen válidos tras futuras iteraciones.
