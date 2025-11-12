## Gestión Clínica – Resumen

Aplicación operativa para coordinación de una clínica, desarrollada con **Next.js 15 + TypeScript + Firebase**.

### Módulos principales

- **Autenticación** (email/password) y layout protegido (`app/dashboard`).
- **Pacientes**: listado filtrable, alta con validaciones (`react-hook-form` + `zod`) y ficha clínica con alertas, historial y consentimientos (`app/dashboard/pacientes`). Los filtros de seguimiento y profesional se recuerdan en `localStorage` para cada usuario.
  - Desde la pestaña Historial se puede exportar el timeline filtrado a Excel o PDF y generar un correo con enlace seguro.
- **Agenda clínica**: vista semanal con disponibilidad por profesional/sala, creación de eventos vinculados a pacientes y acciones rápidas (confirmar, realizar, cancelar). Sincroniza con `pacientes-historial`.
- **Servicios y tratamientos**: catálogos, asignaciones y estadísticas existentes. Cada servicio puede declarar protocolos obligatorios; en la ficha del paciente se listan automáticamente los protocolos requeridos por los servicios de su grupo para verificar lecturas pendientes.
- **KPIs**: panel actualizado con métricas de agenda (citas programadas, confirmadas, canceladas) y operaciones.
- **Calidad e informes**: reportes diarios, supervisión y generación de PDF mensual.
- **Auditoría**: vista dedicada que toma los últimos eventos de `auditLogs`, con métricas rápidas, filtros por módulo y búsqueda libre para rastrear acciones recientes.
- **Episodios clínicos**: flujo completo desde captación hasta mantenimiento, respaldado por endpoints y event bus (`docs/architecture/EPISODIOS.md` describe estados, triggers y consumos recomendados). Para automatizaciones/alertas consulta `docs/architecture/EVENT_AUTOMATIONS.md`.

### Scripts útiles

- `npm run dev` – desarrollo con Turbopack.
- `npm run build` / `npm run start` – compilación y servidor de producción.
- `npm run typecheck` – verificación estricta de tipos.
- `npm run lint` – linting.
- `npm run seed:servicios` – carga de datos iniciales en Firestore (servicios, profesionales, etc.).

### Integraciones Firebase

- Firestore: colecciones `pacientes`, `pacientes-historial`, `agenda-eventos`, `agenda-bloques`, `servicios-asignados`, etc.
- Autenticación: `firebase/auth` y hook `useAuth`.
- Reglas recomendadas en `docs/firestore-security.md` (roles `coordinacion`, `direccion`, `profesional`).
- Limpieza recomendada: eliminar periódicamente los PDFs compartidos (`patient-history/`) cuya metadata `expiresAt` haya pasado y actualizar el historial asociado.
  - Puedes apoyarte en `scripts/purge-expired-history.ts` como punto de partida para automatizarlo (Cloud Function o cron).

### Boostrappers & UI

- `lucide-react`, `tailwindcss` (v4), `react-hook-form`, `zod`, `sonner` (toasts), `recharts`.

> Consulta `docs/firestore-security.md` antes de desplegar para adaptar las reglas a tu proyecto.

## Despliegue

El despliegue recomendado es vía [Vercel](https://vercel.com/). Asegúrate de configurar las variables `NEXT_PUBLIC_FIREBASE_*` y reglas de Firestore antes de publicar.
