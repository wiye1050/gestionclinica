# Firestore Indexes - Documentación

## Resumen

Este documento explica los índices compuestos de Firestore configurados para optimizar las queries de la aplicación de gestión clínica.

## Desplegar índices

Para desplegar los índices a Firebase:

```bash
firebase deploy --only firestore:indexes
```

Para ver el progreso de creación de índices:
```bash
firebase firestore:indexes
```

## Índices configurados

### Agenda (agenda-eventos)

**Índice 1: Estado + Fecha**
- Campos: `estado` (ASC), `fechaInicio` (ASC)
- Uso: Filtrar eventos por estado en un rango de fechas
- Frecuencia: Alta (dashboard KPIs)

**Índice 2: Fecha + Estado**
- Campos: `fechaInicio` (ASC), `estado` (ASC)
- Uso: Obtener eventos de una semana y filtrar por estado
- Frecuencia: Alta (KPIs semanales)

### Pacientes

**Índice 1: Apellidos + Nombre**
- Campos: `apellidos` (ASC), `nombre` (ASC)
- Uso: Listado ordenado alfabéticamente
- Frecuencia: Muy alta

**Índice 2: Estado + Apellidos + Nombre**
- Campos: `estado` (ASC), `apellidos` (ASC), `nombre` (ASC)
- Uso: Filtrar pacientes activos/inactivos con orden alfabético
- Frecuencia: Alta

### Historial de Pacientes (pacientes-historial)

**Índice 1: Paciente + Fecha**
- Campos: `pacienteId` (ASC), `fecha` (DESC)
- Uso: Historial clínico del paciente ordenado por fecha
- Frecuencia: Muy alta

**Índice 2: Planes Seguimiento + Fecha**
- Campos: `planesSeguimiento` (ASC), `fecha` (DESC)
- Uso: Historial filtrado por seguimientos
- Frecuencia: Media

**Índice 3: Link Expiración**
- Campos: `linkExpiresAt` (ASC)
- Uso: Tarea de mantenimiento para purgar links expirados
- Frecuencia: Baja (tarea programada)

### Facturas (collectionGroup)

**Índice 1: Fecha**
- Campos: `fecha` (ASC)
- Query Scope: COLLECTION_GROUP
- Uso: Facturación del mes (resumen financiero)
- Frecuencia: Alta

**Índice 2: Fecha de Pago**
- Campos: `fechaPago` (ASC)
- Query Scope: COLLECTION_GROUP
- Uso: Cobros del mes (resumen financiero)
- Frecuencia: Alta

**Índice 3: Estado**
- Campos: `estado` (ASC)
- Query Scope: COLLECTION_GROUP
- Uso: Facturas pendientes y vencidas
- Frecuencia: Alta

### Formularios - Respuestas (formularios_respuestas)

**Índice 1: Paciente + Fecha Creación**
- Campos: `pacienteId` (ASC), `createdAt` (DESC)
- Uso: Respuestas de un paciente ordenadas por fecha
- Frecuencia: Alta

**Índice 2: Plantilla + Fecha Creación**
- Campos: `formularioPlantillaId` (ASC), `createdAt` (DESC)
- Uso: Respuestas de una plantilla específica
- Frecuencia: Alta

**Índice 3: Estado + Fecha Creación**
- Campos: `estado` (ASC), `createdAt` (DESC)
- Uso: Respuestas filtradas por estado
- Frecuencia: Alta

**Índice 4: Paciente + Plantilla + Fecha**
- Campos: `pacienteId` (ASC), `formularioPlantillaId` (ASC), `createdAt` (DESC)
- Uso: Respuestas específicas de un paciente en una plantilla
- Frecuencia: Media-Alta

### Formularios - Plantillas (formularios_plantillas)

**Índice 1: Tipo + Nombre**
- Campos: `tipo` (ASC), `nombre` (ASC)
- Uso: Plantillas filtradas por tipo ordenadas por nombre
- Frecuencia: Media

**Índice 2: Estado + Nombre**
- Campos: `estado` (ASC), `nombre` (ASC)
- Uso: Plantillas activas/inactivas ordenadas
- Frecuencia: Media

**Índice 3: Tipo + Estado + Nombre**
- Campos: `tipo` (ASC), `estado` (ASC), `nombre` (ASC)
- Uso: Filtro combinado de tipo y estado
- Frecuencia: Media

### Reportes

**Índice 1: Daily Reports - Fecha**
- Campos: `fecha` (ASC)
- Uso: Informes mensuales
- Frecuencia: Baja-Media

**Índice 2: Daily Reports - Prioridad + Resuelta**
- Campos: `prioridad` (ASC), `resuelta` (ASC)
- Uso: Dashboard de reportes pendientes
- Frecuencia: Alta

**Índice 3: Reportes Diarios - Estado**
- Campos: `estado` (ASC)
- Uso: Contador de pendientes en dashboard
- Frecuencia: Alta

### Evaluaciones

**Índice: Evaluaciones por Fecha**
- Campos: `fecha` (ASC)
- Uso: Informes mensuales de evaluaciones
- Frecuencia: Baja

### Protocolos

**Índice: Versiones de Protocolo**
- Campos: `protocoloId` (ASC), `version` (DESC)
- Uso: Obtener última versión de un protocolo
- Frecuencia: Media

### Notificaciones

**Índice: Por Usuario + Fecha**
- Campos: `destinatarioUid` (ASC), `createdAt` (DESC)
- Uso: Notificaciones del usuario ordenadas
- Frecuencia: Alta

## Índices que NO se necesitan

Firestore crea automáticamente índices simples para:
- Queries con un solo campo
- Queries con rango + orderBy en el mismo campo
- Queries de igualdad simples

## Monitoreo de performance

Para monitorear el uso y performance de índices:

1. Firebase Console > Firestore > Indexes
2. Ver estado de construcción de índices
3. Revisar queries que fallan por falta de índice

## Costos

Los índices tienen costos:
- **Escritura**: Cada documento escrito actualiza sus índices
- **Almacenamiento**: Los índices ocupan espacio

Para el volumen de una clínica (estimado <100k documentos):
- Costo adicional estimado: <$5/mes
- Mejora de performance: significativa (10-100x más rápido)

## Referencias

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Query Limitations](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)
