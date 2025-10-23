import { getDocs, collection, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const revalidate = 60;

async function obtenerInventario() {
  const snap = await getDocs(query(collection(db, 'inventario-productos'), limit(500)));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default async function InventarioPage() {
  const items = await obtenerInventario();
  return (
    <div>
      {items.map(i => (
        <div key={i.id}>{i.nombre}</div>
      ))}
    </div>
  );
}
