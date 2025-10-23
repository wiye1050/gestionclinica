'use client';

import { useEffect, useState } from "react";
import { getCountFromServer, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface KPITotals {
  servicios: number;
  evaluaciones: number;
  profesionales: number;
}

export default function KPIsPage() {
  const [data, setData] = useState<KPITotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerKPIs = async () => {
      try {
        const qServicios = query(collection(db, "servicios-asignados"), where("estado", "==", "activo"));
        const qEvaluaciones = query(collection(db, "evaluaciones-sesion"));
        const qProfesionales = query(collection(db, "profesionales"), where("activo", "==", true));

        const [serviciosSnap, evaluacionesSnap, profesionalesSnap] = await Promise.all([
          getCountFromServer(qServicios),
          getCountFromServer(qEvaluaciones),
          getCountFromServer(qProfesionales),
        ]);

        setData({
          servicios: serviciosSnap.data().count,
          evaluaciones: evaluacionesSnap.data().count,
          profesionales: profesionalesSnap.data().count,
        });
      } catch (err) {
        console.error("Error cargando KPIs:", err);
        const message = err instanceof Error ? err.message : "Error desconocido al cargar los KPIs.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    obtenerKPIs();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Cargando KPIs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-gray-600">
        No se pudieron cargar los KPIs.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <p>Servicios activos: {data.servicios}</p>
      <p>Evaluaciones: {data.evaluaciones}</p>
      <p>Profesionales activos: {data.profesionales}</p>
    </div>
  );
}
