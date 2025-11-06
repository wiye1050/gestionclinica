'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Protocolo, ProtocoloVersion, ProtocoloLectura } from '@/types';
import { registerReadingAction } from '../actions';

export default function ProtocoloDetallePage() {
  const params = useParams<{ id: string }>();
  const protocoloId = params?.id;
  const [protocolo, setProtocolo] = useState<Protocolo | null>(null);
  const [versiones, setVersiones] = useState<ProtocoloVersion[]>([]);
  const [lecturas, setLecturas] = useState<ProtocoloLectura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!protocoloId) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'protocolos', protocoloId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setProtocolo({
            id: snap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date()
          } as Protocolo);
        }

        const versionesSnap = await getDocs(
          query(
            collection(db, 'protocolos-versiones'),
            where('protocoloId', '==', protocoloId),
            orderBy('version', 'desc')
          )
        );
        const versionesData: ProtocoloVersion[] = versionesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date()
        })) as ProtocoloVersion[];
        setVersiones(versionesData);

        const lecturasSnap = await getDocs(
          query(
            collection(db, 'protocolos-lecturas'),
            where('protocoloId', '==', protocoloId),
            orderBy('leidoEn', 'desc')
          )
        );
        setLecturas(
          lecturasSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            leidoEn: doc.data().leidoEn?.toDate?.() ?? new Date()
          })) as ProtocoloLectura[]
        );
      } catch (err) {
        console.error('Error cargando protocolo', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [protocoloId]);

  if (loading) {
    return <div className="p-6 text-gray-600">Cargando información...</div>;
  }

  if (!protocolo) {
    return <div className="p-6 text-red-600">Protocolo no encontrado</div>;
  }

  const versionActual = versiones[0];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Protocolo</p>
          <h1 className="text-3xl font-bold text-gray-900">{protocolo.titulo}</h1>
          <p className="text-sm text-gray-500">Área: {protocolo.area}</p>
        </div>
        <Link
          href={`/dashboard/protocolos/${protocolo.id}/nueva-version`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Nueva versión
        </Link>
      </header>

      {versionActual ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Versión v{versionActual.version}</h2>
              <p className="text-sm text-gray-500">
                Publicada el {versionActual.createdAt.toLocaleDateString('es-ES')} por {versionActual.createdPor}
              </p>
            </div>
            <form action={registerReadingAction} className="flex items-center gap-2">
              <input type="hidden" name="protocoloId" value={protocolo.id} />
              <input type="hidden" name="version" value={versionActual.version} />
              <input type="hidden" name="checklistConfirmada" value="true" />
              <button className="rounded-lg border border-green-200 px-3 py-2 text-green-700 hover:bg-green-50">
                Confirmar lectura
              </button>
            </form>
          </div>
          <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: versionActual.contenido }} />
        </section>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Aún no hay versiones publicadas.
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Historial de versiones</h2>
        <ul className="mt-4 space-y-2">
          {versiones.map((version) => (
            <li key={version.id} className="flex items-center justify-between text-sm text-gray-600">
              <span>
                v{version.version} · {version.createdAt.toLocaleString('es-ES')} ·{' '}
                {version.aprobado ? 'Aprobado' : 'Pendiente'}
              </span>
              {version.anexos?.length ? (
                <span className="text-blue-600">
                  {version.anexos.length} anexo{version.anexos.length > 1 ? 's' : ''}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Lecturas recientes</h2>
        {lecturas.length === 0 ? (
          <p className="text-sm text-gray-500">Nadie ha registrado la lectura todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lecturas.map((lectura) => (
              <li key={lectura.id} className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {lectura.usuarioNombre ?? lectura.usuarioUid} · v{lectura.version} ·{' '}
                  {lectura.leidoEn.toLocaleString('es-ES')}
                </span>
                {typeof lectura.resultadoQuiz === 'number' && (
                  <span className="text-xs text-green-700">Quiz: {lectura.resultadoQuiz}%</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
