import { useQuery } from '@tanstack/react-query';
import { deserializeServiciosModule, type SerializedServiciosModule } from '@/lib/utils/servicios';
import type { CatalogoServicio, GrupoPaciente, Profesional, ServicioAsignado } from '@/types';

type ServiciosModule = {
  servicios: ServicioAsignado[];
  profesionales: Profesional[];
  grupos: GrupoPaciente[];
  catalogo: CatalogoServicio[];
};

export function useServiciosModule(options?: { initialData?: ServiciosModule }) {
  return useQuery<ServiciosModule>({
    queryKey: ['servicios-module'],
    queryFn: async () => {
      const response = await fetch('/api/servicios');
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudieron cargar los servicios';
        throw new Error(message);
      }
      return deserializeServiciosModule(payload as SerializedServiciosModule);
    },
    staleTime: 60 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}
