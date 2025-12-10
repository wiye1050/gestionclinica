# Análisis de Paginación en la Aplicación

## Estado Actual

### ✅ Endpoints CON paginación cursor-based

#### 1. `/api/pacientes` (COMPLETO)
- **Implementación:** Cursor-based con `startAfter`
- **Límite por defecto:** 200 registros
- **Límite máximo:** 500 registros
- **Cursor field:** `apellidos` + `nombre`
- **Cliente:** Usa `useInfinitePacientes` con React Query
- **UI:** Infinite scroll implementado
- **Estado:** ✅ **EXCELENTE** - Implementación completa y correcta

### ⚠️ Endpoints CON límite pero SIN paginación

#### 2. `/api/formularios/respuestas`
- **Límite actual:** 100 registros (configurable)
- **Problema:** No tiene cursor para cargar más páginas
- **Impacto:** Medio-Alto (crecerá con el tiempo)
- **Prioridad:** ALTA
- **Recomendación:** Añadir cursor-based pagination

#### 3. `/api/agenda/eventos` (via `lib/server/agenda.ts`)
- **Límite actual:** 500 eventos
- **Problema:** Carga todos los eventos de una semana sin paginación
- **Impacto:** Bajo (scope limitado a 1 semana)
- **Prioridad:** BAJA
- **Recomendación:** Monitor

iar si crece

### ❌ Endpoints SIN límite (riesgo potencial)

#### 4. `/api/formularios` (plantillas)
- **Límite:** Ninguno (carga todas)
- **Impacto:** Bajo (pocas plantillas esperadas ~50-100)
- **Prioridad:** BAJA
- **Recomendación:** Añadir `limit(200)` preventivo

## Análisis de colecciones por volumen esperado

| Colección | Volumen estimado | Crecimiento | Paginación | Prioridad |
|-----------|------------------|-------------|------------|-----------|
| `pacientes` | 500-5000 | Alto | ✅ Completa | N/A |
| `pacientes-historial` | 10k-100k | Muy alto | ❌ Sin API | Alta |
| `formularios_respuestas` | 1k-50k | Alto | ⚠️ Parcial | Alta |
| `agenda-eventos` | 500-5k | Alto | ⚠️ Scope limitado | Baja |
| `formularios_plantillas` | 50-200 | Bajo | ❌ Sin límite | Baja |
| `profesionales` | 10-100 | Muy bajo | ❌ Sin límite | Muy baja |
| `servicios` | 50-500 | Bajo | ❌ Sin límite | Baja |

## Implementación recomendada

### Patrón cursor-based (recomendado para volumen alto)

**Ventajas:**
- Performance constante O(1)
- Funciona bien con índices de Firestore
- No hay "page drift" (inserción de nuevos registros no afecta)
- Soporta infinite scroll

**Desventajas:**
- No se puede saltar a página específica
- Más complejo de implementar

**Ejemplo de implementación:**

```typescript
// API Route
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = adminDb
    .collection('collection')
    .orderBy('createdAt', 'desc');

  if (cursor) {
    const cursorDoc = await adminDb.collection('collection').doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.limit(limit + 1).get();
  const docs = snapshot.docs;
  const hasMore = docs.length > limit;
  const items = docs.slice(0, limit);
  const nextCursor = hasMore ? docs[limit].id : null;

  return NextResponse.json({
    items: items.map(doc => ({ id: doc.id, ...doc.data() })),
    nextCursor,
    hasMore,
  });
}
```

```typescript
// React Hook con React Query
export function useInfiniteCollection() {
  return useInfiniteQuery({
    queryKey: ['collection'],
    queryFn: async ({ pageParam = null }) => {
      const url = `/api/collection?limit=50${pageParam ? `&cursor=${pageParam}` : ''}`;
      const res = await fetch(url);
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
```

```typescript
// Componente UI
function CollectionList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCollection();

  const items = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <>
      {items.map(item => <ItemCard key={item.id} item={item} />)}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </>
  );
}
```

### Patrón offset-based (NO recomendado para Firestore)

**Por qué NO usarlo:**
- Firestore no soporta offset nativo eficientemente
- Performance degrada linealmente O(n) con el offset
- Firestore cobra por cada documento "skipped"

## Plan de implementación

### Fase 1: Crítico (implementar ahora)

1. **Formularios Respuestas** - Añadir cursor pagination
   - Volumen esperado alto
   - PHI (datos sensibles)
   - Impacto en performance

### Fase 2: Preventivo (implementar pronto)

2. **Historial de Pacientes** - Si se crea endpoint público
   - Volumen muy alto
   - Datos críticos

3. **Formularios Plantillas** - Añadir límite preventivo
   - Volumen bajo pero creciente

### Fase 3: Monitoreo (implementar si es necesario)

4. **Agenda Eventos** - Evaluar si scope semanal es suficiente
5. **Otras colecciones** - Monitor según crecimiento real

## Métricas de éxito

- ✅ Tiempo de carga < 2 segundos para listados
- ✅ Uso de memoria del navegador < 100MB para listados
- ✅ Queries de Firestore optimizadas con índices
- ✅ UX fluida sin "carga completa" visible
- ✅ Soporta colecciones de 10k+ documentos

## Notas de implementación

### Best Practices

1. **Límites recomendados por tipo de dato:**
   - Listados principales (ej: pacientes): 50-100
   - Historiales/logs: 20-50
   - Datos de referencia (ej: profesionales): 200-500

2. **UX patterns:**
   - Infinite scroll: mejor para móviles
   - "Load More" button: mejor para desktop
   - Skeleton loaders durante fetch

3. **Performance:**
   - Cachear con React Query (staleTime, cacheTime)
   - Prefetch next page en hover
   - Virtual scrolling para listas muy largas (react-window)

4. **Accesibilidad:**
   - Anunciar cuando se cargan nuevos items
   - Mantener focus en elemento correcto
   - Teclado shortcuts para navegar

## Referencias

- [Firestore Pagination Guide](https://firebase.google.com/docs/firestore/query-data/query-cursors)
- [React Query Infinite Queries](https://tanstack.com/query/latest/docs/react/guides/infinite-queries)
- [useInfiniteQuery Example (pacientes)](../lib/hooks/usePacientes.ts)
