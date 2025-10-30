# 🚀 GUÍA DE IMPLEMENTACIÓN - SECURITY FIXES

## ⚠️ CRÍTICO - LEER PRIMERO

**IMPORTANTE:** Estas medidas de seguridad son CRÍTICAS para datos médicos.  
No poner en producción sin implementarlas.

---

## 📋 PASO 1: FIRESTORE SECURITY RULES (30 minutos)

### 1.1 Abrir Firebase Console
```
1. Ve a: https://console.firebase.google.com
2. Selecciona tu proyecto: gestionclinica-a85c8
3. Menu lateral → Firestore Database
4. Pestaña "Reglas"
```

### 1.2 Copiar Reglas
```
1. Abre el archivo: firestore.rules (raíz del proyecto)
2. Copia TODO el contenido
3. Pega en el editor de Firebase Console
4. Click "Publicar"
```

### 1.3 Probar Reglas
```
1. Click en "Simulador de reglas"
2. Probar estos escenarios:

Escenario 1: Usuario NO autenticado intenta leer pacientes
  Tipo: get
  Ubicación: /databases/(default)/documents/pacientes/test123
  Sin autenticar
  Resultado esperado: ❌ Denegado

Escenario 2: Usuario autenticado lee pacientes
  Tipo: get
  Ubicación: /databases/(default)/documents/pacientes/test123
  Autenticado: tu-uid
  Resultado esperado: ✅ Permitido

Escenario 3: Staff intenta eliminar paciente
  Tipo: delete
  Ubicación: /databases/(default)/documents/pacientes/test123
  Autenticado: uid con role=staff
  Resultado esperado: ❌ Denegado
```

### 1.4 Verificar Publicación
```bash
# Las reglas deben estar activas inmediatamente
# Si hay error, revisar sintaxis en el simulador
```

**✅ CHECKPOINT 1:** Reglas de Firestore publicadas y probadas

---

## 📋 PASO 2: CREAR SISTEMA DE ROLES (45 minutos)

### 2.1 Verificar Archivos Creados
```
✅ /lib/utils/userRoles.ts
✅ /scripts/migrate-users.ts
```

### 2.2 Actualizar useAuth Hook
```typescript
// /lib/hooks/useAuth.ts

// Agregar imports:
import { createUserProfile, updateLastLogin } from '@/lib/utils/userRoles';

// En la función register, después del createUserWithEmailAndPassword:
const register = async (email: string, password: string, displayName?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // 🆕 NUEVO: Crear perfil con rol
    await createUserProfile(
      result.user.uid, 
      email, 
      'staff', // Rol por defecto
      displayName
    );
    
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// En onAuthStateChanged, después de setUser:
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUser(user);
    
    // 🆕 NUEVO: Actualizar último login
    if (user) {
      await updateLastLogin(user.uid);
    }
    
    setLoading(false);
  });
  
  return unsubscribe;
}, []);
```

### 2.3 Crear Usuarios Iniciales Manualmente

**Opción A: Firebase Console (Recomendado)**
```
1. Firebase Console → Authentication → Users
2. Para cada usuario existente:
   - Copiar su UID
3. Firestore Database → users (crear colección si no existe)
4. Agregar documento con ID = UID del usuario:
   {
     email: "usuario@email.com",
     role: "admin", // o "doctor", "coordinador", "staff"
     displayName: "Nombre Usuario",
     active: true,
     createdAt: [timestamp actual],
     updatedAt: [timestamp actual]
   }
```

**ROLES SUGERIDOS:**
- `admin`: Acceso total, gestiona todo
- `doctor`: Acceso a pacientes, historial, agenda
- `coordinador`: Gestiona agenda, servicios, reportes
- `staff`: Lectura limitada

**Opción B: Script (Avanzado)**
```typescript
// Editar scripts/migrate-users.ts con tus usuarios reales
// Luego ejecutar:
npm run migrate:users
```

