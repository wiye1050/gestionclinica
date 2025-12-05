# Gestión de roles (producción)

Objetivo: que el rol esté sincronizado en dos sitios a la vez:
- Claims de Firebase Auth (para que el servidor autorice).
- Documento `users/{uid}` en Firestore (para que la UI muestre el menú correcto).

## Requisitos
- Clave de servicio del proyecto de producción (`FIREBASE_SERVICE_ACCOUNT_KEY` con los `\\n` escapados).
- UID del usuario (se ve en Firebase Auth o en la consola del navegador con `getAuth().currentUser?.uid`).

## Paso a paso
1. Exporta la clave de servicio en tu terminal:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...,"private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}'
   ```
2. Ejecuta el script con el UID y el rol deseado:
   ```bash
   node scripts/set-role.js <UID> <rol> [email]
   # Ejemplo:
   node scripts/set-role.js uToFoMXgwrRSx admin guille@example.com
   ```
3. Pide al usuario que cierre sesión y vuelva a entrar para refrescar el token.

Roles válidos en este proyecto: `admin`, `coordinador`, `profesional`, `recepcion`, `invitado`.
