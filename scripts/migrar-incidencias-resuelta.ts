import { db } from './_shared-firebase-client';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

async function main() {
  const col = collection(db, 'daily-reports');
  const snap = await getDocs(col);
  const batch = writeBatch(db);
  let count = 0;

  snap.forEach(d => {
    const data = d.data() as any;
    if (typeof data.resuelta !== 'boolean') {
      batch.update(doc(db, 'daily-reports', d.id), { resuelta: false });
      count++;
    }
  });

  if (count > 0) await batch.commit();
  console.log(`Actualizadas ${count} incidencias sin campo 'resuelta'`);
}

main().catch(e => { console.error(e); process.exit(1); });
