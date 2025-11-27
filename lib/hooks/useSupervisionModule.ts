import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deserializeSupervisionModule, type SerializedSupervisionModule } from '@/lib/utils/supervision';
import type { EvaluacionSesion, ServicioAsignado, Profesional, GrupoPaciente } from '@/types';

type SupervisionModule = {
  evaluaciones: EvaluacionSesion[];
  servicios: ServicioAsignado[];
  profesionales: Profesional[];
  grupos: GrupoPaciente[];
};

export function useSupervisionModule(options?: { initialData?: SupervisionModule }) {
  return useQuery<SupervisionModule>({
    queryKey: ['supervision-module'],
    queryFn: async () => {
      const response = await fetch('/api/supervision');
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudo cargar supervision';
        throw new Error(message);
      }
      return deserializeSupervisionModule(payload as SerializedSupervisionModule);
    },
    staleTime: 120 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

type CreateEvaluacionInput = Record<string, unknown>;

export function useCreateEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateEvaluacionInput) => {
      const response = await fetch('/api/supervision/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'No se pudo registrar la evaluación';
        throw new Error(message);
      }
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-module'] });
    },
  });
}
