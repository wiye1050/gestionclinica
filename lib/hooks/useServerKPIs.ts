import { useQuery } from '@tanstack/react-query';
import type { KPIResponse } from '@/lib/server/kpis';

export function useServerKPIs(options?: { initialData?: KPIResponse }) {
  return useQuery<KPIResponse>({
    queryKey: ['server-kpis'],
    queryFn: async () => {
      const response = await fetch('/api/kpis');
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudieron cargar los KPIs';
        throw new Error(message);
      }
      return payload as KPIResponse;
    },
    staleTime: 5 * 60 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}
