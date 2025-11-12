import { Suspense } from 'react';
import { getEpisodesForKanban } from '@/lib/server/episodes';
import type { EpisodeWithPatient } from '@/types/episode';
import { CalendarDays } from 'lucide-react';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import EpisodiosKanbanClient from './EpisodiosKanbanClient';

async function loadEpisodes(): Promise<EpisodeWithPatient[]> {
  try {
    return await getEpisodesForKanban();
  } catch (error) {
    console.error('[episodios] No se pudieron cargar los episodios', error);
    return [];
  }
}

export default async function EpisodiosPage() {
  const episodes = await loadEpisodes();

  return (
    <div className="space-y-6">
      <header className="surface-card flex flex-col gap-4 rounded-2xl p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Pipeline clínico</p>
          <h1 className="text-3xl font-semibold text-gray-900">Episodios</h1>
          <p className="text-sm text-gray-600">
            Control visual de cada paciente según el estado en el que se encuentra.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          Última actualización {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(Date.now())}
        </div>
      </header>

      <Suspense fallback={<SkeletonLoader />}>
        <EpisodiosKanbanClient initialEpisodes={episodes} />
      </Suspense>
    </div>
  );
}
