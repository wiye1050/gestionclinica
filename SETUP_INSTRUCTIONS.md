# 🚀 INSTRUCCIONES DE CONFIGURACIÓN POST-DEPLOY

## ⚠️ CRÍTICO: Configurar Variables de Entorno en Vercel

### Paso 1: Obtener Credenciales de Google Cloud Storage

1. **Ve a Google Cloud Console:**
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=delta-vertex-476113-u7
   ```

2. **Busca tu Service Account** (o crea uno nuevo si no existe):
   - Nombre típico: `firebase-adminsdk-xxxxx@delta-vertex-476113-u7.iam.gserviceaccount.com`
   - Si no tienes ninguno, haz clic en **"+ CREATE SERVICE ACCOUNT"**
     - Nombre: `gestionclinica-storage`
     - Role: `Storage Admin`

3. **Crear una nueva clave JSON:**
   - Selecciona el service account
   - Ve a la pestaña **"KEYS"**
   - Click en **"ADD KEY"** → **"Create new key"**
   - Selecciona **"JSON"**
   - Click **"CREATE"**
   - Se descargará un archivo `.json`

4. **Abrir el archivo JSON descargado:**
   - Se verá algo así:
   ```json
   {
     "type": "service_account",
     "project_id": "delta-vertex-476113-u7",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@delta-vertex-476113-u7.iam.gserviceaccount.com",
     "client_id": "123456789...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
   }
   ```

5. **IMPORTANTE: Copiar TODO el contenido en UNA SOLA LÍNEA**
   - Usa un editor de texto
   - Elimina todos los saltos de línea
   - Debe quedar: `{"type":"service_account","project_id":"delta-vertex-476113-u7",...}`

---

### Paso 2: Configurar en Vercel

1. **Ve a tu proyecto en Vercel:**
   ```
   https://vercel.com/wiyes-projects/gestionclinica
   ```

2. **Ir a Settings:**
   - En el menú lateral, click en **"Settings"**

3. **Ir a Environment Variables:**
   - En el menú de Settings, click en **"Environment Variables"**

4. **Añadir las siguientes variables (UNA POR UNA):**

   **Variable 1: GOOGLE_CLOUD_PROJECT_ID**
   ```
   Name: GOOGLE_CLOUD_PROJECT_ID
   Value: delta-vertex-476113-u7
   Environment: Production, Preview, Development (marcar todas)
   ```
   Click **"Save"**

   **Variable 2: GOOGLE_CLOUD_STORAGE_BUCKET**
   ```
   Name: GOOGLE_CLOUD_STORAGE_BUCKET
   Value: gestionclinica-archivos
   Environment: Production, Preview, Development (marcar todas)
   ```
   Click **"Save"**

   **Variable 3: GOOGLE_CLOUD_CREDENTIALS** (LA MÁS IMPORTANTE)
   ```
   Name: GOOGLE_CLOUD_CREDENTIALS
   Value: [PEGA AQUÍ TODO EL JSON EN UNA SOLA LÍNEA del Paso 1]
   Environment: Production, Preview, Development (marcar todas)
   ```
   Click **"Save"**

5. **IMPORTANTE: Redeployar la aplicación**
   - Ve a la pestaña **"Deployments"**
   - Click en los 3 puntos del último deployment
   - Click en **"Redeploy"**
   - Esto aplicará las nuevas variables de entorno

---

## 🔥 PARTE 2: Desplegar Firestore Rules

### Opción A: Desde Firebase Console (Más fácil)

1. **Ve a Firebase Console:**
   ```
   https://console.firebase.google.com/project/delta-vertex-476113-u7/firestore/rules
   ```

2. **Reemplazar las reglas actuales:**
   - Copia el contenido del archivo `firestore.rules` de tu repositorio
   - Pégalo en el editor de Firebase Console
   - Click en **"Publicar"**

### Opción B: Desde línea de comandos (Si tienes Firebase CLI)

```bash
cd /ruta/a/tu/proyecto/gestionclinica
firebase deploy --only firestore:rules
```

---

## ✅ VERIFICACIÓN: ¿Funcionó Todo?

### 1. Verificar Upload de Archivos

1. Ve a tu aplicación: `https://tu-dominio.vercel.app/dashboard/pacientes`
2. Intenta subir una imagen o PDF a un paciente
3. Verifica que:
   - ✅ Solo acepta archivos permitidos (JPG, PNG, PDF, etc.)
   - ✅ No acepta archivos > 10MB
   - ✅ La URL del archivo comienza con `https://storage.googleapis.com/`

**Si ves un error:** Revisa que las variables de entorno estén bien configuradas

### 2. Verificar Protocolos (XSS Protection)

1. Ve a: `https://tu-dominio.vercel.app/dashboard/protocolos`
2. Abre un protocolo existente
3. El contenido debería renderizarse correctamente sin scripts maliciosos

### 3. Verificar Firestore Rules

En Firebase Console:
```
https://console.firebase.google.com/project/delta-vertex-476113-u7/firestore/usage
```
- No deberías ver errores 403 (forbidden)
- Las operaciones deberían funcionar normalmente

---

## 🆘 TROUBLESHOOTING

### Error: "Upload failed" al subir archivos

**Causa:** Variables de entorno no configuradas

**Solución:**
1. Verifica que `GOOGLE_CLOUD_CREDENTIALS` esté configurada en Vercel
2. Asegúrate de que el JSON esté en UNA SOLA LÍNEA (sin saltos)
3. Redeploya la aplicación

### Error: "Permission denied" en Firestore

**Causa:** Reglas de Firestore no actualizadas

**Solución:**
1. Despliega las reglas desde Firebase Console
2. Verifica que el usuario tenga el rol correcto (admin, coordinador, etc.)

### Los archivos antiguos no funcionan

**Causa:** URLs antiguas eran públicas, las nuevas son privadas con expiración

**Solución:**
- Los archivos antiguos seguirán funcionando si eran públicos
- Los nuevos archivos usarán signed URLs con expiración de 7 días
- Puedes regenerar URLs para archivos antiguos si es necesario

---

## 📞 ¿NECESITAS AYUDA?

Si algo no funciona:
1. Revisa los logs de Vercel: `https://vercel.com/wiyes-projects/gestionclinica/logs`
2. Revisa la consola del navegador (F12 → Console)
3. Verifica que las variables de entorno estén configuradas correctamente

---

## 🎉 TODO LISTO

Una vez completados estos pasos:
- ✅ Los archivos estarán protegidos (privados con signed URLs)
- ✅ Las validaciones de archivo funcionarán
- ✅ XSS protection estará activa
- ✅ Las reglas de seguridad mejoradas estarán en producción

**Tu aplicación estará lista para manejar datos médicos reales de forma segura. 🔒**
