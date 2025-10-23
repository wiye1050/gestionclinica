import { getDocs, collection, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const revalidate = 60;

async function obtenerProyectos() {
  const snap = await getDocs(query(collection(db, 'proyectos'), limit(500)));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default async function ProyectosPage() {
  const proyectos = await obtenerProyectos();
  return (
    <div>
      {proyectos.map(p => (
        <div key={p.id}>{p.nombre}</div>
      ))}
    </div>
  );
}
