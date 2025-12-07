# Gestión Clínica

![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.4-FFCA28?logo=firebase)
![Tests](https://img.shields.io/badge/tests-358%20passing-brightgreen?logo=vitest)
![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4?logo=prettier)
![License](https://img.shields.io/badge/license-MIT-green)

## Resumen

Aplicación operativa para coordinación de una clínica, desarrollada con **Next.js 15 + TypeScript + Firebase**.

### Módulos principales

- **Autenticación** (email/password) y layout protegido (`app/dashboard`).
- **Pacientes**: listado filtrable, alta con validaciones (`react-hook-form` + `zod`) y ficha clínica con alertas, historial y consentimientos (`app/dashboard/pacientes`). Los filtros de seguimiento y profesional se recuerdan en `localStorage` para cada usuario.
  - Desde la pestaña Historial se puede exportar el timeline filtrado a Excel o PDF y generar un correo con enlace seguro.
  - La primera página se precarga desde `/api/pacientes` en SSR para hidratar React Query sin esperas.
- **Dashboard**: la portada se hidrata con KPIs generados en servidor (`getServerKPIs`) y sólo mantiene en cliente los widgets interactivos.
- **Reportes diarios**: compact filters + `KPIGrid` estandarizados, datos cacheados (`getSerializedDailyReports`) y mutaciones con React Query que invalidan las tags `reports*`.
- **Agenda / Supervisión / Proyectos**: comparten los filtros compactos y KPIs uniformes para mantener UX consistente y exponer los mismos chips/acciones en todos los módulos.
- **Agenda clínica**: vista semanal con disponibilidad por profesional/sala, creación de eventos vinculados a pacientes y acciones rápidas (confirmar, realizar, cancelar). Sincroniza con `pacientes-historial`.
- **Servicios y tratamientos**: catálogos, asignaciones y estadísticas existentes. Cada servicio puede declarar protocolos obligatorios; en la ficha del paciente se listan automáticamente los protocolos requeridos por los servicios de su grupo para verificar lecturas pendientes.
- **KPIs**: panel actualizado con métricas de agenda (citas programadas, confirmadas, canceladas) y operaciones.
- **Calidad e informes**: reportes diarios, supervisión y generación de PDF mensual (datos cacheados 15 min para evitar recalcular informes cada solicitud).
- **Auditoría**: vista dedicada que toma los últimos eventos de `auditLogs`, con métricas rápidas, filtros por módulo y búsqueda libre para rastrear acciones recientes.

### Scripts útiles

**Desarrollo:**
- `npm run dev` – desarrollo con Turbopack
- `npm run build` / `npm run start` – compilación y servidor de producción

**Calidad de código:**
- `npm run typecheck` – verificación estricta de tipos
- `npm run lint` – linting con ESLint
- `npm run format` – formatear código con Prettier
- `npm run format:check` – verificar formato sin modificar

**Testing:**
- `npm run test` – tests en modo watch
- `npm run test:run` – ejecutar todos los tests
- `npm run test:coverage` – coverage report

**Datos:**
- `npm run seed:servicios` – carga de datos iniciales en Firestore (servicios, profesionales, etc.)
- `node scripts/set-role.js <uid> <rol> [email]` – asigna rol en claims y en `users/{uid}`. Ver `docs/roles.md`

**Documentación:**
- `docs/agenda.md` – arquitectura, vistas y deep links del módulo de Agenda

### Integraciones Firebase

- Firestore: colecciones `pacientes`, `pacientes-historial`, `agenda-eventos`, `agenda-bloques`, `servicios-asignados`, etc.
- Autenticación: `firebase/auth` y hook `useAuth`.
- Reglas recomendadas en `docs/firestore-security.md` (roles `coordinacion`, `direccion`, `profesional`).
- Limpieza recomendada: eliminar periódicamente los PDFs compartidos (`patient-history/`) cuya metadata `expiresAt` haya pasado y actualizar el historial asociado.
  - Puedes apoyarte en `scripts/purge-expired-history.ts` como punto de partida para automatizarlo (Cloud Function o cron).
- **Credenciales**: las claves de servicio ya no se versionan. Configura las variables de entorno `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON en una sola línea) o el trío `FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY`, además de `GOOGLE_CLOUD_CREDENTIALS` para el bucket de Storage. Los antiguos archivos `service-account.json` y `google-credentials.json` deben permanecer fuera del repositorio y estar listados en `.gitignore`.
- **Capa de datos**: usa `lib/server/cache.ts` para cachear snapshots agregados (por ejemplo `getServerKPIs` e `inventario`). Define claves claras y un `revalidate` apropiado para evitar lecturas redundantes de Firestore Admin.

### Boostrappers & UI

- `lucide-react`, `tailwindcss` (v4), `react-hook-form`, `zod`, `sonner` (toasts), `recharts`.
- Componentes compartidos: `CompactFilters` (filtros consistentes) y `KPIGrid` (KPIs uniformes) para reutilizar UI en cada módulo.

> Consulta `docs/firestore-security.md` antes de desplegar para adaptar las reglas a tu proyecto.

## Despliegue

El despliegue recomendado es vía [Vercel](https://vercel.com/). Asegúrate de configurar las variables `NEXT_PUBLIC_FIREBASE_*` y reglas de Firestore antes de publicar.
