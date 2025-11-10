'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { actualizarEstadoMejoraAction, agregarEvidenciaAction } from '../actions';
import { Mejora, MejoraEvidencia } from '@/types';
import { FileUpload } from '@/components/ui/FileUpload';

const estadoOptions = [
  { value: 'idea', label: 'Idea' },
  { value: 'en-analisis', label: 'En análisis' },
  { value: 'planificada', label: 'Planificada' },
  { value: 'en-progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' }
];

export default function MejoraDetallePage() {
  const params = useParams<{ id: string }>();
  const mejoraId = params?.id;
  const [mejora, setMejora] = useState<Mejora | null>(null);
  const [evidencias, setEvidencias] = useState<MejoraEvidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [evidenciaUrl, setEvidenciaUrl] = useState('');

  useEffect(() => {
    if (!mejoraId) return;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'mejoras', mejoraId));
        if (snap.exists()) {
          const data = snap.data();
          setMejora({
            id: snap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date()
          } as Mejora);
        }

        const evidenciasSnap = await getDocs(
          query(
            collection(db, 'mejoras-evidencias'),
            where('mejoraId', '==', mejoraId),
            orderBy('createdAt', 'desc')
          )
        );
        setEvidencias(
          evidenciasSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() ?? new Date()
          })) as MejoraEvidencia[]
        );
      } catch (err) {
        console.error('Error al cargar la mejora', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mejoraId]);

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando mejora...</div>;
  }

  if (!mejora) {
    return <div className="p-6 text-red-600">Mejora no encontrada.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Mejora</p>
          <h1 className="text-3xl font-bold text-gray-900">{mejora.titulo}</h1>
          <p className="text-sm text-gray-500">Área: {mejora.area}</p>
        </div>
        <Link href="/dashboard/mejoras" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100">
          Volver a la lista
        </Link>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Detalle</h2>
            <p className="text-sm text-gray-500">Estado actual: {mejora.estado}</p>
          </div>
          <form action={actualizarEstadoMejoraAction} className="flex items-center gap-2">
            <input type="hidden" name="mejoraId" value={mejora.id} />
            <select name="estado" defaultValue={mejora.estado} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {estadoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="rounded-lg border border-blue-200 px-3 py-2 text-blue-600 hover:bg-blue-50 text-sm">
              Actualizar
            </button>
          </form>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-line">{mejora.descripcion}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-700">RICE</p>
            <ul className="mt-1 text-gray-600">
              <li>Reach: {mejora.rice.reach}</li>
              <li>Impact: {mejora.rice.impact}</li>
              <li>Confidence: {mejora.rice.confidence}%</li>
              <li>Effort: {mejora.rice.effort}</li>
              <li className="font-semibold text-gray-900">Score: {mejora.rice.score}</li>
            </ul>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-700">Responsable</p>
            <p className="text-gray-600 mt-1">{mejora.responsableNombre ?? 'No asignado'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Evidencias</h2>
        </div>
        
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Añadir evidencia</h3>
          <FileUpload
            folder="mejoras"
            onUpload={(url) => setEvidenciaUrl(url)}
            accept="image/*,application/pdf"
            maxSizeMB={10}
          />
          <form action={agregarEvidenciaAction} className="flex flex-wrap items-center gap-2 text-sm">
            <input type="hidden" name="mejoraId" value={mejora.id} />
            <input type="hidden" name="url" value={evidenciaUrl} />
            <select name="tipo" className="rounded-lg border border-gray-300 px-3 py-2">
              <option value="texto">Nota</option>
              <option value="enlace">Enlace</option>
              <option value="imagen">Imagen</option>
              <option value="documento">Documento</option>
            </select>
            <input name="descripcion" placeholder="Descripción" className="flex-1 rounded-lg border border-gray-300 px-3 py-2" />
            <button className="rounded-lg bg-green-600 px-4 py-2 text-text hover:bg-green-700">
              Añadir
            </button>
          </form>
        </div>
        
        {evidencias.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no se han añadido evidencias.</p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-600">
            {evidencias.map((ev) => (
              <li key={ev.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{ev.tipo}</span>
                  <span className="text-xs text-gray-400">{ev.createdAt.toLocaleString('es-ES')}</span>
                </div>
                {ev.descripcion && <p className="mt-1">{ev.descripcion}</p>}
                {ev.url && (
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Abrir recurso
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
