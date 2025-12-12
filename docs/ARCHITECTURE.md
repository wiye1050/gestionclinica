# Arquitectura del Sistema

Este documento describe la arquitectura general del sistema de Gestión Clínica.

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura de Aplicación](#arquitectura-de-aplicación)
- [Patrones de Diseño](#patrones-de-diseño)
- [Modelo de Datos](#modelo-de-datos)
- [Seguridad](#seguridad)
- [Performance y Optimización](#performance-y-optimización)

## Visión General

Gestión Clínica es una aplicación web full-stack para la coordinación de operaciones clínicas, construida con Next.js 15 usando el App Router y Firebase como backend.

### Principios de Arquitectura

1. **Server-First**: Maximizar Server Components para mejor performance
2. **Type Safety**: TypeScript estricto en toda la aplicación
3. **Progressive Enhancement**: La app funciona sin JavaScript (donde sea posible)
4. **Security by Default**: Autenticación y autorización en todas las rutas
5. **Real-time Updates**: Sincronización en tiempo real con Firestore
6. **Optimistic UI**: Actualizaciones optimistas con React Query

## Stack Tecnológico

### Frontend

- **Next.js 15.5.7**: Framework React con App Router
- **React 18.3**: Biblioteca UI con Server Components
- **TypeScript 5**: Type safety
- **Tailwind CSS v4**: Utility-first CSS
- **shadcn/ui**: Componentes UI base
- **React Query**: Estado del servidor y caché
- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de esquemas
- **date-fns**: Manipulación de fechas
- **Recharts**: Gráficos y visualizaciones
- **Lucide React**: Iconografía

### Backend

- **Firebase Authentication**: Autenticación de usuarios
- **Firestore**: Base de datos NoSQL en tiempo real
- **Firebase Storage**: Almacenamiento de archivos
- **Firebase Admin SDK**: Operaciones server-side
- **Next.js API Routes**: Endpoints REST

### Testing

- **Vitest**: Framework de testing
- **React Testing Library**: Testing de componentes
- **MSW**: Mock Service Worker para APIs

### Tooling

- **ESLint**: Linting de código
- **Prettier**: Formateo de código
- **TypeScript**: Compilador y type checking
- **Turbopack**: Bundler rápido para desarrollo

## Arquitectura de Aplicación

### Estructura de Capas

```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│    (React Components + Client State)    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Server Components Layer         │
│     (Data Fetching + Server Logic)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           API Routes Layer              │
│    (RESTful Endpoints + Validation)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  (lib/server/* + Validation + Rules)    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Data Access Layer             │
│   (Firebase Admin SDK + Firestore)      │
└─────────────────────────────────────────┘
```

### Flujo de Datos

#### Server Components (Lectura)

```
Page/Layout (RSC)
    ↓
Server Function (lib/server/*)
    ↓
Firebase Admin SDK
    ↓
Firestore Database
    ↓
Serialized Data → Client
```

#### Client Components (Mutación)

```
User Action
    ↓
React Query Mutation
    ↓
API Route (/app/api/*)
    ↓
Validation (Zod)
    ↓
Business Logic (lib/server/*)
    ↓
Firebase Admin SDK
    ↓
Firestore Database
    ↓
Response → Client
    ↓
Cache Invalidation
```

## Patrones de Diseño

### 1. Server Components First

Por defecto, todos los componentes son Server Components a menos que se necesite interactividad.

```typescript
// Server Component (por defecto)
export default async function PacientesPage() {
  const pacientes = await getPacientes();
  return <PacientesList pacientes={pacientes} />;
}

// Client Component (solo cuando es necesario)
"use client"
export function PacientesFilters() {
  const [filters, setFilters] = useState({});
  // ...
}
```

### 2. React Query para Mutaciones

Todas las mutaciones usan React Query para manejo de estado y caché.

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch('/api/pacientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes'] });
  },
});
```

### 3. Validación con Zod

Schemas Zod para validación en cliente y servidor.

```typescript
// lib/validators.ts
export const createPacienteSchema = z.object({
  nombre: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  // ...
});

// API Route
const validation = await validateRequest(request, createPacienteSchema);
if (!validation.success) {
  return validation.error;
}
```

### 4. Repository Pattern

Funciones server-side encapsulan lógica de acceso a datos.

```typescript
// lib/server/pacientesAdmin.ts
export async function createPaciente(data: PacienteInput) {
  // Validación
  // Generación de ID
  // Escritura en Firestore
  // Retorno de resultado
}
```

### 5. Role-Based Access Control (RBAC)

Sistema de roles jerárquico con verificación en API Routes.

```typescript
// lib/auth/apiRoles.ts
export const API_ROLES = {
  READ: ['admin', 'coordinador', 'profesional', 'recepcion'],
  WRITE: ['admin', 'coordinador', 'profesional'],
  ADMIN: ['admin'],
};

// En API Route
if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
  return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
}
```

### 6. Error Boundaries

Manejo de errores con Error Boundaries en layouts críticos.

```typescript
// components/ui/ErrorBoundary.tsx
export function ModuleErrorBoundary({ children, moduleName }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback moduleName={moduleName} />}>
      {children}
    </ErrorBoundary>
  );
}

