import { getCountFromServer, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const revalidate = 60;

async function obtenerKPIs() {
  const qServicios = query(collection(db, 'servicios-asignados'), where('estado', '==', 'activo'));
  const qEvaluaciones = query(collection(db, 'evaluaciones-sesion'));
  const qProfesionales = query(collection(db, 'profesionales'), where('activo', '==', true));

  const [serviciosSnap, evaluacionesSnap, profesionalesSnap] = await Promise.all([
    getCountFromServer(qServicios),
    getCountFromServer(qEvaluaciones),
    getCountFromServer(qProfesionales),
  ]);

  return {
    servicios: serviciosSnap.data().count,
    evaluaciones: evaluacionesSnap.data().count,
    profesionales: profesionalesSnap.data().count,
  };
}

export default async function KPIsPage() {
  const data = await obtenerKPIs();

  return (
    <div className="space-y-2">
      <p>Servicios activos: {data.servicios}</p>
      <p>Evaluaciones: {data.evaluaciones}</p>
      <p>Profesionales activos: {data.profesionales}</p>
    </div>
  );
}
