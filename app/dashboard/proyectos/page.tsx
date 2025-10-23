'use client';

import { useEffect, useState } from "react";
import { getDocs, collection, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProyectoItem {
  id: string;
  nombre: string;
  estado?: string;
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<ProyectoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerProyectos = async () => {
      try {
        const snap = await getDocs(query(collection(db, "proyectos"), limit(500)));
        const proyectosData = snap.docs.map((doc) => {
          const data = doc.data() as { nombre?: string; estado?: string };
          return {
            id: doc.id,
            nombre: data.nombre ?? "Sin nombre",
            estado: data.estado,
          };
        });

        setProyectos(proyectosData);
      } catch (err) {
        console.error("Error cargando proyectos:", err);
        const message = err instanceof Error ? err.message : "Error desconocido al cargar proyectos.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    obtenerProyectos();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Cargando proyectos...
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

  if (proyectos.length === 0) {
    return (
      <div className="p-4 text-gray-600">
        No hay proyectos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {proyectos.map((proyecto) => (
        <div key={proyecto.id} className="rounded-md border border-gray-200 bg-white p-3">
          <p className="font-medium text-gray-900">{proyecto.nombre}</p>
          {proyecto.estado && (
            <p className="text-sm text-gray-500">Estado: {proyecto.estado}</p>
          )}
        </div>
      ))}
    </div>
  );
}
