import { useMutation } from '@tanstack/react-query';
import { useInvalidateReportesDiarios, MAX_REPORTES_DEFAULT } from '@/lib/hooks/useReportesDiarios';

type CreateInput = {
  tipo: string;
  categoria: string;
  prioridad: string;
  responsable: string;
  descripcion: string;
  accionInmediata?: string;
  requiereSeguimiento: boolean;
  fecha?: string;
  hora?: string;
};

type UpdateInput = {
  id: string;
  changes: Record<string, unknown>;
};

export function useCreateReporteDiario(limit = MAX_REPORTES_DEFAULT) {
  const invalidate = useInvalidateReportesDiarios(limit);
  return useMutation({
    mutationFn: async (body: CreateInput) => {
      const response = await fetch('/api/reportes/diarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudo crear el reporte';
        throw new Error(message);
      }
      return payload;
    },
    onSuccess: () => invalidate(),
  });
}

export function useUpdateReporteDiario(limit = MAX_REPORTES_DEFAULT) {
  const invalidate = useInvalidateReportesDiarios(limit);
  return useMutation({
    mutationFn: async ({ id, changes }: UpdateInput) => {
      const response = await fetch(`/api/reportes/diarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudo actualizar el reporte';
        throw new Error(message);
      }
      return payload;
    },
    onSuccess: () => invalidate(),
  });
}

export function useDeleteReporteDiario(limit = MAX_REPORTES_DEFAULT) {
  const invalidate = useInvalidateReportesDiarios(limit);
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reportes/diarios/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudo eliminar el reporte';
        throw new Error(message);
      }
      return payload;
    },
    onSuccess: () => invalidate(),
  });
}
