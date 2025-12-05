# PLAN DE ACCIÓN ESTRATÉGICO 2025
## Sistema Integral de Gestión Clínica

**Fecha:** Diciembre 2025
**Estado Actual:** Sistema funcional con 17 módulos operativos (100% completitud)
**Objetivo:** Consolidar calidad, seguridad y escalabilidad

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual del Sistema
- ✅ **Arquitectura sólida:** Next.js 15 + TypeScript + Firebase
- ✅ **17 módulos funcionales:** Agenda, Pacientes, Proyectos, Reportes, etc.
- ✅ **407 archivos TypeScript** (~41,223 líneas)
- ✅ **Optimización Fase 3 completada:** SSR, React Query, ISR
- ⚠️ **Cobertura de tests:** < 10%
- ⚠️ **Seguridad API:** 16 de 36 rutas sin verificar auth
- ⚠️ **Code splitting:** Limitado (11 usos de dynamic())

### Esfuerzo Total Estimado
**Fases Prioritarias (1-3):** 184 horas (~4-5 sprints de 2 semanas)

---

## 🎯 FASES DE EJECUCIÓN

### FASE 1: CRÍTICA - Fundamentos Sólidos
**Duración:** 2 semanas (Sprint 1)
**Esfuerzo:** 80 horas
**Prioridad:** 🔴 CRÍTICA

#### 1.1 Sistema de Testing Robusto (40h)
**Objetivo:** Alcanzar 30% cobertura en código crítico

**Tareas:**
- [ ] **Tests Unitarios Validators (8h)**
  - Crear tests para 15 schemas Zod
  - Validar casos edge (valores nulos, límites)
  - Ubicación: `__tests__/validators/`

- [ ] **Tests Hooks Principales (12h)**
  ```
  __tests__/hooks/
  ├── usePacientes.test.ts          → CRUD pacientes
  ├── useAgendaActions.test.ts      → Crear/editar eventos
  ├── useProyectos.test.ts          → Gestión proyectos
  ├── useServiciosModule.test.ts    → Servicios
  └── useAuth.test.ts               → Autenticación
  ```

- [ ] **Tests E2E Flujos Críticos (12h)**
  ```
  __tests__/e2e/
  ├── auth.spec.ts                  → Login/Logout
  ├── pacientes.spec.ts             → Crear paciente + cita
  ├── agenda.spec.ts                → Agendar cita + mover
  └── reportes.spec.ts              → Generar reporte PDF
  ```
  Herramienta: Playwright o Cypress

- [ ] **Configuración Coverage (4h)**
  - Threshold mínimo 30% en vitest.config.ts
  - Badge de coverage en README.md
  - Integrar en GitHub Actions

- [ ] **Tests Server Components (4h)**
  - Tests para páginas principales con MSW (Mock Service Worker)
  - Verificar pre-fetching correcto

**Archivos a Crear:**
```
__tests__/
├── validators/           → 15 archivos nuevos
├── hooks/                → 5 archivos nuevos
├── e2e/                  → 4 archivos nuevos
└── server/               → 3 archivos nuevos
```

**Definición de Hecho:**
- ✅ Coverage total ≥ 30%
- ✅ Coverage crítico (validators, hooks) ≥ 80%
- ✅ 4 flujos E2E pasando
- ✅ CI ejecuta tests automáticamente

---

#### 1.2 Auditoría y Seguridad de API (16h)
**Objetivo:** Verificar autenticación en todas las rutas API

**Tareas:**
- [ ] **Auditoría de 36 Rutas API (4h)**
  - Crear spreadsheet con:
    - Ruta
    - Método HTTP
    - Auth implementada (Sí/No)
    - Roles permitidos
    - Validación Zod (Sí/No)

