'use client';

import { useQuery } from '@tanstack/react-query';
import type { EpisodeState } from '@/types/constants';
import type { EpisodeWithPatient, CanonicalEvent } from '@/types/episode';

interface UseEpisodesOptions {
  state?: EpisodeState;
  limit?: number;
  initialData?: EpisodeWithPatient[];
}

const fetchEpisodes = async (state?: EpisodeState, limit?: number) => {
  const params = new URLSearchParams();
  if (state) params.set('state', state);
  if (limit) params.set('limit', String(limit));

  const response = await fetch(`/api/episodios?${params.toString()}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? 'No se pudo cargar episodios');
  }
  return (await response.json()) as EpisodeWithPatient[];
};

export function useEpisodesQuery(options?: UseEpisodesOptions) {
  const { state, limit, initialData } = options ?? {};
  return useQuery({
    queryKey: ['episodes', state, limit],
    queryFn: () => fetchEpisodes(state, limit),
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 60 * 1000,
  });
}

export function useEpisodeEvents(episodeId: string | null, options?: { enabled?: boolean }) {
  return useQuery<CanonicalEvent[]>({
    queryKey: ['episode-events', episodeId],
    enabled: Boolean(episodeId) && (options?.enabled ?? true),
    queryFn: async () => {
      if (!episodeId) return [];
      const response = await fetch(`/api/episodios/${episodeId}/events`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? 'No se pudieron cargar los eventos');
      }
      return (await response.json()) as CanonicalEvent[];
    },
    staleTime: 30 * 1000,
  });
}
