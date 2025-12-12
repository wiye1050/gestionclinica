# Guía de Logging y Observabilidad

Esta guía describe el sistema de logging, métricas y observabilidad del proyecto.

## Tabla de Contenidos

- [Logger Estructurado](#logger-estructurado)
- [Sistema de Métricas](#sistema-de-métricas)
- [Request Tracing](#request-tracing)
- [Mejores Prácticas](#mejores-prácticas)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Monitoring en Producción](#monitoring-en-producción)

## Logger Estructurado

### Ubicación

`lib/utils/logger.ts`

### Features

- **Niveles de log**: debug, info, warn, error
- **Contexto estructurado**: Añade metadatos a logs
- **Request correlation IDs**: Tracking automático de requests
- **Integración con métricas**: Cuenta logs por nivel y módulo
- **Environment-aware**: Solo warn/error en producción

### Niveles de Log

#### Debug

Solo en desarrollo. Para información detallada de debugging.

```typescript
import { logger } from '@/lib/utils/logger';

logger.debug('Usuario cargado', {
  module: 'auth',
  userId: user.id,
  email: user.email,
});
```

#### Info

Solo en desarrollo. Para información general del flujo.

```typescript
logger.info('Paciente creado exitosamente', {
  module: 'pacientes',
  action: 'create',
  pacienteId: result.id,
});
```

#### Warn

Desarrollo y producción. Para situaciones inesperadas no críticas.

```typescript
logger.warn('Filtro no válido detectado', {
  module: 'pacientes',
  filter: invalidFilter,
});

// Con Error object
logger.warn('Timeout en query', new Error('Query timeout'));
```

#### Error

Desarrollo y producción. Para errores que requieren atención.

```typescript
logger.error('Error al crear paciente', error, {
  module: 'api-pacientes',
  action: 'POST',
  userId: user.uid,
});
```

### Contexto Estructurado

Siempre añade contexto para facilitar debugging:

```typescript
interface LogContext {
  module?: string; // Módulo/componente ('auth', 'pacientes', 'agenda')
  action?: string; // Acción específica ('create', 'update', 'delete')
  userId?: string; // ID del usuario (se añade automáticamente si está en request context)
  requestId?: string; // ID del request (se añade automáticamente)
  durationMs?: number; // Duración de operación
  [key: string]: unknown; // Cualquier otro campo relevante
}
```

**Ejemplo completo**:

```typescript
logger.error('Failed to fetch pacientes', error, {
  module: 'pacientes-list',
  action: 'fetch',
  filters: { estado: 'activo' },
  limit: 50,
});
```

### Timers

Para medir duración de operaciones:

```typescript
const stopTimer = logger.startTimer('Fetching pacientes', {
  module: 'api-pacientes',
  action: 'GET',
});

try {
  const pacientes = await getPacientes();
  stopTimer(); // Logs: "Fetching pacientes | durationMs=145"
  return pacientes;
} catch (error) {
  stopTimer(); // También se debe llamar en errores
  throw error;
}
```

## Sistema de Métricas

### Ubicación

`lib/utils/metrics.ts`

### Tipos de Métricas

#### Counter

Cuenta eventos que incrementan (nunca decrecen):

```typescript
import { metrics } from '@/lib/utils/metrics';

// Incrementar contador
metrics.increment('api.pacientes.created', 1, {
  module: 'pacientes',
  status: 'success',
});

// Contar errores
metrics.increment('api.errors', 1, {
  endpoint: '/api/pacientes',
  status: '500',
});
```

#### Gauge

Registra valores que suben y bajan:

```typescript
// Tamaño de cola
metrics.gauge('queue.size', queueSize);

// Usuarios activos
metrics.gauge('users.active', activeUserCount);

// Memoria usada
metrics.gauge('memory.usage', process.memoryUsage().heapUsed);
```

#### Histogram

Registra distribuciones de valores:

```typescript
// Tamaño de responses
metrics.histogram('response.size', responseBytes, {
  endpoint: '/api/pacientes',
});

// Número de resultados
metrics.histogram('query.results', resultCount, {
  collection: 'pacientes',
});
```

#### Timing

Mide duración de operaciones:

```typescript
// Opción 1: Timer manual
const stopTimer = metrics.startTimer('api.request', {
  method: 'GET',
  path: '/api/pacientes',
});

try {
  const data = await fetchData();
  stopTimer();
  return data;
} catch (error) {
  stopTimer();
  throw error;
}

// Opción 2: Wrapper async
const result = await metrics.measure(
  'firestore.query',
  async () => {
    return await db.collection('pacientes').get();
  },
  { collection: 'pacientes' }
);

// Opción 3: Helper
import { withTiming } from '@/lib/utils/metrics';

const data = await withTiming('expensive-operation', async () => {
  return await expensiveOperation();
});
```

### Helpers de Métricas

#### API Requests

```typescript
import { measureApiRequest } from '@/lib/utils/metrics';

// En API Route
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const data = await getData();
    const duration = Date.now() - startTime;

    measureApiRequest('GET', '/api/pacientes', 200, duration);

    return NextResponse.json(data);
  } catch (error) {
    const duration = Date.now() - startTime;
    measureApiRequest('GET', '/api/pacientes', 500, duration);
    throw error;
  }
}
```

#### Firestore Queries

```typescript
import { measureFirestoreQuery } from '@/lib/utils/metrics';

const startTime = Date.now();
const snapshot = await db.collection('pacientes').limit(100).get();
const duration = Date.now() - startTime;

measureFirestoreQuery('pacientes', 'get', duration, snapshot.size);
```

### Estadísticas

Obtener estadísticas agregadas:

```typescript
// Stats de una métrica específica
const stats = metrics.getStats('api.request.duration');
console.log(stats);
// {
//   count: 1250,
//   sum: 125000,
//   avg: 100,
//   min: 12,
//   max: 1543,
//   p50: 85,
//   p95: 250,
//   p99: 450
// }

// Exportar todas las métricas
const metricsJson = metrics.export();
```

## Request Tracing

### Ubicación

`lib/utils/requestContext.ts`

### Correlation IDs

Cada request tiene un ID único para tracking:

```typescript
import { getRequestId, getRequestInfo } from '@/lib/utils/requestContext';

// En API Route
export async function GET(request: NextRequest) {
  const requestId = getRequestId(); // "req_A1b2C3d4E5f6G7h8"

  logger.info('Processing request', {
    requestId, // Se añade automáticamente si usas logger
    module: 'api-pacientes',
  });

  // ...
}
```

### Request Context

Propagar contexto entre funciones:

```typescript
import { withRequestContext } from '@/lib/utils/requestContext';

// Wrapper que crea contexto
export async function GET(request: NextRequest) {
  return withRequestContext(
    {
      method: 'GET',
      path: '/api/pacientes',
      userId: user.uid,
      userEmail: user.email,
    },
    async () => {
      // Todo el código aquí tiene acceso al contexto
      await processRequest();
    }
  );
}
```

### Headers de Response

Añadir Request ID a responses para debugging:

```typescript
import { addRequestIdToHeaders, getRequestId } from '@/lib/utils/requestContext';

const headers = new Headers();
addRequestIdToHeaders(headers);

return NextResponse.json(data, { headers });
// Response tiene header: x-request-id: req_A1b2C3d4E5f6G7h8
```

## Mejores Prácticas

### 1. Logging en API Routes

```typescript
/**
 * Patrón estándar para API Routes
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = getRequestId();

  try {
    // 1. Log inicio
    logger.info('Request started', {
      module: 'api-pacientes',
      action: 'POST',
      requestId,
    });

    // 2. Autenticación
    const user = await getCurrentUser();
    if (!user) {
      logger.warn('Unauthenticated request', {
        module: 'api-pacientes',
        requestId,
      });
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 3. Validación
    const validation = await validateRequest(request, schema);
    if (!validation.success) {
      logger.warn('Invalid request data', {
        module: 'api-pacientes',
        errors: validation.error,
        requestId,
      });
      return validation.error;
    }

    // 4. Operación principal
    const result = await metrics.measure(
      'create-paciente',
      async () => createPaciente(validation.data),
      { userId: user.uid }
    );

    // 5. Log éxito
    logger.info('Paciente created successfully', {
      module: 'api-pacientes',
      action: 'POST',
      pacienteId: result.id,
      userId: user.uid,
      requestId,
    });

    // 6. Métricas
    const duration = Date.now() - startTime;
    measureApiRequest('POST', '/api/pacientes', 201, duration);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // 7. Log error
    logger.error('Failed to create paciente', error, {
      module: 'api-pacientes',
      action: 'POST',
      requestId,
    });

    // 8. Métricas de error
    const duration = Date.now() - startTime;
    measureApiRequest('POST', '/api/pacientes', 500, duration);
    metrics.increment('api.pacientes.errors', 1);

    return NextResponse.json(
      { error: 'Error al crear paciente' },
      { status: 500 }
    );
  }
}
```

### 2. Logging en Server Functions

```typescript
export async function getPacientes(filters: Filters) {
  const stopTimer = logger.startTimer('Fetching pacientes', {
    module: 'server-pacientes',
    action: 'fetch',
  });

  try {
    const startTime = Date.now();

    const snapshot = await adminDb
      .collection('pacientes')
      .where('estado', '==', filters.estado)
      .limit(filters.limit)
      .get();

    const duration = Date.now() - startTime;
    measureFirestoreQuery('pacientes', 'get', duration, snapshot.size);

    logger.info('Pacientes fetched', {
      module: 'server-pacientes',
      count: snapshot.size,
      filters,
    });

    stopTimer();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logger.error('Failed to fetch pacientes', error, {
      module: 'server-pacientes',
      filters,
    });
    stopTimer();
    throw error;
  }
}
```

### 3. Logging en Client Components

```typescript
'use client';

import { logger } from '@/lib/utils/logger';

export function PacientesList() {
  const mutation = useMutation({
    mutationFn: async (data) => {
      logger.info('Creating paciente', {
        module: 'pacientes-list-client',
      });

      const response = await fetch('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        logger.error('Failed to create paciente', undefined, {
          module: 'pacientes-list-client',
          status: response.status,
        });
        throw new Error('Failed to create');
      }

      logger.info('Paciente created', {
        module: 'pacientes-list-client',
      });

      return response.json();
    },
  });

  // ...
}
```

### 4. Evitar Logs Excesivos

```typescript
// ❌ Malo: Log en cada iteración
users.forEach((user) => {
  logger.debug('Processing user', { userId: user.id });
  processUser(user);
});

// ✅ Bueno: Log resumen
logger.debug('Processing users', { count: users.length });
const results = users.map((user) => processUser(user));
logger.info('Users processed', { count: results.length });
```

### 5. Logs con Información Sensible

```typescript
// ❌ Malo: Loguear información sensible
logger.info('User logged in', {
  password: user.password, // ¡NO!
  creditCard: user.creditCard, // ¡NO!
});

// ✅ Bueno: Solo información necesaria
logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  loginMethod: 'password',
});
```

### 6. Métricas para Alerting

```typescript
// Incrementar métricas que serían útiles para alertas
if (failureRate > 0.1) {
  metrics.increment('high.failure.rate', 1, {
    module: 'pacientes',
    rate: String(failureRate),
  });

  logger.warn('High failure rate detected', {
    module: 'pacientes',
    failureRate,
  });
}
```

## Ejemplos de Uso

### Ejemplo Completo: API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { metrics, measureApiRequest } from '@/lib/utils/metrics';
import { getRequestId } from '@/lib/utils/requestContext';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = getRequestId();

  logger.info('GET /api/pacientes started', {
    module: 'api-pacientes',
    requestId,
  });

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const limit = Number(searchParams.get('limit')) || 50;

    const stopTimer = metrics.startTimer('db.query', {
      collection: 'pacientes',
    });

    const snapshot = await adminDb
      .collection('pacientes')
      .where('estado', '==', estado)
      .limit(limit)
      .get();

    stopTimer();

    const pacientes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.info('Pacientes fetched successfully', {
      module: 'api-pacientes',
      count: pacientes.length,
      estado,
      requestId,
    });

    const duration = Date.now() - startTime;
    measureApiRequest('GET', '/api/pacientes', 200, duration);
    metrics.histogram('pacientes.count', pacientes.length);

    return NextResponse.json({ items: pacientes });
  } catch (error) {
    logger.error('Failed to fetch pacientes', error, {
      module: 'api-pacientes',
      requestId,
    });

    const duration = Date.now() - startTime;
    measureApiRequest('GET', '/api/pacientes', 500, duration);
    metrics.increment('api.pacientes.errors', 1);

    return NextResponse.json(
      { error: 'Error al obtener pacientes' },
      { status: 500 }
    );
  }
}
```

## Monitoring en Producción

### Visualizar Logs

En desarrollo, los logs aparecen en consola. En producción:

1. **Vercel Logs**: Ver logs en Vercel Dashboard
2. **CloudWatch**: Si usas AWS
3. **Datadog/New Relic**: Servicios de APM

### Exportar Métricas

```typescript
// Endpoint para exportar métricas (solo para admin)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!hasRole(user.roles, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const metricsData = metrics.export();

  return new NextResponse(metricsData, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="metrics.json"',
    },
  });
}
```

### Alerting

Configurar alertas basadas en métricas:

- **Error rate alto**: `api.request.errors > 100/min`
- **Latencia alta**: `api.request.duration.p95 > 2000ms`
- **Logs de error**: `log.error > 50/min`

## Debugging

### Ver Logs Almacenados (Cliente)

En desarrollo, los errores se guardan en localStorage:

```typescript
import { getStoredLogs } from '@/lib/utils/errorLogging';

// En DevTools Console
console.table(getStoredLogs());
```

### Ver Métricas en Runtime

```typescript
import { metrics } from '@/lib/utils/metrics';

// En DevTools Console o debug endpoint
console.log(metrics.getStats('api.request.duration'));
console.log(metrics.export());
```

## Referencias

- [Structured Logging Best Practices](https://stackify.com/what-is-structured-logging-and-why-developers-need-it/)
- [Observability Engineering](https://www.honeycomb.io/what-is-observability)
- [OpenTelemetry](https://opentelemetry.io/)