- [ ] **Implementar Middleware de Auth Común (6h)**
  ```typescript
  // lib/middleware/apiAuth.ts
  export async function requireAuth(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();
    return user;
  }

  export async function requireRole(req: NextRequest, allowedRoles: AppRole[]) {
    const user = await requireAuth(req);
    if (!hasAnyRole(user, allowedRoles)) throw new ForbiddenError();
    return user;
  }
  ```

- [ ] **Aplicar Auth a 16 Rutas Faltantes (4h)**
  - Rutas identificadas sin auth aparente
  - Agregar `requireAuth()` o `requireRole()`
  - Documentar permisos

- [ ] **Rate Limiting en Todas las Rutas (2h)**
  - Ya existe `lib/middleware/rateLimit.ts`
  - Aplicar a todas las rutas API
  - Configurar límites según sensibilidad

**Archivos a Modificar:**
```
app/api/
├── [16 rutas]/route.ts   → Agregar auth
└── middleware.ts         → Config rate limiting
```

**Definición de Hecho:**
- ✅ 36/36 rutas con auth verificada
- ✅ Rate limiting activo
- ✅ Documento de permisos por ruta
- ✅ Tests de autorización

---

#### 1.3 Documentación de API (24h)
**Objetivo:** Generar documentación OpenAPI completa

**Tareas:**
- [ ] **Instalar y Configurar Swagger (4h)**
  ```bash
  npm install swagger-ui-react swagger-jsdoc
  ```
  - Crear ruta `/api/docs` con Swagger UI
  - Configurar swagger-jsdoc

- [ ] **Documentar 36 Endpoints (16h)**
  Para cada endpoint:
  ```typescript
  /**
   * @swagger
   * /api/pacientes:
   *   get:
   *     summary: Listar pacientes
   *     tags: [Pacientes]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de pacientes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Paciente'
   */
  ```

- [ ] **Generar Postman Collection (2h)**
  - Exportar desde Swagger
  - Agregar ejemplos de requests
  - Incluir variables de entorno

- [ ] **Actualizar README con Guía API (2h)**
  - Sección "API Documentation"
  - Link a /api/docs
  - Ejemplos de uso común

**Archivos a Crear:**
```
/app/api/docs/
├── page.tsx              → Swagger UI
├── swagger.json          → Spec generado
└── postman_collection.json
```

**Definición de Hecho:**
- ✅ Swagger UI accesible en /api/docs
- ✅ 36 endpoints documentados
- ✅ Postman collection disponible
- ✅ README actualizado

---

### FASE 2: OPTIMIZACIONES - Performance
**Duración:** 2 semanas (Sprint 2)
**Esfuerzo:** 36 horas
**Prioridad:** 🟠 ALTA

#### 2.1 Code Splitting Agresivo (16h)
**Objetivo:** Reducir bundle inicial 30%

**Tareas:**
- [ ] **Dynamic Import Componentes Grandes (8h)**
  Aplicar a:
  ```typescript
  // app/dashboard/agenda/AgendaClient.tsx
  const AgendaWeekViewV2 = dynamic(() =>
    import('@/components/agenda/v2/AgendaWeekViewV2'),
    { ssr: false, loading: () => <Skeleton /> }
  );

  // Similar para:
  - PatientTimeline (pacientes)
  - GanttView (proyectos)
  - FormularioRenderer (formularios)
  - Chart components (recharts)
  ```

- [ ] **Lazy Load Librerías Pesadas (4h)**
  ```typescript
  // lib/utils/pdfGenerator.ts
  export async function generatePDF(data) {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    // ... lógica
  }

  // lib/utils/excelExport.ts
  export async function exportToExcel(data) {
    const XLSX = await import('xlsx');
    // ... lógica
  }
  ```

- [ ] **Webpack Bundle Analyzer (2h)**
  ```bash
  npm install -D @next/bundle-analyzer
  ```
  - Analizar bundles
  - Identificar más oportunidades
  - Documentar resultados

- [ ] **Optimizar Tree Shaking (2h)**
  - Revisar imports de lodash → lodash-es
  - Imports específicos de lucide-react
  - Verificar side effects en package.json

