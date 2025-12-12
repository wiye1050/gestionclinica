# Documentación de APIs

Este documento describe el estándar de documentación JSDoc para las APIs del proyecto.

## Estándar de Documentación

Todas las API routes deben seguir este formato JSDoc:

### Estructura Básica

```typescript
/**
 * [METHOD] [RUTA]
 * Descripción breve de la funcionalidad
 *
 * @async
 * @param {NextRequest} request - Request de Next.js [con body JSON si aplica]
 *
 * [Query params o Body params según el método]
 *
 * @returns {Promise<NextResponse>} Descripción del retorno
 * @returns {200} Éxito - estructura de datos
 * @returns {400} Error de validación
 * @returns {401} No autenticado
 * @returns {403} No autorizado
 * @returns {500} Error del servidor
 *
 * @security Requisitos de autenticación/autorización
 *
 * @example
 * // Ejemplo de uso
 *
 * @throws {ErrorType} Descripción del error
 */
```

### Query Parameters (GET)

Para documentar query parameters en GET requests:

```typescript
/**
 * @query {type} [nombre] - Descripción (opcional)
 * @query {type} nombre - Descripción (requerido)
 */
```

### Body Parameters (POST, PUT, PATCH)

Para documentar body parameters:

```typescript
/**
 * @body {type} nombre - Descripción (requerido, restricciones)
 * @body {type} [nombre='default'] - Descripción (opcional con default)
 */
```

### Códigos de Estado HTTP

Documentar todos los códigos de estado posibles:

- `200` - Éxito (GET, PUT, PATCH)
- `201` - Recurso creado (POST)
- `204` - Sin contenido (DELETE)
- `400` - Validación fallida o datos inválidos
- `401` - No autenticado (falta token o sesión)
- `403` - No autorizado (permisos insuficientes)
- `404` - Recurso no encontrado
- `409` - Conflicto (ej: double-booking, duplicado)
- `429` - Rate limit excedido
- `500` - Error interno del servidor

### Seguridad

Documentar requisitos de seguridad:

```typescript
/**
 * @security Requiere autenticación
 * @security Requiere rol: admin | coordinador | profesional
 */
```

### Validación

Documentar validaciones especiales:

```typescript
/**
 * @validation Valida que fechaFin > fechaInicio
 * @validation Detecta conflictos de horario
 */
```

### Algoritmos Complejos

Para lógica de negocio compleja, documentar el algoritmo:

```typescript
/**
 * @algorithm
 * 1. Paso uno
 * 2. Paso dos
 * 3. Paso tres
 */
```

### Ejemplos

Incluir siempre ejemplos de uso:

```typescript
/**
 * @example
 * // Descripción del ejemplo
 * GET /api/recurso?param=valor
 *
 * @example
 * // Ejemplo de respuesta exitosa
 * {
 *   "data": { ... }
 * }
 *
 * @example
 * // Ejemplo de error
 * {
 *   "error": "Mensaje de error",
 *   "details": { ... }
 * }
 */
```

## APIs Documentadas

### 1. `/api/pacientes`

**GET** - Lista paginada de pacientes con filtros
- Filtrado por estado
- Búsqueda por texto
- Paginación con cursor
- Control de acceso por roles

**POST** - Crear nuevo paciente
- Validación completa con Zod
- Generación automática de número de historia
- Permisos de escritura requeridos

### 2. `/api/agenda/eventos`

**GET** - Obtener eventos de una semana
- Filtra por rango de fechas
- Retorna eventos serializados

**POST** - Crear evento con validación de conflictos
- Validación de fechas
- Detección de double-booking
- Validación de disponibilidad de sala
- Códigos de error específicos (409 para conflictos)

### 3. `/api/agenda/disponibilidad`

**GET** - Calcular slots disponibles
- Algoritmo de gaps entre eventos
- Filtrado por duración mínima
- Respeto de horario laboral
- Límite de resultados

## Beneficios de la Documentación

1. **Autocomplete en IDEs** - Los editores pueden sugerir parámetros y tipos
2. **Validación en desarrollo** - TypeScript puede validar uso correcto
3. **Documentación viva** - Siempre actualizada con el código
4. **Onboarding rápido** - Nuevos desarrolladores entienden las APIs
5. **Testing más fácil** - Ejemplos claros de uso y respuestas esperadas
6. **Generación automática** - Herramientas pueden generar docs HTML/OpenAPI

## Herramientas Recomendadas

- **TypeDoc** - Generación de documentación HTML desde JSDoc
- **Swagger/OpenAPI** - Convertir JSDoc a especificación OpenAPI
- **VS Code** - Muestra JSDoc en hover y autocomplete
- **ESLint** - Validar que todas las APIs tengan documentación

## Mantenimiento

- Actualizar JSDoc cuando cambien los endpoints
- Revisar documentación en code reviews
- Mantener ejemplos actualizados
- Verificar que códigos de estado sean correctos
- Actualizar seguridad si cambian los requisitos de auth

## Referencias

- [JSDoc Official](https://jsdoc.app/)
- [TypeScript JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [MDN Web Docs - HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
