'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mejora } from '@/types';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const estadoLabels: Record<string, string> = {
  idea: 'Idea',
  'en-analisis': 'En análisis',
  planificada: 'Planificada',
  'en-progreso': 'En progreso',
  completada: 'Completada'
};

export default function MejorasPage() {
  const [mejoras, setMejoras] = useState<Mejora[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, 'mejoras'), orderBy('updatedAt', 'desc'), limit(100))
        );
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date()
        })) as Mejora[];
        setMejoras(data);
      } catch (err) {
        console.error('Error cargando mejoras', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mejoras</h1>
          <p className="text-gray-600 mt-1">
            Propuestas de mejora para salas, equipos, procedimientos y software.
          </p>
        </div>
        <Link
          href="/dashboard/mejoras/nueva"
          className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <span>Nueva mejora</span>
        </Link>
      </header>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
          Cargando mejoras...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mejora
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  RICE
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mejoras.map((mejora) => (
                <tr key={mejora.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{mejora.titulo}</div>
                    <div className="text-xs text-gray-500">
                      Actualizado {mejora.updatedAt.toLocaleDateString('es-ES')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{mejora.area}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                      {estadoLabels[mejora.estado] ?? mejora.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{mejora.rice.score.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/dashboard/mejoras/${mejora.id}`} className="text-blue-600 hover:text-blue-800">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