**Archivos a Modificar:**
```
- 10+ archivos Client.tsx        → dynamic imports
- next.config.ts                 → bundle analyzer
- package.json                   → optimizaciones
```

**Definición de Hecho:**
- ✅ Bundle inicial reducido ≥ 25%
- ✅ FCP < 1.5s (Lighthouse)
- ✅ LCP < 2.5s (Lighthouse)
- ✅ Report de bundle size

---

#### 2.2 React.memo y Optimización Re-renders (12h)
**Objetivo:** Mejorar responsividad en listas grandes

**Tareas:**
- [ ] **Aplicar React.memo (6h)**
  Componentes candidatos:
  ```typescript
  // components/pacientes/v2/PatientCard.tsx
  export const PatientCard = React.memo(({ patient, onClick }) => {
    // ...
  });

  // Similar para:
  - AgendaEventCard (agenda)
  - ProjectCard (proyectos)
  - ServiceCard (servicios)
  - ReportCard (reportes)
  - + 25 componentes de lista
  ```

- [ ] **useCallback en Handlers (4h)**
  ```typescript
  const handleClick = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);
  ```
  - Aplicar en componentes con memo
  - Especialmente en mapeos de arrays

- [ ] **useMemo en Computaciones (2h)**
  ```typescript
  const filteredData = useMemo(() =>
    data.filter(item => filters.includes(item.type)),
    [data, filters]
  );
  ```
  - Filtros complejos
  - Sorts
  - Transformaciones

**Definición de Hecho:**
- ✅ 30+ componentes con React.memo
- ✅ Re-renders reducidos en 60% (React DevTools Profiler)
- ✅ Scroll fluido en listas 100+ items

---

#### 2.3 CI/CD Completo (8h)
**Objetivo:** Pipeline robusto y automatizado

**Tareas:**
- [ ] **Workflow de PR (3h)**
  ```yaml
  # .github/workflows/pr.yml
  name: Pull Request Checks
  on: [pull_request]
  jobs:
    quality:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
        - run: npm ci
        - run: npm run lint
        - run: npm run typecheck
        - run: npm run test:run
        - run: npm run build
  ```