// app/dashboard/pacientes/layout.tsx
export default function PacientesLayout({ children }) {
  return (
    <ModuleErrorBoundary moduleName="Pacientes">
      {children}
    </ModuleErrorBoundary>
  );
}
```

### 7. Caching Strategy

Caché en múltiples niveles para optimizar performance.

```typescript
// lib/server/cache.ts
export const cache = {
  kpis: unstable_cache(
    async () => getServerKPIs(),
    ['dashboard-kpis'],
    { revalidate: 300 } // 5 minutos
  ),
};
```

## Modelo de Datos

### Colecciones Principales de Firestore

#### `pacientes`

```typescript
{
  id: string;
  numeroHistoria: string; // Autogenerado: NH-YYYY-0001
  nombre: string;
  apellidos: string;
  documentoId?: string;
  fechaNacimiento: Timestamp;
  genero: 'masculino' | 'femenino' | 'otro';
  telefono?: string;
  email?: string;
  direccion?: string;
  estado: 'activo' | 'inactivo' | 'egresado';
  riesgo?: 'alto' | 'medio' | 'bajo';
  profesionalReferenteId?: string;
  grupoPacienteId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

#### `agenda-eventos`

```typescript
{
  id: string;
  titulo: string;
  tipo: 'consulta' | 'seguimiento' | 'revision' | 'tratamiento' | 'urgencia' | 'administrativo';
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  profesionalId: string;
  pacienteId?: string;
  salaId?: string;
  servicioId?: string;
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  prioridad: 'alta' | 'media' | 'baja';
  notas?: string;
  requiereSeguimiento: boolean;
  creadoPorId: string;
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `users`

```typescript
{
  uid: string; // Mismo que Firebase Auth
  email: string;
  displayName?: string;
  roles: AppRole[]; // ['admin', 'coordinador', 'profesional', 'recepcion', 'invitado', 'paciente']
  profesionalId?: string; // Referencia a profesionales collection
  pacienteId?: string; // Referencia a pacientes collection
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `pacientes-historial`

```typescript
{
  id: string;
  pacienteId: string;
  tipo: 'cita' | 'nota' | 'documento' | 'tratamiento' | 'diagnostico';
  titulo: string;
  descripcion?: string;
  fecha: Timestamp;
  profesionalId?: string;
  servicioId?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  createdBy: string;
}
```

### Relaciones entre Entidades

```
users (1) ←→ (1) pacientes
users (1) ←→ (1) profesionales

profesionales (1) ←→ (N) pacientes (profesionalReferenteId)
profesionales (1) ←→ (N) agenda-eventos (profesionalId)

pacientes (1) ←→ (N) agenda-eventos (pacienteId)
pacientes (1) ←→ (N) pacientes-historial (pacienteId)

servicios (1) ←→ (N) servicios-asignados (servicioId)
servicios (1) ←→ (N) agenda-eventos (servicioId)
```

## Seguridad

### Autenticación

- **Firebase Authentication**: Email/Password
- **Session Management**: Firebase ID Tokens
- **Token Refresh**: Automático via Firebase SDK

### Autorización

#### Roles del Sistema

1. **admin**: Acceso total
2. **coordinador**: Gestión de pacientes, agenda, reportes
3. **profesional**: Ver pacientes asignados, crear eventos
4. **recepcion**: Ver pacientes, crear eventos básicos
5. **invitado**: Solo lectura limitada
6. **paciente**: Ver solo su propia información

#### Verificación en API Routes

```typescript
// 1. Autenticación
const user = await getCurrentUser();
if (!user) {
  return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
}

// 2. Autorización
if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
}

// 3. Row-level security (si aplica)
if (user.roles.includes('profesional') && data.profesionalId !== user.profesionalId) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
}
```

### Rate Limiting

Limitación de solicitudes por IP para prevenir abuso.

```typescript
// lib/middleware/rateLimit.ts
export const RATE_LIMIT_STRICT = {
  maxRequests: 10,
  windowMs: 60000, // 1 minuto
};

export const RATE_LIMIT_MODERATE = {
  maxRequests: 100,
  windowMs: 60000,
};

// En API Route
const limiter = rateLimit(RATE_LIMIT_STRICT);
const rateLimitResult = await limiter(request);
if (rateLimitResult) return rateLimitResult;
```

### Firestore Security Rules

Ver `docs/firestore-security.md` para reglas detalladas.

## Performance y Optimización

### 1. Server-Side Rendering (SSR)

Páginas importantes se renderizan en el servidor para mejor SEO y performance inicial.

```typescript
// app/dashboard/pacientes/page.tsx
export default async function PacientesPage() {
  // Datos precargados en el servidor
  const pacientes = await getPacientes({ limit: 50 });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PacientesList initialData={pacientes} />
    </HydrationBoundary>
  );
}
```

### 2. Caching

- **React Cache**: Para funciones server-side
- **Next.js Cache**: Para páginas y datos
- **React Query Cache**: Para datos del cliente

```typescript
// lib/server/cache.ts
export const getServerKPIs = unstable_cache(
  async () => {
    // Consultas pesadas
  },
  ['dashboard-kpis'],
  { revalidate: 300 }
);
```

### 3. Paginación Cursor-Based

Para listas largas, usamos cursor-based pagination.

```typescript
// API: /api/pacientes?limit=50&cursor=pac-123
const snapshot = await query
  .orderBy('apellidos')
  .startAfter(cursorDoc)
  .limit(limit + 1)
  .get();
```

### 4. Lazy Loading

Componentes pesados se cargan bajo demanda.

```typescript
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
```

### 5. Optimistic Updates

Actualizaciones optimistas con React Query para UX instantánea.

```typescript
const mutation = useMutation({
  mutationFn: updatePaciente,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['paciente', id] });
    const previous = queryClient.getQueryData(['paciente', id]);
    queryClient.setQueryData(['paciente', id], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['paciente', id], context.previous);
  },
});
```

### 6. Image Optimization

Next.js Image component para optimización automática.

```typescript
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="Avatar"
  width={40}
  height={40}
  className="rounded-full"
/>
```

## Referencias

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)
