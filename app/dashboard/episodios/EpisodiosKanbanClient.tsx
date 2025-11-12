'use client';

import { useMemo, useState } from 'react';
import { Search, Users2, AlertTriangle } from 'lucide-react';
import type { EpisodeWithPatient } from '@/types/episode';
import { EPISODE_STATES, EPISODE_STATE_LABELS } from '@/types/constants';
import KanbanBoard from '@/components/shared/KanbanBoard';
import { useEpisodesQuery } from '@/lib/hooks/useEpisodes';
import SkeletonLoader from '@/components/shared/SkeletonLoader';

interface EpisodiosKanbanClientProps {
  initialEpisodes: EpisodeWithPatient[];
}

const formatDate = (value?: number) =>
  value ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(value) : '—';

export default function EpisodiosKanbanClient({ initialEpisodes }: EpisodiosKanbanClientProps) {
  const [search, setSearch] = useState('');
  const [onlyRisk, setOnlyRisk] = useState(false);
  const { data: episodes = initialEpisodes, isLoading } = useEpisodesQuery({
    initialData: initialEpisodes,
  });

  const filteredEpisodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return episodes.filter((episode) => {
      const matchesSearch =
        term.length === 0 ||
        episode.patient?.fullName?.toLowerCase().includes(term) ||
        episode.reason?.toLowerCase().includes(term ?? '');
      const matchesRisk = !onlyRisk || (episode.riskFlags?.length ?? 0) > 0;
      return matchesSearch && matchesRisk;
    });
  }, [episodes, search, onlyRisk]);

  const columns = useMemo(() => {
    return EPISODE_STATES.map((state) => ({
      id: state,
      title: EPISODE_STATE_LABELS[state],
      items: filteredEpisodes.filter((episode) => episode.state === state),
    }));
  }, [filteredEpisodes]);

  if (isLoading && episodes.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por paciente, motivo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={onlyRisk}
              onChange={(event) => setOnlyRisk(event.target.checked)}
            />
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Sólo riesgo
            </span>
          </label>
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            <Users2 className="h-4 w-4 text-gray-500" />
            {filteredEpisodes.length} episodios
          </span>
        </div>
      </div>

      <KanbanBoard
        columns={columns}
        keyExtractor={(episode) => episode.id}
        renderCard={(episode) => (
          <article className="surface-card rounded-xl border border-gray-200 px-4 py-3 shadow-sm transition hover:border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                {episode.patient?.fullName ?? 'Paciente sin nombre'}
              </p>
              <span className="text-xs font-medium uppercase text-gray-500">
                {episode.state}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {episode.reason ?? 'Sin motivo registrado'}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>
                {episode.ownerUserId ? `Resp. ${episode.ownerUserId}` : 'Sin responsable'}
              </span>
              <span>{formatDate(episode.updatedAt)}</span>
            </div>
            {episode.riskFlags && episode.riskFlags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {episode.riskFlags.map((flag) => (
                  <span
                    key={flag}
                    className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </article>
        )}
        onDragEnd={(id, from, to) => {
          console.info('[episodios] movimiento manual', { id, from, to });
        }}
        emptyMessage="Sin episodios en este estado"
      />
    </div>
  );
}
