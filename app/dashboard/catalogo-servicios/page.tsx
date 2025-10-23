import { getDocs, collection, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const revalidate = 60;

async function obtenerServicios() {
  const snap = await getDocs(query(collection(db, 'catalogo-servicios'), limit(500)));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default async function CatalogoServiciosPage() {
  const servicios = await obtenerServicios();
  return (
    <div>
      {servicios.map(s => (
        <div key={s.id}>{s.nombre}</div>
      ))}
    </div>
  );
}
