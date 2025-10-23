'use client';

import { useEffect, useState } from "react";
import { getDocs, collection, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InventarioItem {
  id: string;
  nombre: string;
}

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerInventario = async () => {
      try {
        const snap = await getDocs(query(collection(db, "inventario-productos"), limit(500)));
        const inventario = snap.docs.map((doc) => {
          const data = doc.data() as { nombre?: string };
          return {
            id: doc.id,
            nombre: data.nombre ?? "Sin nombre",
          };
        });

        setItems(inventario);
      } catch (err) {
        console.error("Error cargando inventario:", err);
        const message = err instanceof Error ? err.message : "Error desconocido al cargar inventario.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    obtenerInventario();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Cargando inventario...
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

  if (items.length === 0) {
    return (
      <div className="p-4 text-gray-600">
        No hay productos registrados en el inventario.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border border-gray-200 bg-white p-3">
          {item.nombre}
        </div>
      ))}
    </div>
  );
}
