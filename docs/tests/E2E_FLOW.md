# Flujo E2E: lead → alta

Script: `npm run events:listen` ya monitoriza los eventos, y `npm run e2e:episode` ejecuta el pipeline completo (ver abajo) para validar que los endpoints y el state machine funcionan de extremo a extremo.

## Requisitos
1. Define `FIREBASE_SERVICE_ACCOUNT_KEY` en tu shell (mismo JSON usado para despliegues).
2. Debe existir al menos un profesional y una sala en Firestore. Si no hay ninguno, el script creará entradas mínimas.

## Ejecución
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY="$(cat service-account.json)"
npm run e2e:episode
```

El script `scripts/e2e-episode-flow.ts` realiza estos pasos automáticamente:
1. Crea paciente + episodio (`Lead.Created`) y lo califica a TRIAJE.
2. Registra triaje, lo enruta y crea/confirmar cita (Agenda) → RECIBIMIENTO.
3. Firma consentimiento base, marca exploración completada, crea/proponer plan.
4. Presenta y acepta presupuesto (requiere consentimiento específico) → TRATAMIENTO.
5. Marca control clínico, programa seguimiento y cierra el episodio (opcional recall a mantenimiento).

Cada fase emite los eventos correspondientes (`Lead.Created`, `Triage.Submitted`, `Appointment.Confirmed`, `Plan.Proposed`, `Quote.Accepted`, `FollowUp.Scheduled`, `Episode.Closed`, etc.).

## Verificación
Al terminar, el script imprime el estado final (`MANTENIMIENTO`). Si algún paso falla (por ejemplo, no se alcanza el estado esperado), el proceso termina con error y te indica qué transición no se cumplió.

Puedes consultar:
```bash
firebase firestore:documents events --project <ID>
```
para revisar la traza o usar el listener (`npm run events:listen`).

Adaptaciones: modifica `scripts/e2e-episode-flow.ts` si quieres probar variantes (diferente protocolo, saltar seguimiento, etc.).
