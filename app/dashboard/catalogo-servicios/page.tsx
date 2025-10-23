'use client';

import { useEffect, useState } from "react";
import { getDocs, collection, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CatalogoServicioItem {
  id: string;
  nombre: string;
  categoria?: string;
  activo?: boolean;
}

export default function CatalogoServiciosPage() {
  const [servicios, setServicios] = useState<CatalogoServicioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerServicios = async () => {
      try {
        const snap = await getDocs(query(collection(db, "catalogo-servicios"), limit(500)));
        const serviciosData = snap.docs.map((doc) => {
          const data = doc.data() as { nombre?: string; categoria?: string; activo?: boolean };
          return {
            id: doc.id,
            nombre: data.nombre ?? "Sin nombre",
            categoria: data.categoria,
            activo: data.activo,
          };
        });

        setServicios(serviciosData);
      } catch (err) {
        console.error("Error cargando catálogo de servicios:", err);
        const message = err instanceof Error ? err.message : "Error desconocido al cargar el catálogo.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    obtenerServicios();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Cargando catálogo de servicios...
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

  if (servicios.length === 0) {
    return (
      <div className="p-4 text-gray-600">
        No hay servicios registrados en el catálogo.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {servicios.map((servicio) => (
        <div key={servicio.id} className="rounded-md border border-gray-200 bg-white p-3">
          <p className="font-medium text-gray-900">{servicio.nombre}</p>
          {servicio.categoria && (
            <p className="text-sm text-gray-500">Categoría: {servicio.categoria}</p>
          )}
          {servicio.activo === false && (
            <p className="text-sm text-red-600">Servicio inactivo</p>
          )}
        </div>
      ))}
    </div>
  );
}
