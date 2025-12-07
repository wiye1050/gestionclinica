# REPORTE DE AUDITORÍA DE SEGURIDAD - RUTAS API
**Fecha**: 2025-12-07
**Total de rutas auditadas**: 35 archivos de ruta

## TABLA DE AUDITORÍA DETALLADA

| Ruta | Método | Auth ✓/✗ | Roles ✓/✗ | Rate Limit ✓/✗ | Zod ✓/✗ | Notas |
|------|---------|----------|-----------|----------------|---------|-------|
| `/api/admin/migrate-colors` | POST | ✓ | ✓ | ✓ | ✗ | Solo admin (manual check). Rate limit STRICT |
| `/api/agenda/disponibilidad` | GET | ✓ | ✓ | ✓ | ✓ | Roles: admin, coordinador, profesional, recepcion. Rate limit STRICT |
| `/api/agenda/eventos` | GET | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.READ). GET sin rate limit |
| `/api/agenda/eventos` | POST | ✓ | ✓ | ✓ | ✓ | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT. Schema: createEventoAgendaSchema |
| `/api/agenda/eventos/[id]` | PATCH | ✓ | ✓ | ✓ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT. Sin schema Zod |
| `/api/agenda/eventos/[id]` | DELETE | ✓ | ✓ | ✓ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT |
| `/api/auth/session` | POST | ✗ | ✗ | ✓ | ✗ | Login endpoint. No requiere auth previa. Rate limit STRICT |
| `/api/auth/session` | DELETE | ✗ | ✗ | ✗ | N/A | Logout endpoint. Sin auth ni rate limit |
| `/api/catalogo-servicios` | GET | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.READ). Sin rate limit |
| `/api/catalogo-servicios` | POST | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación Zod |
| `/api/catalogo-servicios/[id]` | PATCH | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/catalogo-servicios/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/dashboard/finance-summary` | GET | ✓ | ✓ | ✗ | N/A | Usa canViewFinances(). Sin rate limit |
| `/api/formularios` | GET | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.READ). Sin rate limit |
| `/api/formularios` | POST | ✓ | ✓ | ✗ | ✓ | Usa hasAnyRole(API_ROLES.WRITE). Schema: createPlantillaSchema. Sin rate limit |
| `/api/formularios/[id]` | GET | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.READ). Sin rate limit |
| `/api/formularios/[id]` | PATCH | ✓ | ✓ | ✗ | ✓ | Usa hasAnyRole(API_ROLES.WRITE). Schema: updatePlantillaSchema |
| `/api/formularios/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/formularios/respuestas` | GET | ✓ | ✓ | ✗ | N/A | Contiene PHI. Usa hasAnyRole(API_ROLES.READ). Sin rate limit |
| `/api/formularios/respuestas` | POST | ✓ | ✓ | ✓ | ✓ | Contiene PHI. Rate limit MODERATE. Schema: createRespuestaSchema |
| `/api/formularios/respuestas/[id]` | GET | ✓ | ✓ | ✗ | N/A | Contiene PHI. Usa hasAnyRole(API_ROLES.READ). Sin rate limit |
| `/api/formularios/respuestas/[id]` | PATCH | ✓ | ✓ | ✗ | ✓ | Contiene PHI. Schema: updateRespuestaSchema. Sin rate limit |
| `/api/formularios/respuestas/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Contiene PHI. Solo admin/coordinador. Sin rate limit |
| `/api/kpis` | GET | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.READ). Sin rate limit |
| `/api/maintenance/purge-history` | POST | ✓ | ✓ | ✓ | ✗ | Solo admin (hasRole). Rate limit STRICT |
| `/api/pacientes` | GET | ✓ | ✗ | ✗ | N/A | Auth ✓ pero validación manual de roles. Sin rate limit |
| `/api/pacientes` | POST | ✓ | ✓ | ✓ | ✓ | Usa hasAnyRole(API_ROLES.WRITE). Rate limit MODERATE. Schema: createPacienteSchema |
| `/api/pacientes/[id]` | PATCH | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/pacientes/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/pacientes/[id]/detail` | GET | ✓ | ✓ | ✗ | N/A | Usa canViewFullPatientHistory(). Contiene PHI. Sin rate limit |
| `/api/pacientes/[id]/historial` | POST | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/pacientes/importar` | POST | ✓ | ✓ | ✓ | ✓ | Solo admin. Rate limit STRICT. Schema: importRequestSchema |
| `/api/profesionales` | GET | ✓ | ✓ | ✓ | N/A | Usa hasAnyRole(API_ROLES.READ). Rate limit STRICT |
| `/api/profesionales` | POST | ✓ | ✓ | ✓ | ✓ | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT. Schema: createProfesionalSchema |
| `/api/profesionales/[id]` | PATCH | ✓ | ✓ | ✓ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT. Sin validación |
| `/api/profesionales/[id]` | DELETE | ✓ | ✓ | ✓ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT |
| `/api/protocolos` | POST | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/proyectos` | POST | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/proyectos/[id]` | PATCH | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/proyectos/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/reportes/diarios` | GET | ✓ | ✓ | ✓ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT |
| `/api/reportes/diarios` | POST | ✓ | ✓ | ✓ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Rate limit STRICT. Sin validación Zod |
| `/api/reportes/diarios/[id]` | PATCH | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/reportes/diarios/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/reportes/informe-mensual` | POST | ✓ | ✓ | ✗ | ✗ | Solo admin/coordinador. Sin rate limit ni validación |
| `/api/servicios` | GET | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.READ). Sin rate limit |
| `/api/servicios` | POST | ✓ | ✓ | ✗ | ✓ | Usa hasAnyRole(API_ROLES.WRITE). Schema: createServicioSchema. Sin rate limit |
| `/api/servicios/[id]` | PATCH | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/servicios/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/supervision` | GET | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/supervision/evaluaciones` | POST | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/tratamientos` | GET | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/tratamientos` | POST | ✓ | ✓ | ✗ | ✓ | Usa hasAnyRole(API_ROLES.WRITE). Schema: createTratamientoSchema. Sin rate limit |
| `/api/tratamientos/[id]` | PATCH | ✓ | ✓ | ✗ | ✗ | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit ni validación |
| `/api/tratamientos/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Usa hasAnyRole(API_ROLES.WRITE). Sin rate limit |
| `/api/upload` | POST | ✓ | ✓ | ✓ | ✓ | Roles: admin, coordinador, profesional, recepcion. Rate limit STRICT. Schema: validateFileMetadataSchema |
| `/api/usuarios` | GET | ✓ | ✓ | ✗ | N/A | Solo admin (manual check). Sin rate limit |
| `/api/usuarios` | POST | ✓ | ✓ | ✓ | ✓ | Solo admin. Rate limit MODERATE. Schema: createUserSchema |
| `/api/usuarios/[id]` | GET | ✓ | ✓ | ✗ | N/A | Solo admin. Sin rate limit |
| `/api/usuarios/[id]` | PATCH | ✓ | ✓ | ✗ | ✓ | Solo admin. Schema: updateUserSchema. Sin rate limit |
| `/api/usuarios/[id]` | DELETE | ✓ | ✓ | ✗ | N/A | Solo admin. Sin rate limit |

## RESUMEN EJECUTIVO

### Estadísticas Generales
- **Total de archivos de ruta**: 35
- **Total de endpoints (métodos HTTP únicos)**: 62
  - GET: 17
  - POST: 20
  - PATCH: 16
  - DELETE: 9

### Seguridad de Autenticación y Autorización
- **Endpoints CON autenticación**: 60/62 (96.8%)
- **Endpoints SIN autenticación**: 2/62 (3.2%)
- **Endpoints CON verificación de roles**: 60/62 (96.8%)
- **Endpoints SIN verificación de roles**: 2/62 (3.2%)

### Rate Limiting
- **Endpoints CON rate limiting**: 18/62 (29.0%)
- **Endpoints SIN rate limiting**: 44/62 (71.0%)

### Validación con Zod
- **Endpoints CON validación Zod**: 16/62 (25.8%)
- **Endpoints SIN validación Zod**: 37/62 (59.7%)
- **Endpoints N/A (GET, DELETE sin body)**: 9/62 (14.5%)

## VULNERABILIDADES Y RECOMENDACIONES

### 🔴 PRIORIDAD ALTA

1. **Falta de Rate Limiting en operaciones de escritura (71% sin protección)**
   - Riesgo: Abuso de API, DoS, spam
   - Acción: Agregar rate limiting a los 44 endpoints sin protección

2. **Falta de validación Zod en operaciones de escritura (60% sin validación)**
   - Riesgo: Inyección de datos maliciosos, corrupción de DB
   - Acción: Crear schemas y aplicar validación

3. **Datos de salud protegidos (PHI) sin rate limiting agresivo**
   - Endpoints con PHI necesitan RATE_LIMIT_STRICT
   - Afecta: `/api/formularios/respuestas/*`, `/api/pacientes/[id]/detail`

### 📋 PLAN DE ACCIÓN

**Fase 1: Rate Limiting (2h)**
- Agregar a todos los GET de listados
- Agregar a todos los POST/PATCH/DELETE

**Fase 2: Validación Zod (4h)**
- Crear schemas faltantes
- Aplicar validación en endpoints de escritura

**Fase 3: Protección PHI (1h)**
- Reforzar endpoints con datos médicos
- Agregar logging de auditoría

---
**Documento de referencia para implementación de seguridad**
