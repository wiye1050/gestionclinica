import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SerializedDailyReport } from '@/lib/server/reports';

export type DailyReport = {
  id: string;
  tipo: SerializedDailyReport['tipo'];
  categoria: SerializedDailyReport['categoria'];
  prioridad: SerializedDailyReport['prioridad'];
  responsable: SerializedDailyReport['responsable'];
  descripcion: string;
  accionInmediata?: string;
  requiereSeguimiento: boolean;
  estado: SerializedDailyReport['estado'];
  reportadoPor: string;
  reportadoPorId: string;
  createdAt?: Date;
  updatedAt?: Date;
  fecha?: Date;
};

export const MAX_REPORTES_DEFAULT = 200;

const deserialize = (item: SerializedDailyReport): DailyReport => ({
  ...item,
  createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
  updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
  fecha: item.fecha ? new Date(item.fecha) : undefined,
});

type UseReportesOptions = {
  initialData?: SerializedDailyReport[];
  limit?: number;
};

export function useReportesDiarios(options?: UseReportesOptions) {
  const limit = options?.limit ?? MAX_REPORTES_DEFAULT;

  const fetchReportes = async (): Promise<DailyReport[]> => {
    const response = await fetch(`/api/reportes/diarios?limit=${encodeURIComponent(limit)}`);
    const payload = await response.json();
    if (!response.ok) {
      const message = typeof payload?.error === 'string' ? payload.error : 'No se pudieron cargar los reportes';
      throw new Error(message);
    }
    const items = Array.isArray(payload?.items)
      ? (payload.items as SerializedDailyReport[])
      : Array.isArray(payload)
      ? (payload as SerializedDailyReport[])
      : [];
    return items.map(deserialize);
  };

  const initial = options?.initialData ? options.initialData.map(deserialize) : undefined;

  return useQuery<DailyReport[]>({
    queryKey: ['reportes-diarios', limit],
    queryFn: fetchReportes,
    staleTime: 60 * 1000,
    initialData: initial,
    initialDataUpdatedAt: initial ? Date.now() : undefined,
  });
}

export function useInvalidateReportesDiarios(limit = MAX_REPORTES_DEFAULT) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['reportes-diarios', limit] });
}
