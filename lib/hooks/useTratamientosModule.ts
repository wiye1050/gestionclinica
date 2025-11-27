import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deserializeTratamientosModule, type SerializedTratamientosModule, type TratamientosModule } from '@/lib/utils/tratamientos';

const QUERY_KEY = ['tratamientos-module'];

export function useTratamientosModule(options?: { initialData?: TratamientosModule }) {
  return useQuery<TratamientosModule>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch('/api/tratamientos');
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudieron cargar los tratamientos';
        throw new Error(message);
      }
      return deserializeTratamientosModule(payload as SerializedTratamientosModule);
    },
    staleTime: 60 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

export function useInvalidateTratamientosModule() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}
