'use client';

import { useMemo } from 'react';
import { Clock3 } from 'lucide-react';
import type { CanonicalEvent, EpisodeWithPatient } from '@/types/episode';
import { useEpisodeEvents } from '@/lib/hooks/useEpisodes';

interface EpisodeTimelineClientProps {
  episode: EpisodeWithPatient;
  events: CanonicalEvent[];
}

const formatDateTime = (timestamp?: number) =>
  timestamp
    ? new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(timestamp)
    : 'sin fecha';

export default function EpisodeTimelineClient({ episode, events }: EpisodeTimelineClientProps) {
  const { data = events, isFetching } = useEpisodeEvents(episode.id ?? null, { enabled: Boolean(episode.id) });
  const ordered = useMemo(() => {
    return [...data].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }, [data]);

  if (ordered.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Aún no hay eventos registrados para este episodio.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Historial del episodio</h2>
        {isFetching && <span className="text-xs text-gray-400">Actualizando…</span>}
      </div>
      <ol className="relative space-y-6 border-l border-gray-200">
        {ordered.map((event) => (
          <li key={event.id ?? `${event.type}-${event.timestamp}`} className="ml-4">
            <div className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border border-white bg-blue-500 shadow" />
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{event.type}</p>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Clock3 className="h-3.5 w-3.5 text-gray-400" />
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
              {event.meta && Object.keys(event.meta).length > 0 ? (
                <dl className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                  {Object.entries(event.meta).map(([key, value]) => (
                    <div key={key} className="flex flex-col rounded-lg bg-white/60 px-2 py-1">
                      <dt className="text-[11px] uppercase text-gray-400">{key}</dt>
                      <dd className="font-medium text-gray-800">
                        {typeof value === 'string' || typeof value === 'number'
                          ? value
                          : JSON.stringify(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Sin metadatos adicionales.</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
