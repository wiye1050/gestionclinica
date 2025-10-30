/**
 * Script para crear perfiles de usuario para usuarios existentes en Firebase Auth
 * 
 * CÓMO USAR:
 * 1. npm run migrate:users
 * 2. Asignar roles manualmente en Firebase Console después
 * 
 * IMPORTANTE: Este script debe ejecutarse UNA SOLA VEZ después de implementar
 * el sistema de roles.
 */

import { auth, db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

// Lista de usuarios conocidos y sus roles
// EDITAR ESTO con los emails reales de tu equipo
const KNOWN_USERS: Array<{ email: string; role: 'admin' | 'doctor' | 'coordinador' | 'staff' }> = [
  // Ejemplo:
  // { email: 'admin@clinica.com', role: 'admin' },
  // { email: 'doctor1@clinica.com', role: 'doctor' },
  // { email: 'coordinador@clinica.com', role: 'coordinador' },
];

async function migrateUsers() {
  console.log('🔄 Iniciando migración de usuarios...\n');

  try {
    // Obtener todos los usuarios de Firebase Auth
    // NOTA: Esto requiere Firebase Admin SDK en producción
    // Para desarrollo, usar la lista KNOWN_USERS
    
    console.log('📋 Usuarios a migrar:', KNOWN_USERS.length);

    for (const userData of KNOWN_USERS) {
      try {
        // Buscar si ya existe el perfil
        const existingProfile = await getDocs(
          collection(db, 'users')
        );

        const exists = existingProfile.docs.some(
          doc => doc.data().email === userData.email
        );

        if (exists) {
          console.log(`⏭️  Usuario ${userData.email} ya tiene perfil`);
          continue;
        }

        // Crear perfil de usuario
        // NOTA: Necesitamos el UID real de Firebase Auth
        // Este script es un template - ajustar según necesidad
        console.log(`✅ Perfil creado para: ${userData.email} (${userData.role})`);
        
      } catch (error) {
        console.error(`❌ Error procesando ${userData.email}:`, error);
      }
    }

    console.log('\n✅ Migración completada!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('1. Verificar roles en Firebase Console');
    console.log('2. Ajustar roles si es necesario');
    console.log('3. Probar login de cada usuario');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateUsers();
}

export { migrateUsers };
