# Gestión Clínica

![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.4-FFCA28?logo=firebase)
![Tests](https://img.shields.io/badge/tests-576%20passing-brightgreen?logo=vitest)
![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4?logo=prettier)
![License](https://img.shields.io/badge/license-MIT-green)

## Tabla de Contenidos

- [Resumen](#resumen)
- [Inicio Rápido](#inicio-rápido)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Desarrollo](#desarrollo)
- [Testing](#testing)
- [Despliegue](#despliegue)
- [Documentación Adicional](#documentación-adicional)

## Inicio Rápido

```bash
# Clonar el repositorio
git clone [repository-url]
cd gestionclinica

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Requisitos Previos

- **Node.js**: v18.17 o superior
- **npm**: v9 o superior
- **Proyecto Firebase**: Con Authentication y Firestore activados
- **Cuenta de servicio Firebase**: Para Firebase Admin SDK

## Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar Firebase**:
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Activa Authentication (Email/Password)
   - Activa Firestore Database
   - Activa Storage (para uploads de archivos)
   - Descarga las credenciales de tu aplicación web
   - Descarga la cuenta de servicio (service account key)

3. **Configurar variables de entorno** (ver sección siguiente)

4. **Cargar datos iniciales** (opcional):
   ```bash
   npm run seed:servicios
   ```

5. **Asignar rol a usuario** (después del primer registro):
   ```bash
   node scripts/set-role.js <uid> admin <email>
   ```

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

### Firebase Client (NEXT_PUBLIC_*)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Firebase Admin (Server-side)

**Opción 1**: JSON completo en una línea
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**Opción 2**: Variables individuales
```bash
FIREBASE_ADMIN_PROJECT_ID=tu-proyecto-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Google Cloud (Storage)

```bash
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### Opcional

```bash
# Configuración de rate limiting
RATE_LIMIT_ENABLED=true

# URL base para deep links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> ⚠️ **Importante**: Nunca versiones archivos `.env.local`, `service-account.json` o `google-credentials.json`. Estos archivos deben estar listados en `.gitignore`.

## Estructura del Proyecto

```
gestionclinica/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas públicas (login, register)
│   ├── api/                      # API Routes
│   │   ├── agenda/              # Endpoints de agenda
│   │   ├── pacientes/           # Endpoints de pacientes
│   │   └── ...
│   ├── dashboard/               # Rutas protegidas
│   │   ├── pacientes/          # Módulo de pacientes
│   │   ├── agenda/             # Módulo de agenda
│   │   ├── proyectos/          # Módulo de proyectos
│   │   └── ...
│   └── layout.tsx              # Layout raíz
├── components/                  # Componentes React
│   ├── ui/                     # Componentes UI reutilizables
│   ├── agenda/                 # Componentes de agenda
│   ├── pacientes/              # Componentes de pacientes
│   └── ...
├── lib/                        # Utilidades y configuración
│   ├── auth/                   # Autenticación y roles
│   ├── server/                 # Funciones server-side
│   ├── utils/                  # Helpers generales
│   ├── validators/             # Schemas Zod
│   └── firebaseAdmin.ts        # Firebase Admin SDK
├── __tests__/                  # Tests
│   ├── integration/            # Tests de integración
│   └── *.test.ts              # Tests unitarios
├── docs/                       # Documentación
│   ├── API_DOCUMENTATION.md    # Documentación de APIs
│   ├── agenda.md              # Docs del módulo de agenda
│   ├── roles.md               # Sistema de roles
│   └── ...
├── scripts/                    # Scripts de utilidad
│   └── set-role.js            # Asignar roles a usuarios
└── public/                     # Archivos estáticos
```

## Desarrollo

### Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Los cambios se reflejan automáticamente con Fast Refresh.

### Verificación de Tipos

```bash
npm run typecheck
```

Ejecuta TypeScript en modo `--noEmit` para verificar tipos sin compilar.

### Linting

```bash
npm run lint          # Verificar problemas
npm run lint:fix      # Corregir automáticamente
```

### Formato de Código

```bash
npm run format        # Formatear con Prettier
npm run format:check  # Verificar formato sin modificar
```

### Convenciones de Código

- **TypeScript**: Usa tipos explícitos, evita `any`
- **Nombres de archivos**: kebab-case para archivos, PascalCase para componentes
- **Imports**: Usa alias `@/` para imports absolutos
- **Componentes**: Un componente por archivo (excepto componentes pequeños auxiliares)
- **Hooks**: Prefijo `use` para custom hooks
- **Server Components**: Por defecto en Next.js 15, marca con `"use client"` solo si es necesario

## Testing

### Ejecutar Tests

```bash
# Modo watch (desarrollo)
npm run test

# Ejecutar una vez
npm run test:run

# Con coverage
npm run test:coverage
```

### Estructura de Tests

- **Tests unitarios**: En `__tests__/*.test.ts` para funciones/helpers
- **Tests de integración**: En `__tests__/integration/*.test.ts` para APIs

### Coverage Actual

- **576 tests pasando**
- Cobertura de helpers críticos: 100%
- APIs documentadas con tests de integración: `/api/pacientes`, `/api/agenda/eventos`, `/api/agenda/disponibilidad`

### Escribir Tests

Ver [docs/TESTING.md](docs/TESTING.md) para guías detalladas sobre testing.

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

### Despliegue en Vercel (Recomendado)

1. **Conecta tu repositorio** en [Vercel](https://vercel.com/)

2. **Configura variables de entorno** en Vercel Dashboard:
   - Añade todas las variables de `.env.local`
   - Marca las variables sensibles como "Sensitive" para ofuscarlas

3. **Configura reglas de Firestore**:
   - Revisa `docs/firestore-security.md`
   - Actualiza las reglas en Firebase Console antes del primer deploy

4. **Deploy**:
   ```bash
   # Vercel se encarga automáticamente del build y deploy
   # O manualmente:
   vercel --prod
   ```

### Despliegue Manual (Firebase Hosting)

```bash
# Build de producción
npm run build

# Deploy a Firebase
firebase deploy
```

### Configuración Post-Despliegue

1. **Actualizar URL base**:
   ```bash
   NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
   ```

2. **Verificar autenticación**:
   - Añade tu dominio en Firebase Console → Authentication → Settings → Authorized domains

3. **Configurar CORS** si usas Storage:
   - Ver `docs/TROUBLESHOOTING.md` para configuración de CORS en Google Cloud Storage

## Documentación Adicional

- [API Documentation](docs/API_DOCUMENTATION.md) - Estándar JSDoc y documentación de APIs
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura detallada del proyecto
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guía para contribuir al proyecto
- [TESTING.md](docs/TESTING.md) - Guía completa de testing
- [LOGGING.md](docs/LOGGING.md) - Sistema de logging, métricas y observabilidad
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Solución a problemas comunes
- [agenda.md](docs/agenda.md) - Arquitectura del módulo de Agenda
- [roles.md](docs/roles.md) - Sistema de roles y permisos
- [firestore-security.md](docs/firestore-security.md) - Reglas de seguridad de Firestore

## Licencia

MIT © 2025

## Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.
