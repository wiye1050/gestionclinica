const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./service-account.json');

initializeApp({ credential: cert(serviceAccount) });

async function run() {
  await getAuth().setCustomUserClaims('uToFoMXgwrRSxXBIQmpg1OV3Tqw1', { roles: ['admin'] });
  console.log('Rol admin asignado a uToFoMXgwrRSxXBIQmpg1OV3Tqw1');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error asignando rol', err);
  process.exit(1);
});