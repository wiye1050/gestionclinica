'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Protocolo, ProtocoloVersion } from '@/types';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProtocolosPage() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [versiones, setVersiones] = useState<Record<string, ProtocoloVersion | undefined>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtocolos = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'protocolos'), orderBy('titulo'), limit(100)));
        const data: Protocolo[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date()
        })) as Protocolo[];
        setProtocolos(data);

        const versionesSnap = await getDocs(
          query(collection(db, 'protocolos-versiones'), orderBy('createdAt', 'desc'), limit(200))
        );
        const versionesMap: Record<string, ProtocoloVersion | undefined> = {};
        versionesSnap.docs.forEach((doc) => {
          const version = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() ?? new Date()
          } as ProtocoloVersion;
          if (!versionesMap[version.protocoloId] || version.version > (versionesMap[version.protocoloId]?.version ?? 0)) {
            versionesMap[version.protocoloId] = version;
          }
        });
        setVersiones(versionesMap);
      } catch (err) {
        console.error('Error cargando protocolos', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocolos();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-600">Cargando protocolos...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Protocolos</h1>
          <p className="text-gray-600 mt-1">Procedimientos clínicos versionados y aprobados.</p>
        </div>
        <Link
          href="/dashboard/protocolos/nuevo"
          className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <span>Nuevo protocolo</span>
        </Link>
      </header>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Protocolo
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Área
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Versión
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {protocolos.map((protocolo) => {
              const versionActual = versiones[protocolo.id];
              return (
                <tr key={protocolo.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{protocolo.titulo}</div>
                    <div className="text-xs text-gray-500">Creado: {protocolo.createdAt.toLocaleDateString('es-ES')}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{protocolo.area}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                      {protocolo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {versionActual ? `v${versionActual.version}` : 'Sin versión'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/dashboard/protocolos/${protocolo.id}`} className="text-blue-600 hover:text-blue-800">
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
