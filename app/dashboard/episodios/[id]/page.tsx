import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Activity, UserCircle, CalendarClock } from 'lucide-react';
import { getEpisodeById, getEpisodeEvents } from '@/lib/server/episodes';
import EpisodeTimelineClient from './EpisodeTimelineClient';

interface EpisodeTimelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function EpisodeTimelinePage({ params }: EpisodeTimelinePageProps) {
  const { id } = await params;
  const episode = await getEpisodeById(id);
  if (!episode) {
    notFound();
  }

  const events = await getEpisodeEvents(id, 400);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/episodios"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al kanban
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            <Activity className="h-3.5 w-3.5" />
            {episode.state}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase text-gray-500">Paciente</p>
            <p className="mt-1 flex items-center gap-2 text-base font-semibold text-gray-900">
              <UserCircle className="h-5 w-5 text-blue-500" />
              {episode.patient?.fullName ?? 'Sin nombre'}
            </p>
            <p className="text-xs text-gray-500">
              {episode.patient?.email ?? 'Sin email'} · {episode.patient?.phone ?? 'Sin teléfono'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase text-gray-500">Responsable</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {episode.ownerUserId ?? 'No asignado'}
            </p>
            <p className="text-xs text-gray-500">Motivo: {episode.reason ?? 'Sin motivo'}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase text-gray-500">Fechas</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
              <CalendarClock className="h-4 w-4 text-emerald-600" />
              Inicio:{' '}
              {new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(episode.startedAt)}
            </div>
            {episode.closedAt && (
              <div className="mt-1 text-sm text-gray-700">
                Cierre:{' '}
                {new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(episode.closedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      <EpisodeTimelineClient episode={episode} events={events} />
    </div>
  );
}
