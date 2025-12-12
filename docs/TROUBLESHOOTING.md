# Guía de Resolución de Problemas

Esta guía cubre problemas comunes y sus soluciones.

## Tabla de Contenidos

- [Problemas de Instalación](#problemas-de-instalación)
- [Problemas de Firebase](#problemas-de-firebase)
- [Problemas de Autenticación](#problemas-de-autenticación)
- [Problemas de Build/Deploy](#problemas-de-builddeploy)
- [Problemas de Development](#problemas-de-development)
- [Problemas de Testing](#problemas-de-testing)
- [Problemas de Performance](#problemas-de-performance)

## Problemas de Instalación

### Error: Node version incompatible

**Síntoma**:
```
error: The engine "node" is incompatible with this module
```

**Solución**:
```bash
# Verifica tu versión de Node
node --version

# Debe ser >= 18.17.0
# Si es menor, actualiza Node.js
```

Usa [nvm](https://github.com/nvm-sh/nvm) para gestionar versiones:

```bash
nvm install 18
nvm use 18
```

### Error: npm install falla

**Síntoma**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solución**:

1. **Limpia caché e intenta de nuevo**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Si persiste, usa flag legacy**:
   ```bash
   npm install --legacy-peer-deps
   ```

### Error: Cannot find module

**Síntoma**:
```
Error: Cannot find module '@/lib/firebaseAdmin'
```

**Solución**:

Verifica que `tsconfig.json` tiene el alias configurado:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Reinicia el servidor de desarrollo:
```bash
npm run dev
```

## Problemas de Firebase

### Error: Firebase Admin not initialized

**Síntoma**:
```
Error: Firebase Admin SDK not initialized
```

**Solución**:

1. **Verifica variables de entorno**:

Revisa que `.env.local` tiene las credenciales correctas:

```bash
# Opción 1: JSON completo
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# O Opción 2: Variables individuales
FIREBASE_ADMIN_PROJECT_ID=tu-proyecto-id
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

2. **Verifica formato de private key**:

El private key debe tener los saltos de línea correctos: `\n`

```bash
# ❌ Incorrecto (sin \n)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY----- MII... -----END PRIVATE KEY-----"

# ✅ Correcto (con \n)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
```

3. **Reinicia servidor**:
```bash
# Detén el servidor (Ctrl+C) y reinicia
npm run dev
```

### Error: Permission denied (Firestore)

**Síntoma**:
```
FirebaseError: Missing or insufficient permissions
```

**Solución**:

1. **Verifica reglas de Firestore**:

Ve a Firebase Console → Firestore Database → Rules

Para desarrollo, puedes usar reglas permisivas temporalmente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ Solo para desarrollo
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. **Para producción**, usa reglas basadas en roles:

Ver `docs/firestore-security.md` para reglas completas.

### Error: Storage CORS

**Síntoma**:
```
Access to fetch at 'https://storage.googleapis.com/...' has been blocked by CORS policy
```

**Solución**:

1. **Crea archivo `cors.json`**:

```json
[
  {
    "origin": ["http://localhost:3000", "https://tu-dominio.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

2. **Aplica configuración CORS**:

```bash
gsutil cors set cors.json gs://tu-bucket.appspot.com
```

3. **Verifica que está aplicado**:

```bash
gsutil cors get gs://tu-bucket.appspot.com
```

## Problemas de Autenticación

### Error: No se puede iniciar sesión

**Síntoma**:
Usuario no puede hacer login, sin mensaje de error claro.

**Solución**:

1. **Verifica que Firebase Auth está activado**:

Firebase Console → Authentication → Sign-in method → Email/Password debe estar habilitado

2. **Verifica variables de entorno client-side**:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

3. **Verifica authorized domains**:

Firebase Console → Authentication → Settings → Authorized domains

Añade tu dominio (ej: `localhost`, `tu-app.vercel.app`)

### Error: User has no roles

**Síntoma**:
Usuario se autentica pero no puede acceder a ningún recurso.

**Solución**:

Asigna un rol usando el script:

```bash
node scripts/set-role.js <uid> <rol> <email>

# Ejemplo:
node scripts/set-role.js abc123 admin user@example.com
```

Roles disponibles: `admin`, `coordinador`, `profesional`, `recepcion`, `invitado`, `paciente`

### Error: Token expired

**Síntoma**:
```
Error: Firebase ID token has expired
```

**Solución**:

El token se renueva automáticamente. Si persiste:

1. **Fuerza logout/login**:
```typescript
await signOut(auth);
// Vuelve a hacer login
```

2. **Limpia localStorage**:
```javascript
localStorage.clear();
```

## Problemas de Build/Deploy

### Error: Type errors during build

**Síntoma**:
```
Type error: Property 'xyz' does not exist on type 'ABC'
```

**Solución**:

1. **Verifica tipos localmente**:
```bash
npm run typecheck
```

2. **Corrige errores de tipo**:
- Añade tipos faltantes
- Usa type guards para narrowing
- Evita `any` (usa `unknown` si es necesario)

3. **Si es un falso positivo**, añade comentario:
```typescript
// @ts-expect-error: Firebase types no coinciden
const data = snapshot.data();
```

### Error: Build fails con "out of memory"

**Síntoma**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solución**:

1. **Aumenta memoria de Node.js**:

En `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

2. **Para Vercel**, añade en `vercel.json`:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ]
}
```

### Error: Environment variables not working in production

**Síntoma**:
Variables de entorno funcionan en dev pero no en producción.

**Solución**:

1. **Client-side variables**: Deben tener prefijo `NEXT_PUBLIC_`

```bash
# ✅ Accesible en client
NEXT_PUBLIC_API_URL=https://api.example.com

# ❌ Solo server-side
API_SECRET_KEY=abc123
```

2. **En Vercel**: Añade variables en Dashboard → Settings → Environment Variables

3. **Redeploy** después de añadir variables

## Problemas de Development

### Error: Page won't refresh (Fast Refresh)

**Síntoma**:
Cambios en código no se reflejan en el navegador.

**Solución**:

1. **Verifica que no haya errores de sintaxis** en la consola

2. **Reinicia servidor**:
```bash
# Ctrl+C para detener
npm run dev
```

3. **Limpia caché de Next.js**:
```bash
rm -rf .next
npm run dev
```

4. **Hard refresh en navegador**: `Cmd+Shift+R` (Mac) o `Ctrl+Shift+R` (Windows)

### Error: Hydration mismatch

**Síntoma**:
```
Warning: Text content did not match. Server: "X" Client: "Y"
```

**Solución**:

Causas comunes:

1. **Fechas/timestamps**:
```typescript
// ❌ Malo (diferente en server y client)
<div>{new Date().toISOString()}</div>

// ✅ Bueno (usa useEffect para client-only)
const [date, setDate] = useState<string>('');
useEffect(() => {
  setDate(new Date().toISOString());
}, []);
```

2. **LocalStorage en render**:
```typescript
// ❌ Malo
const theme = localStorage.getItem('theme');

// ✅ Bueno
const [theme, setTheme] = useState<string>('');
useEffect(() => {
  setTheme(localStorage.getItem('theme') ?? 'light');
}, []);
```

3. **HTML inválido**:
```tsx
// ❌ Malo (div dentro de p)
<p>
  <div>Contenido</div>
</p>

// ✅ Bueno
<div>
  <div>Contenido</div>
</div>
```

### Error: Module not found después de añadir archivo

**Síntoma**:
Acabas de crear un archivo pero Next.js no lo encuentra.

**Solución**:

Reinicia el servidor de desarrollo:
```bash
# Detén con Ctrl+C
npm run dev
```

## Problemas de Testing

### Error: Tests failing con Firebase mocks

**Síntoma**:
```
Error: Firebase Admin SDK is not initialized
```

**Solución**:

Asegúrate de mockear correctamente:

```typescript
// En tu test
vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}));
```

### Error: Tests timeout

**Síntoma**:
```
Test timeout of 5000ms exceeded
```

**Solución**:

1. **Aumenta timeout para test específico**:
```typescript
it('slow test', async () => {
  // ...
}, 10000); // 10 segundos
```

2. **Revisa que mocks devuelven promesas**:
```typescript
vi.mocked(asyncFunction).mockResolvedValue(data);
// No mockReturnValue para funciones async
```

### Error: Cannot find module en tests

**Síntoma**:
```
Cannot find module '@/lib/utils' from '__tests__/example.test.ts'
```

**Solución**:

Verifica `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    alias: {
      '@/': new URL('./', import.meta.url).pathname,
    },
  },
});
```

## Problemas de Performance

### Página carga lenta

**Síntomas**:
- Time to First Byte (TTFB) alto
- Queries Firestore lentas

**Soluciones**:

1. **Implementa caching**:
```typescript
import { unstable_cache } from 'next/cache';

export const getCachedData = unstable_cache(
  async () => getData(),
  ['cache-key'],
  { revalidate: 300 } // 5 minutos
);
```

2. **Limita queries Firestore**:
```typescript
// ❌ Malo (sin límite)
const snapshot = await collection.get();

// ✅ Bueno (con límite)
const snapshot = await collection.limit(100).get();
```

3. **Usa índices en Firestore**:

Firebase Console → Firestore → Indexes

Crea índices compuestos para queries con múltiples where/orderBy.

### Bundle size muy grande

**Síntoma**:
Bundle de JavaScript > 500KB

**Soluciones**:

1. **Analiza bundle**:
```bash
npm run build
npx @next/bundle-analyzer
```

2. **Dynamic imports para componentes pesados**:
```typescript
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  ssr: false,
  loading: () => <Skeleton />,
});
```

3. **Tree-shake bibliotecas grandes**:
```typescript
// ❌ Malo (importa todo)
import { format, parse, addDays } from 'date-fns';

// ✅ Bueno (solo lo necesario)
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
```

## Obtener Ayuda

Si tu problema no está listado aquí:

1. **Revisa logs**: Browser console y terminal
2. **Busca en issues**: GitHub issues del proyecto
3. **Crea un issue**: Con reproducción mínima del problema
4. **Stack Overflow**: Para problemas generales de Next.js/Firebase

### Información útil para reportar bugs

- Node version: `node --version`
- npm version: `npm --version`
- OS: macOS/Windows/Linux
- Navegador: Chrome/Firefox/Safari + versión
- Mensaje de error completo
- Pasos para reproducir
- Código relevante

## Referencias Externas

- [Next.js Troubleshooting](https://nextjs.org/docs/messages)
- [Firebase Troubleshooting](https://firebase.google.com/support/troubleshooting)
- [React Error Decoder](https://react.dev/errors/)
- [TypeScript Error Messages](https://typescript.tv/errors/)
