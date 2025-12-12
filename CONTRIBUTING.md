# Guía de Contribución

Gracias por tu interés en contribuir a Gestión Clínica. Esta guía te ayudará a empezar.

## Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Setup del Entorno](#setup-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Commits y Pull Requests](#commits-y-pull-requests)
- [Testing](#testing)
- [Documentación](#documentación)

## Código de Conducta

Este proyecto se adhiere a un código de conducta profesional. Al participar, se espera que mantengas un ambiente respetuoso y colaborativo.

## Cómo Contribuir

### Tipos de Contribuciones

Aceptamos varios tipos de contribuciones:

1. **Bug Reports**: Reportar errores encontrados
2. **Feature Requests**: Sugerir nuevas funcionalidades
3. **Bug Fixes**: Corregir errores existentes
4. **Features**: Implementar nuevas funcionalidades
5. **Documentation**: Mejorar la documentación
6. **Tests**: Añadir o mejorar tests
7. **Refactoring**: Mejorar código existente

### Antes de Empezar

1. **Busca issues existentes**: Revisa si ya existe un issue relacionado
2. **Crea un issue**: Si no existe, crea uno describiendo el problema o feature
3. **Espera feedback**: Para features grandes, espera aprobación antes de empezar
4. **Asígnate el issue**: Comenta que trabajarás en él

## Setup del Entorno

### Requisitos

- Node.js 18.17+
- npm 9+
- Git
- Cuenta de Firebase (para development)

### Instalación

```bash
# Fork el repositorio en GitHub

# Clona tu fork
git clone https://github.com/TU_USUARIO/gestionclinica.git
cd gestionclinica

# Añade el repositorio original como upstream
git remote add upstream https://github.com/ORIGINAL/gestionclinica.git

# Instala dependencias
npm install

# Copia variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales

# Inicia servidor de desarrollo
npm run dev
```

### Verificar Setup

```bash
# Verificar tipos
npm run typecheck

# Ejecutar tests
npm run test:run

# Ejecutar linter
npm run lint
```

Todo debe pasar sin errores antes de empezar a trabajar.

## Flujo de Trabajo

### 1. Crear una Rama

```bash
# Actualiza main
git checkout main
git pull upstream main

# Crea rama para tu cambio
git checkout -b tipo/descripcion-corta
```

Tipos de rama:
- `feature/nueva-funcionalidad`
- `fix/corregir-bug`
- `docs/actualizar-readme`
- `refactor/mejorar-componente`
- `test/añadir-tests`

### 2. Hacer Cambios

Realiza tus cambios siguiendo los [Estándares de Código](#estándares-de-código).

### 3. Commits

Haz commits pequeños y descriptivos:

```bash
git add .
git commit -m "tipo: descripción corta del cambio"
```

Ver [Commits y Pull Requests](#commits-y-pull-requests) para formato de commits.

### 4. Mantener Actualizado

```bash
# Mantén tu rama actualizada con main
git fetch upstream
git rebase upstream/main
```

### 5. Push y Pull Request

```bash
# Push a tu fork
git push origin tipo/descripcion-corta

# Crea Pull Request en GitHub
```

## Estándares de Código

### TypeScript

- **Tipos explícitos**: Siempre define tipos, evita `any`
- **Interfaces vs Types**: Usa `interface` para objetos, `type` para unions/aliases
- **Null safety**: Maneja casos null/undefined explícitamente

```typescript
// ✅ Bueno
interface Usuario {
  id: string;
  nombre: string;
  email: string | null;
}

function getUsuario(id: string): Usuario | null {
  // ...
}

// ❌ Malo
function getUsuario(id: any): any {
  // ...
}
```

### Componentes React

- **Server Components por defecto**: Solo usa `"use client"` cuando sea necesario
- **Props typing**: Define interfaces para props
- **Nombres descriptivos**: PascalCase para componentes

```typescript
// ✅ Bueno
interface PacienteCardProps {
  paciente: Paciente;
  onEdit?: (id: string) => void;
}

export function PacienteCard({ paciente, onEdit }: PacienteCardProps) {
  // ...
}

// ❌ Malo
export function Card(props: any) {
  // ...
}
```

### Naming Conventions

- **Archivos**: kebab-case (`paciente-card.tsx`)
- **Componentes**: PascalCase (`PacienteCard`)
- **Funciones**: camelCase (`getPaciente`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RESULTS`)
- **Hooks**: camelCase con prefijo `use` (`usePaciente`)

### Estructura de Archivos

```typescript
// 1. Imports externos
import { useState } from 'react';
import { format } from 'date-fns';

// 2. Imports internos (con alias @/)
import { Button } from '@/components/ui/button';
import { usePaciente } from '@/hooks/usePaciente';

// 3. Imports relativos
import { helper } from './helper';

// 4. Types/Interfaces
interface Props {
  // ...
}

// 5. Componente principal
export function MyComponent({ ...props }: Props) {
  // ...
}

// 6. Componentes auxiliares (si son pequeños)
function AuxComponent() {
  // ...
}
```

### Estilos con Tailwind

- **Clases ordenadas**: Usa orden consistente
- **Evita clases repetidas**: Extrae a componentes
- **Responsive**: Mobile-first (`sm:`, `md:`, `lg:`)

```typescript
// ✅ Bueno
<div className="flex items-center gap-2 rounded-lg bg-white p-4 shadow-sm">
  {children}
</div>

// ❌ Malo (demasiado largo, extraer a componente)
<div className="flex items-center gap-2 rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 md:p-6 lg:p-8">
  {children}
</div>
```

### API Routes

- **Validación con Zod**: Siempre valida input
- **Manejo de errores**: Usa try-catch
- **Status codes correctos**: 200, 201, 400, 401, 403, 404, 500
- **JSDoc completo**: Documenta según `docs/API_DOCUMENTATION.md`

```typescript
/**
 * POST /api/ejemplo
 * Descripción del endpoint
 *
 * @async
 * @param {NextRequest} request - Request de Next.js con body JSON
 *
 * @body {string} nombre - Nombre (requerido)
 *
 * @returns {Promise<NextResponse>} Resultado
 * @returns {201} Éxito - { id: string }
 * @returns {400} Datos inválidos
 * @returns {401} No autenticado
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const validation = await validateRequest(request, schema);
  if (!validation.success) {
    return validation.error;
  }

  try {
    const result = await createItem(validation.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error('[API /api/ejemplo]', error);
    return NextResponse.json(
      { error: 'Error al crear' },
      { status: 500 }
    );
  }
}
```

## Commits y Pull Requests

### Formato de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(scope): descripción corta

Descripción más detallada si es necesario.

BREAKING CHANGE: descripción si hay breaking change
```

**Tipos**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato (no afecta código)
- `refactor`: Refactorización sin cambiar funcionalidad
- `test`: Añadir o corregir tests
- `chore`: Tareas de mantenimiento
- `perf`: Mejoras de performance

**Ejemplos**:

```bash
feat(pacientes): añadir filtro por riesgo

fix(agenda): corregir cálculo de disponibilidad

docs(api): actualizar documentación de endpoints

test(helpers): añadir tests para formatDate

refactor(components): extraer PacienteCard a componente reutilizable
```

### Pull Request

**Título**: Igual que commit principal

```
feat(pacientes): añadir filtro por riesgo
```

**Descripción**:

```markdown
## Descripción

Añade un filtro para mostrar pacientes según su nivel de riesgo (alto, medio, bajo).

## Cambios

- Añadir select de riesgo en CompactFilters
- Actualizar API /api/pacientes para filtrar por riesgo
- Añadir tests para el nuevo filtro

## Testing

- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando
- [ ] Verificado manualmente en desarrollo

## Screenshots

[Añadir screenshots si aplica]

## Checklist

- [x] Código sigue los estándares del proyecto
- [x] Tests añadidos/actualizados
- [x] Documentación actualizada
- [x] Sin console.log ni código comentado
- [x] TypeCheck pasa sin errores
- [x] Linter pasa sin errores
```

### Review Process

1. **Automated checks**: CI debe pasar (build, tests, lint)
2. **Code review**: Al menos 1 aprobación requerida
3. **Cambios solicitados**: Implementa feedback
4. **Merge**: Squash and merge (mantiene historia limpia)

## Testing

### Requisitos

- **Nuevas features**: Deben incluir tests
- **Bug fixes**: Debe incluir test que reproduzca el bug
- **Coverage**: Mantener >80% en funciones críticas

### Escribir Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('formatDate', () => {
  it('formatea fecha correctamente', () => {
    const date = new Date('2024-03-15');
    expect(formatDate(date)).toBe('15/03/2024');
  });

  it('maneja null correctamente', () => {
    expect(formatDate(null)).toBe('N/A');
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/pacientes/route';

vi.mock('@/lib/auth/server');
vi.mock('@/lib/firebaseAdmin');

describe('GET /api/pacientes', () => {
  it('retorna 401 si no autenticado', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/pacientes');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm run test:run

# Con coverage
npm run test:coverage

# Tests específicos
npm run test -- pacientes
```

## Documentación

### Cuándo Actualizar

- **README.md**: Cambios en setup o uso general
- **API_DOCUMENTATION.md**: Nuevos endpoints o cambios en APIs
- **ARCHITECTURE.md**: Cambios arquitectónicos
- **JSDoc**: Todas las funciones públicas y APIs

### Estilo de Documentación

- **Claro y conciso**: Evita jerga innecesaria
- **Ejemplos**: Incluye ejemplos de código
- **Actualizado**: Mantén sincronizado con código
- **Español**: Documentación en español, código en inglés

## Preguntas Frecuentes

### ¿Cómo reporto un bug?

Crea un issue con la plantilla de bug report incluyendo:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Versión/entorno

### ¿Puedo trabajar en un issue asignado a otra persona?

Pregunta primero en el issue. Si no hay actividad en 2 semanas, puedes tomarlo.

### ¿Necesito escribir tests para un fix pequeño?

Sí, siempre que sea posible. Los tests previenen regresiones.

### ¿Cuánto tarda en revisarse un PR?

Típicamente 2-3 días. PRs complejos pueden tomar más tiempo.

## Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Contacto

Si tienes preguntas, abre un issue con la etiqueta `question`.

---

¡Gracias por contribuir! 🎉