**✅ CHECKPOINT 2:** Al menos 1 usuario con rol 'admin' creado

---

## 📋 PASO 3: PROBAR EL SISTEMA (30 minutos)

### 3.1 Test de Autenticación
```
1. Logout de la aplicación
2. Login con usuario que tiene rol 'admin'
3. Verificar que puede acceder a todo
4. Login con usuario 'staff'
5. Intentar eliminar un paciente → Debe fallar ❌
```

### 3.2 Test de Consola
```
Abrir DevTools → Console
Ejecutar:

// Ver tu rol actual
import { getUserProfile } from './lib/utils/userRoles';
const uid = auth.currentUser.uid;
getUserProfile(uid).then(console.log);

// Debería mostrar: { email, role, active, ... }
```

### 3.3 Test Roles en Componentes
```typescript
// Ejemplo de uso en cualquier componente:
import { useUserRole } from '@/lib/utils/userRoles';

function MiComponente() {
  const { role, isAdmin, loading } = useUserRole();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <p>Tu rol: {role}</p>
      {isAdmin && <button>Solo admin puede ver esto</button>}
    </div>
  );
}
```

**✅ CHECKPOINT 3:** Sistema de roles funcionando correctamente

---

## 📋 PASO 4: SANITIZACIÓN DE INPUTS (20 minutos)

### 4.1 Instalar DOMPurify
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### 4.2 Crear Utilidad de Sanitización
```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
}
```

### 4.3 Aplicar en Formularios
```typescript
// Ejemplo en formulario de paciente
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 🆕 SANITIZAR antes de guardar
  const sanitizedData = {
    nombre: sanitizeInput(nombre),
    apellidos: sanitizeInput(apellidos),
    notas: sanitizeHTML(notas), // Si permite algo de formato
  };
  
  await addDoc(collection(db, 'pacientes'), sanitizedData);
};
```

**✅ CHECKPOINT 4:** Inputs sanitizados en formularios críticos

---

## 📋 PASO 5: AUDIT LOGGING (30 minutos)

### 5.1 Crear Sistema de Logs
```typescript
// lib/utils/auditLog.ts
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'READ' 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'EXPORT';

export async function logAction(
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  userId: string,
  userEmail: string,
  metadata?: Record<string, any>
) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      resourceType,
      resourceId,
      userId,
      userEmail,
      timestamp: new Date(),
      metadata: metadata || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
    });
  } catch (error) {
    // No fallar si el log falla
    console.error('Error logging action:', error);
  }
}
```

### 5.2 Aplicar en Operaciones Críticas
```typescript
// Ejemplo: Al crear paciente
const handleCreatePaciente = async (data) => {
  // Crear paciente
  const docRef = await addDoc(collection(db, 'pacientes'), data);
  
  // 🆕 LOG la acción
  await logAction(
    'CREATE',
    'pacientes',
    docRef.id,
    user.uid,
    user.email,
    { nombre: data.nombre, apellidos: data.apellidos }
  );
};

// Ejemplo: Al actualizar
const handleUpdatePaciente = async (id, newData, oldData) => {
  await updateDoc(doc(db, 'pacientes', id), newData);
  
  // 🆕 LOG con cambios
  await logAction(
    'UPDATE',
    'pacientes',
    id,
    user.uid,
    user.email,
    { 
      before: oldData,
      after: newData,
      changes: Object.keys(newData)
    }
  );
};

// Ejemplo: Al eliminar
const handleDeletePaciente = async (id) => {
  await deleteDoc(doc(db, 'pacientes', id));
  
  // 🆕 LOG crítico
  await logAction(
    'DELETE',
    'pacientes',
    id,
    user.uid,
    user.email,
    { warning: 'DELETION - datos médicos' }
  );
};
```

**✅ CHECKPOINT 5:** Audit logging implementado en operaciones críticas

---

## 📋 PASO 6: FIREBASE APP CHECK (30 minutos)

