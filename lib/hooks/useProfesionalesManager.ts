import { useQuery } from '@tanstack/react-query';
import type { Profesional } from '@/types';
import { deserializeProfesionales, type ApiProfesional } from '@/lib/utils/profesionales';

const buildUrl = (limit: number) => `/api/profesionales?limit=${encodeURIComponent(limit)}`;

export function useProfesionalesManager(options?: { initialData?: Profesional[]; limit?: number }) {
  const limit = options?.limit ?? 400;

  return useQuery<Profesional[]>({
    queryKey: ['profesionales', limit],
    queryFn: async () => {
      const response = await fetch(buildUrl(limit));
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudieron cargar los profesionales';
        throw new Error(message);
      }
      const items = Array.isArray(payload?.items) ? (payload.items as ApiProfesional[]) : [];
      return deserializeProfesionales(items);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}
