#!/usr/bin/env node

/**
 * Asigna rol a un usuario en Firebase Auth (claims) y en Firestore (users/{uid}).
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...,"private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}' \
 *   node scripts/set-role.js <uid> <role> [email]
 *
 * Roles válidos en este proyecto: admin, coordinador, profesional, recepcion, invitado
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

function parseArgs() {
  const [uid, role, email = ''] = process.argv.slice(2);
  if (!uid || !role) {
    console.error('Uso: node scripts/set-role.js <uid> <role> [email]');
    process.exit(1);
  }
  return { uid, role, email };
}

function initAdmin() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.error('Falta FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }
  const svc = JSON.parse(raw);
  return initializeApp({
    credential: cert({
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: svc.private_key.replace(/\\n/g, '\n'),
    }),
  });
}

async function main() {
  const { uid, role, email } = parseArgs();
  initAdmin();

  const auth = getAuth();
  const db = getFirestore();

  // Asignar claim
  await auth.setCustomUserClaims(uid, { roles: [role] });

  // Actualizar documento en Firestore
  const now = new Date();
  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        email,
        role,
        active: true,
        updatedAt: now,
        lastLogin: now,
      },
      { merge: true }
    );

  console.log(`Rol ${role} asignado a ${uid} (email: ${email || 'N/D'})`);
  console.log('Pide al usuario que cierre sesión y vuelva a entrar para refrescar el token.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
