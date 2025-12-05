# Módulo de Agenda

Guía rápida para entender la arquitectura de la agenda y cómo integrarla con otros módulos.

## Arquitectura
- **SSR inicial**: `app/dashboard/agenda/page.tsx` exige sesión, calcula el inicio de semana y precarga eventos vía `getSerializedAgendaEvents` (Firestore Admin). Envuelve el cliente en `ModuleErrorBoundary`.
- **Cliente orquestador**: `app/dashboard/agenda/AgendaClient.tsx` maneja vistas (diaria, semanal, multi), filtros, modales y drawer.
  - Datos vía React Query: `useEventosAgenda`, `useProfesionalesManager`, `useSalas`, `usePacientes`, `useCatalogoServicios`.
  - Hooks de estado: `useAgendaFilters` (filtros/vista persistidos), `useAgendaModals` (modal/drawer, prefill), `useAgendaActions` (CRUD contra `/api/agenda/eventos` con toasts y deshacer).
- **UI principal (components/agenda/v2)**:
  - Vistas: `AgendaDayView`, `AgendaWeekViewV2`, `AgendaResourceView`.
  - Interacción: `EventModal` (crear/editar), `AgendaEventDrawer` (detalle/acciones), `AgendaTopBar`, `AgendaSidebar`, `AgendaSearch`, `MiniCalendar`.
  - KPIs/estado: `AgendaKPIs`, `AgendaMetrics`, `EmptyState`.
  - Utilidades: `agendaHelpers.ts`, `agendaConstants.ts`.
- **Servidor de datos**:
  - Lectura inicial: `lib/server/agenda.ts` (rango semanal, serializa ISO).
  - Mutaciones CRUD: `lib/server/agendaEvents.ts` (usa Firestore Admin, audit logs).
  - Server Actions: `app/dashboard/agenda/actions.ts` (create/update/delete con zod + revalidate).
- **API REST** (`app/api/agenda/*`):
  - `/agenda/eventos` POST (crear), `/agenda/eventos/[id]` PATCH/DELETE (actualizar/borrar), `/agenda/disponibilidad` GET (slots libres).
  - Validación de roles con `API_ROLES`; rate limiting estricto aplicado.

## Vistas disponibles
- `diaria`: detalle por horas (modo single o multi recurso).
- `semanal`: vista cronológica de la semana.
- `multi`: columnas por profesional (grid de recursos).

## Deep links y prefill
Puedes abrir la agenda con parámetros:
- `?newEvent=1` abre el modal de nueva cita.
- `?pacienteId=<id>&pacienteNombre=<nombre>` prefilla el paciente.
- `?profesionalId=<id>` o `?profesionales=id1,id2` filtra profesionales.
- `?view=diaria|semanal|multi` fuerza la vista.
- `?date=YYYY-MM-DD` posiciona la fecha actual.

## Patrones recomendados
- Reutiliza `CompactFilters`/`KPIGrid` para mantener filtros y KPIs consistentes.
- Los endpoints deben validar con zod y roles (READ/WRITE) y responder mensajes claros; maneja rate limit 429 en cliente.
- Los estados de error/vacío deben mostrar mensajes accionables y un botón de “limpiar filtros”.
- Mantén el mapa de colores de estado (programada/confirmada/realizada/cancelada) consistente en cards, timeline y calendario.

## Integración con otros módulos
- Desde pacientes/profesionales se puede abrir la agenda con deep link `?newEvent=1&pacienteId=...&profesionalId=...`.
- KPIs/alertas de agenda pueden exponerse como hooks reutilizables para Dashboard/Supervisión (usar tags de revalidate e invalidaciones de React Query).

## Mantenimiento
- Si añades nuevas vistas/controles, actualiza `VistaAgenda` en `agendaConstants` y `AgendaTopBar`.
- Limita la carga de eventos a rangos concretos y navega semana a semana para evitar lecturas grandes.
- Revisa índices de Firestore si cambias ordenaciones/consultas. 