### 6.1 Configurar reCAPTCHA v3
```
1. Ve a: https://www.google.com/recaptcha/admin
2. Click "+"
3. Configurar:
   - Label: gestionclinica
   - Tipo: reCAPTCHA v3
   - Dominios: 
     - localhost (para desarrollo)
     - tu-dominio.vercel.app
4. Copiar SITE KEY
```

### 6.2 Habilitar App Check en Firebase
```
1. Firebase Console → App Check
2. Click "Get Started"
3. Seleccionar app web
4. Provider: reCAPTCHA v3
5. Pegar SITE KEY
6. Registrar
```

### 6.3 Agregar a la App
```typescript
// lib/firebase.ts

// Agregar imports
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Después de inicializar app:
if (typeof window !== 'undefined') {
  // Solo en browser
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('TU_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}
```

### 6.4 Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
```

```typescript
// Usar en firebase.ts
provider: new ReCaptchaV3Provider(
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!
)
```

**✅ CHECKPOINT 6:** App Check habilitado y funcionando

---

## 📋 PASO 7: VERIFICACIÓN FINAL (15 minutos)

### 7.1 Checklist de Seguridad
```
✅ Firestore Rules publicadas
✅ Sistema de roles funcionando
✅ Al menos 1 admin creado
✅ Inputs sanitizados
✅ Audit logging en operaciones críticas
✅ Firebase App Check habilitado
✅ Variables de entorno configuradas
✅ .env.local en .gitignore
```

### 7.2 Test End-to-End
```
1. Login como admin
2. Crear un paciente (debe funcionar ✅)
3. Ver audit logs en Firestore (debe haber registro ✅)
4. Logout
5. Login como staff
6. Intentar borrar paciente (debe fallar ❌)
7. Ver que no puede acceder a audit logs (debe fallar ❌)
```

### 7.3 Verificar en Firebase Console
```
1. Firestore → auditLogs: Debe haber registros ✅
2. Authentication → Users: Cada uno tiene perfil en 'users' ✅
3. App Check → Dashboard: Debe mostrar requests ✅
```

**✅ CHECKPOINT FINAL:** Todos los sistemas de seguridad activos

---

## 🎯 SIGUIENTES PASOS (Opcional pero Recomendado)

### A) Política de Contraseñas (30 min)
Ver: `/docs/security/password-policy.md`

### B) Auto-Logout (20 min)
Ver: `/docs/security/auto-logout.md`

### C) Rate Limiting (45 min)
Ver: `/docs/security/rate-limiting.md`

### D) Monitoreo con Sentry (30 min)
Próximo paso en el roadmap

---

## ⚠️ TROUBLESHOOTING

### Problema: "Permission denied" después de aplicar rules
**Solución:**
1. Verificar que el usuario tiene documento en colección 'users'
2. Verificar que el rol está bien escrito: 'admin', no 'Admin'
3. Usar simulador de reglas para debuggear

### Problema: App Check no funciona en localhost
**Solución:**
```typescript
// lib/firebase.ts
if (typeof window !== 'undefined') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
    // 🆕 SOLO EN DESARROLLO
    ...(process.env.NODE_ENV === 'development' && {
      provider: new ReCaptchaV3Provider(siteKey, {
        useGate: true // Bypass para desarrollo
      })
    })
  });
}
```

### Problema: Logs no se guardan
**Solución:**
1. Verificar que existe la colección 'auditLogs'
2. Verificar que las Firestore Rules permiten escritura
3. Revisar consola por errores

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar Firebase Console → Logs
2. Browser DevTools → Console
3. Firestore Rules → Simulador
4. Documentación: `/docs/security/`

---

**Tiempo total estimado:** 3-4 horas  
**Dificultad:** Media  
**Impacto:** 🔴 CRÍTICO para seguridad

¿Listo para empezar? Comienza con el PASO 1 ☝️