- [ ] **Workflow Deploy Staging/Prod (3h)**
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy
  on:
    push:
      branches: [main]
  jobs:
    deploy-staging:
      # Deploy a Vercel staging
    deploy-prod:
      # Deploy a Vercel prod (manual approval)
  ```

- [ ] **Pre-commit Hooks con Husky (2h)**
  ```bash
  npm install -D husky lint-staged
  npx husky install
  ```
  ```json
  // package.json
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json}": ["prettier --write"]
  }
  ```

**Definición de Hecho:**
- ✅ PR checks automáticos
- ✅ Deploy automático a staging
- ✅ Pre-commit hooks activos
- ✅ Badge de build en README

---

### FASE 3: MEJORAS UX/DX - Calidad
**Duración:** 2 semanas (Sprint 3)
**Esfuerzo:** 68 horas
**Prioridad:** 🟡 MEDIA

#### 3.1 Estandarización Visual (40h)
**Objetivo:** Look & feel consistente en todos los módulos

**Tareas:**
- [ ] **Rediseñar Módulos Antiguos (24h)**
  Aplicar patrón moderno a:
  ```
  ✅ Ya modernos: Pacientes, Proyectos, Agenda
  ⚠️ Pendientes (8 módulos):
    - Reporte Diario          (3h)
    - Supervisión             (3h)
    - Mejoras                 (3h)
    - Inventario              (3h)
    - KPIs                    (3h)
    - Informes                (3h)
    - Usuarios                (3h)
    - Auditoría               (3h)
  ```

  Patrón estándar:
  ```tsx
  <div className="space-y-4">
    <CompactFilters {...filters} />
    <KPIGrid kpis={kpis} />
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
    />
  </div>
  ```

- [ ] **Unificar Skeletons (4h)**
  - Crear `components/shared/Skeletons.tsx`
  - Reemplazar skeletons custom por compartidos
  - Asegurar consistencia de animaciones

- [ ] **Estandarizar Modals y Drawers (8h)**
  - Crear `components/shared/Modal.tsx` genérico
  - Crear `components/shared/Drawer.tsx` genérico
  - Migrar modals existentes al nuevo patrón
  - Asegurar accesibilidad (focus trap, escape)

- [ ] **Design System Tokens (4h)**
  ```typescript
  // lib/design/tokens.ts
  export const tokens = {
    colors: {
      brand: '#0087cd',
      success: '#10b981',
      // ...
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      // ...
    },
    typography: {
      fontFamily: 'Inter',
      sizes: {
        xs: '0.75rem',
        // ...
      }
    }
  };
  ```

**Definición de Hecho:**
- ✅ 8 módulos con diseño moderno
- ✅ Skeletons unificados
- ✅ Modals/Drawers estandarizados
- ✅ Design tokens documentados

---

#### 3.2 Documentación Completa (16h)
**Objetivo:** Onboarding de 2h para nuevos developers

**Tareas:**
- [ ] **CONTRIBUTING.md (4h)**
  Secciones:
  - Setup local (Firebase, env vars)
  - Estructura del proyecto
  - Convenciones de código
  - Git workflow (branches, PRs)
  - Testing guidelines
  - Cómo agregar un módulo nuevo

- [ ] **README por Módulo (8h)**
  Crear 17 archivos:
  ```
  app/dashboard/[modulo]/README.md
  ```
  Template:
  ```markdown
  # Módulo: [Nombre]

  ## Descripción
  ## Arquitectura
  ## Componentes Principales
  ## Hooks
  ## API Endpoints
  ## Testing
  ## TODOs
  ```

- [ ] **Diagramas de Arquitectura (4h)**
  Usando Mermaid en Markdown:
  - Diagrama de componentes (Server/Client)
  - Flujo de datos (Request → Server → Client)
  - Autenticación y autorización
  - Estructura de Firebase

**Archivos a Crear:**
```
/docs/
├── CONTRIBUTING.md
├── SETUP.md
├── ARCHITECTURE.md
└── diagrams/
    ├── components.md
    ├── data-flow.md
    └── auth.md

