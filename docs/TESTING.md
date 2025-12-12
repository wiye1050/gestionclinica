# Guía de Testing

Esta guía cubre el enfoque y mejores prácticas de testing en el proyecto.

## Tabla de Contenidos

- [Filosofía de Testing](#filosofía-de-testing)
- [Setup y Configuración](#setup-y-configuración)
- [Tests Unitarios](#tests-unitarios)
- [Tests de Integración](#tests-de-integración)
- [Mocking](#mocking)
- [Coverage](#coverage)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

## Filosofía de Testing

### Principios

1. **Tests valiosos**: Testa comportamiento, no implementación
2. **Tests mantenibles**: Fáciles de entender y actualizar
3. **Tests rápidos**: Los tests deben ejecutarse rápidamente
4. **Tests confiables**: Sin falsos positivos/negativos
5. **Tests legibles**: Los tests son documentación

### Pirámide de Testing

```
         /\
        /  \     E2E Tests (pocos)
       /____\
      /      \   Integration Tests (algunos)
     /________\
    /          \ Unit Tests (muchos)
   /____________\
```

Enfocamos el esfuerzo en tests unitarios (rápidos, aislados) y algunos tests de integración (APIs, flujos críticos).

## Setup y Configuración

### Framework: Vitest

Usamos [Vitest](https://vitest.dev/) por su:
- Velocidad (Vite bajo el capó)
- Compatibilidad con Jest API
- TypeScript first-class support
- Watch mode inteligente

### Configuración

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@/': path.resolve(__dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/*.config.*',
        '**/dist/**',
        '**/*.d.ts',
      ],
    },
  },
});
```

`vitest.setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

## Tests Unitarios

### Estructura

```
__tests__/
├── agendaHelpers.test.ts      # Tests de helpers de agenda
├── helpers.test.ts            # Tests de helpers generales
├── dateFormatters.test.ts     # Tests de formateo de fechas
├── extendedHelpers.test.ts    # Tests de helpers extendidos
└── ...
```

### Patrón: Arrange, Act, Assert (AAA)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateAge } from '@/lib/utils/helpers';

describe('calculateAge', () => {
  it('calcula edad correctamente', () => {
    // Arrange (preparar)
    const birthDate = new Date('1990-01-01');
    const today = new Date('2024-01-01');

    // Act (actuar)
    const age = calculateAge(birthDate, today);

    // Assert (afirmar)
    expect(age).toBe(34);
  });
});
```

### Testing de Helpers Puros

Para funciones puras (sin efectos secundarios):

```typescript
describe('formatCurrency', () => {
  it('formatea números positivos', () => {
    expect(formatCurrency(1234.56)).toBe('1.234,56 €');
  });

  it('formatea cero', () => {
    expect(formatCurrency(0)).toBe('0,00 €');
  });

  it('formatea números negativos', () => {
    expect(formatCurrency(-99.99)).toBe('-99,99 €');
  });

  it('maneja decimales largos', () => {
    expect(formatCurrency(10.999)).toBe('11,00 €');
  });

  it('maneja null como valor por defecto', () => {
    expect(formatCurrency(null)).toBe('0,00 €');
  });
});
```

### Testing de Funciones con Date

Usa dates fijas para tests determinísticos:

```typescript
describe('isEventInPast', () => {
  it('detecta evento pasado', () => {
    const pastEvent = {
      fechaFin: new Date('2020-01-01'),
    };
    const now = new Date('2024-01-01');

    expect(isEventInPast(pastEvent, now)).toBe(true);
  });

  it('detecta evento futuro', () => {
    const futureEvent = {
      fechaFin: new Date('2025-01-01'),
    };
    const now = new Date('2024-01-01');

    expect(isEventInPast(futureEvent, now)).toBe(false);
  });
});
```

### Testing con Locale

Para funciones que dependen de locale (Intl API):

```typescript
describe('formatPercent', () => {
  it('formatea porcentaje correctamente', () => {
    const result = formatPercent(0.156);

    // No compares string exacto (locale puede variar)
    expect(result).toContain('15,6');
    expect(result).toContain('%');
  });

  it('maneja 100%', () => {
    const result = formatPercent(1);
    expect(result).toContain('100');
    expect(result).toContain('%');
  });
});
```

## Tests de Integración

### Estructura

```
__tests__/integration/
├── api-pacientes.test.ts           # Tests de API pacientes
├── api-agenda-eventos.test.ts      # Tests de API agenda eventos
├── api-agenda-disponibilidad.test.ts
└── ...
```

### Testing de API Routes

#### Setup de Mocks

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/pacientes/route';

// Mock de dependencias
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock('@/lib/server/pacientesAdmin', () => ({
  createPaciente: vi.fn(),
}));

vi.mock('@/lib/middleware/rateLimit', () => ({
  rateLimit: () => vi.fn().mockResolvedValue(null),
  RATE_LIMIT_MODERATE: { maxRequests: 100, windowMs: 60000 },
}));

import { getCurrentUser } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { createPaciente } from '@/lib/server/pacientesAdmin';

describe('API /api/pacientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests...
});
```

#### Test de Autenticación

```typescript
describe('GET /api/pacientes', () => {
  it('retorna 401 si usuario no autenticado', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/pacientes');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autenticado');
  });
});
```

#### Test de Autorización

```typescript
it('retorna 403 si usuario sin permisos', async () => {
  const mockUser = {
    uid: 'user-123',
    email: 'user@test.com',
    roles: ['invitado'], // Sin permisos de escritura
  };

  vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

  const request = new NextRequest('http://localhost:3000/api/pacientes', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(403);
  expect(data.error).toBe('Permisos insuficientes');
});
```

#### Test de Validación

```typescript
it('retorna 400 si datos inválidos', async () => {
  const mockUser = {
    uid: 'user-123',
    email: 'admin@test.com',
    roles: ['admin'],
  };

  vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

  const request = new NextRequest('http://localhost:3000/api/pacientes', {
    method: 'POST',
    body: JSON.stringify({
      nombre: '', // Inválido: vacío
      // Falta genero (requerido)
    }),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toBeDefined();
});
```

#### Test de Happy Path

```typescript
it('crea paciente con datos válidos', async () => {
  const mockUser = {
    uid: 'user-123',
    email: 'admin@test.com',
    roles: ['admin'],
  };

  vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

  const mockCreatedPaciente = {
    id: 'pac-new-123',
    numeroHistoria: 'NH003',
    nombre: 'Pedro',
    apellidos: 'López',
    estado: 'activo',
  };

  vi.mocked(createPaciente).mockResolvedValue(mockCreatedPaciente as any);

  const validPaciente = {
    nombre: 'Pedro',
    apellidos: 'López',
    genero: 'masculino',
    documentoId: '12345678A',
    fechaNacimiento: '1990-05-15',
    telefono: '666555444',
    email: 'pedro@example.com',
    direccion: 'Calle Test 123',
    estado: 'activo',
  };

  const request = new NextRequest('http://localhost:3000/api/pacientes', {
    method: 'POST',
    body: JSON.stringify(validPaciente),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(201);
  expect(data.id).toBe('pac-new-123');
  expect(data.nombre).toBe('Pedro');
  expect(createPaciente).toHaveBeenCalled();
});
```

#### Test de Error Handling

```typescript
it('maneja errores en creación', async () => {
  const mockUser = {
    uid: 'user-123',
    email: 'admin@test.com',
    roles: ['admin'],
  };

  vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

  vi.mocked(createPaciente).mockRejectedValue(
    new Error('Error al crear paciente en Firebase')
  );

  const validPaciente = {
    // ... datos válidos
  };

  const request = new NextRequest('http://localhost:3000/api/pacientes', {
    method: 'POST',
    body: JSON.stringify(validPaciente),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(500);
  expect(data.error).toContain('Error');
});
```

## Mocking

### Mockear Firebase Admin

```typescript
vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      }),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
    }),
  },
}));
```

### Mockear Firestore Queries

```typescript
const mockQuery = {
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  get: vi.fn().mockResolvedValue({ docs: mockDocs }),
};

vi.mocked(adminDb!.collection).mockReturnValue({
  where: vi.fn().mockReturnValue(mockQuery),
  orderBy: vi.fn().mockReturnValue(mockQuery),
  limit: vi.fn().mockReturnValue(mockQuery),
} as any);
```

### Mockear Fechas

```typescript
// Opción 1: Mock de Date
const mockDate = new Date('2024-01-01');
vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

// Opción 2: Usa date-fns con fechas fijas
import { addDays } from 'date-fns';

const baseDate = new Date('2024-01-01');
const futureDate = addDays(baseDate, 7);
```

## Coverage

### Ejecutar Coverage

```bash
npm run test:coverage
```

Genera reporte en `coverage/index.html`.

### Objetivos de Coverage

- **Statements**: >80%
- **Branches**: >70%
- **Functions**: >80%
- **Lines**: >80%

### Ignorar Coverage

Para código que no necesita cobertura:

```typescript
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

## Mejores Prácticas

### 1. Nombres Descriptivos

```typescript
// ❌ Malo
it('works', () => { ... });

// ✅ Bueno
it('calcula edad correctamente para fecha de nacimiento válida', () => { ... });
```

### 2. Un Concepto por Test

```typescript
// ❌ Malo (testa múltiples cosas)
it('formatDate function', () => {
  expect(formatDate(new Date())).toBeTruthy();
  expect(formatDate(null)).toBe('N/A');
  expect(formatDate('invalid')).toBe('N/A');
});

// ✅ Bueno (un concepto por test)
it('formatea fecha válida', () => {
  expect(formatDate(new Date('2024-01-01'))).toBe('01/01/2024');
});

it('maneja null retornando N/A', () => {
  expect(formatDate(null)).toBe('N/A');
});

it('maneja fecha inválida retornando N/A', () => {
  expect(formatDate('invalid')).toBe('N/A');
});
```

### 3. Evita Lógica en Tests

```typescript
// ❌ Malo (lógica en test)
it('suma números', () => {
  const numbers = [1, 2, 3, 4, 5];
  let expected = 0;
  for (const num of numbers) {
    expected += num;
  }
  expect(sum(numbers)).toBe(expected);
});

// ✅ Bueno (valor esperado explícito)
it('suma números', () => {
  expect(sum([1, 2, 3, 4, 5])).toBe(15);
});
```

### 4. Tests Independientes

```typescript
// ❌ Malo (tests dependientes)
let userId: string;

it('crea usuario', async () => {
  const user = await createUser({ name: 'Test' });
  userId = user.id; // Estado compartido
  expect(user).toBeDefined();
});

it('actualiza usuario', async () => {
  await updateUser(userId, { name: 'Updated' }); // Depende del anterior
  // ...
});

// ✅ Bueno (tests independientes)
it('crea usuario', async () => {
  const user = await createUser({ name: 'Test' });
  expect(user).toBeDefined();
});

it('actualiza usuario', async () => {
  const user = await createUser({ name: 'Test' }); // Setup propio
  await updateUser(user.id, { name: 'Updated' });
  // ...
});
```

### 5. Limpia Mocks

```typescript
describe('API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Limpia antes de cada test
  });

  // Tests...
});
```

### 6. Usa beforeEach/afterEach

```typescript
describe('Database tests', () => {
  let connection: Connection;

  beforeEach(async () => {
    connection = await createConnection();
  });

  afterEach(async () => {
    await connection.close();
  });

  it('test 1', async () => {
    // connection está disponible
  });

  it('test 2', async () => {
    // connection está disponible
  });
});
```

### 7. Tests Determinísticos

Evita randoms, fechas actuales, etc:

```typescript
// ❌ Malo (no determinístico)
it('genera ID único', () => {
  const id1 = generateId();
  const id2 = generateId();
  expect(id1).not.toBe(id2); // Podría fallar aleatoriamente
});

// ✅ Bueno (determinístico)
it('genera ID con formato correcto', () => {
  const id = generateId();
  expect(id).toMatch(/^[a-z0-9]{8}$/);
});

it('genera IDs diferentes en llamadas sucesivas', () => {
  const ids = new Set([
    generateId(),
    generateId(),
    generateId(),
    generateId(),
    generateId(),
  ]);
  expect(ids.size).toBe(5); // Probabilidad muy baja de colisión
});
```

## Troubleshooting

### Tests failing aleatoriamente

**Causa**: Tests no determinísticos (fechas, randoms)

**Solución**: Mockea `Date`, usa seeds para randoms

### Tests lentos

**Causa**: Tests haciendo operaciones pesadas

**Solución**:
- Mockea operaciones I/O
- Usa `vi.useFakeTimers()` para timers
- Paraleliza tests independientes

### Mock no funcionando

**Causa**: Mock definido después del import

**Solución**: Define mocks antes de imports

```typescript
// ✅ Correcto
vi.mock('@/lib/utils');
import { myFunction } from '@/lib/utils';

// ❌ Incorrecto
import { myFunction } from '@/lib/utils';
vi.mock('@/lib/utils');
```

## Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Kent C. Dodds - Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

¡Happy Testing! 🧪