/app/dashboard/*/README.md (17 archivos)
```

**Definición de Hecho:**
- ✅ CONTRIBUTING.md completo
- ✅ 17 READMEs de módulos
- ✅ 4 diagramas de arquitectura
- ✅ Nuevo dev puede hacer setup en < 2h

---

#### 3.3 Monitoreo y Observabilidad (12h)
**Objetivo:** Insights de producción en tiempo real

**Tareas:**
- [ ] **Integrar Error Tracking (4h)**
  Opciones: Sentry, Rollbar, BugSnag
  ```typescript
  // lib/monitoring/errorTracking.ts
  export function initErrorTracking() {
    if (process.env.NODE_ENV === 'production') {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: 'production',
        // ...
      });
    }
  }
  ```

- [ ] **Google Analytics 4 (2h)**
  ```typescript
  // lib/analytics/ga4.ts
  export function trackEvent(name: string, params?: object) {
    if (typeof window !== 'undefined') {
      window.gtag('event', name, params);
    }
  }
  ```
  - Track: page views, clicks críticos, conversiones

- [ ] **Logs Estructurados Servidor (4h)**
  ```bash
  npm install pino pino-pretty
  ```
  ```typescript
  // lib/logger/server.ts
  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  });
  ```

- [ ] **Dashboard Vercel Analytics (2h)**
  - Activar Vercel Analytics
  - Configurar Web Vitals tracking
  - Crear dashboard personalizado

**Definición de Hecho:**
- ✅ Error tracking activo
- ✅ GA4 instalado y rastreando
- ✅ Logs estructurados en servidor
- ✅ Dashboard de métricas funcionando

---

## 📋 CHECKLIST GENERAL

### Pre-requisitos
- [ ] Backup completo de base de datos Firebase
- [ ] Entorno de staging configurado
- [ ] Equipo alineado en prioridades
- [ ] Branch `develop` creado desde `main`

### Durante Ejecución
- [ ] Daily standups (15 min)
- [ ] Code reviews obligatorias
- [ ] Tests pasando antes de merge
- [ ] Documentar decisiones importantes

### Post-Ejecución
- [ ] Retrospectiva de cada fase
- [ ] Actualizar roadmap
- [ ] Celebrar logros 🎉
- [ ] Planear siguiente fase

---

## 🎯 MÉTRICAS DE ÉXITO

### FASE 1
- ✅ Coverage: 10% → 30%
- ✅ API Security: 20/36 → 36/36 rutas con auth
- ✅ Documentación: 0 → 36 endpoints documentados

### FASE 2
- ✅ Bundle Size: -30%
- ✅ FCP: < 1.5s
- ✅ CI/CD: 0 → 3 workflows activos

### FASE 3
- ✅ Módulos modernos: 9/17 → 17/17
- ✅ Onboarding time: ∞ → 2h
- ✅ Error tracking: 0% → 100%

---

## 🚀 QUICK WINS (Paralelo a Fases)

**Mientras se ejecutan las fases, hacer:**

1. **Eliminar console.log restantes (30 min)**
   ```bash
   # Ya se hizo, solo verificar
   grep -r "console\." app/ lib/ components/
   ```

2. **Agregar ESLint rules estrictas (1h)**
   ```json
   // .eslintrc.json
   {
     "rules": {
       "no-console": "error",
       "@typescript-eslint/no-explicit-any": "error",
       "react/prop-types": "off"
     }
   }
   ```

3. **Configurar Prettier (30 min)**
   ```json
   // .prettierrc
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5"
   }
   ```

4. **Actualizar dependencias (1h)**
   ```bash
   npm outdated
   npm update
   npm audit fix
   ```

5. **Agregar badges al README (30 min)**
   ```markdown
   ![Build Status](https://img.shields.io/github/workflow/status/...)
   ![Coverage](https://img.shields.io/codecov/c/github/...)
   ![License](https://img.shields.io/github/license/...)
   ```

---

## 📚 RECURSOS Y REFERENCIAS

### Testing
- [Vitest Docs](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright E2E](https://playwright.dev)

### Performance
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

### CI/CD
- [GitHub Actions](https://docs.github.com/en/actions)
- [Husky](https://typicode.github.io/husky/)
- [Vercel Deployment](https://vercel.com/docs)

---

## 💡 NOTAS FINALES

### ¿Por dónde empezar?
**Recomendación:** FASE 1 → Tarea 1.1 (Testing)
- Mayor impacto inmediato
- Reduce riesgo de regresiones
- Facilita refactorizaciones futuras

### ¿Puedo cambiar el orden?
**Sí**, pero considera:
- FASE 1 es crítica para calidad
- FASE 2 impacta directamente UX
- FASE 3 puede hacerse en paralelo

### ¿Cómo trackear progreso?
- Crear issues en GitHub para cada tarea
- Usar GitHub Projects para kanban
- Daily updates en Slack/Discord
- Weekly demo de avances

### ¿Qué pasa después de FASE 3?
- **Fase 4 (Backlog):** Features avanzados, WebSockets, Multi-tenancy
- **Fase 5 (Escalabilidad):** ElasticSearch, CDN, Edge Functions
- **Fase 6 (Mobile):** React Native app o PWA

---

**Documento creado:** Diciembre 2025
**Próxima revisión:** Después de completar FASE 1
**Mantenedor:** Equipo de Desarrollo

---

🎯 **¡Manos a la obra!** Este plan transforma un sistema funcional en un sistema **enterprise-grade** listo para escalar.
