'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paciente } from '@/types';

type ApiPaciente = Omit<Paciente, 'fechaNacimiento' | 'createdAt' | 'updatedAt'> & {
  fechaNacimiento?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const deserializePaciente = (raw: ApiPaciente): Paciente => ({
  ...raw,
  fechaNacimiento: raw.fechaNacimiento ? new Date(raw.fechaNacimiento) : new Date('1970-01-01'),
  createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
});

// Hook para obtener todos los pacientes con caché
type UsePacientesOptions = {
  initialData?: Paciente[];
  onMeta?: (meta: { nextCursor: string | null; limit: number }) => void;
};

export function usePacientes(
  filters?: { estado?: string; busqueda?: string; cursor?: string },
  options?: UsePacientesOptions
) {
  return useQuery({
    queryKey: ['pacientes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.estado) params.set('estado', filters.estado);
      if (filters?.busqueda) params.set('q', filters.busqueda);
      if (filters?.cursor) params.set('cursor', filters.cursor);
      const queryString = params.toString();
      const response = await fetch(queryString ? `/api/pacientes?${queryString}` : '/api/pacientes');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudieron cargar los pacientes');
      }

      const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
      const pacientes = (items as ApiPaciente[]).map(deserializePaciente);

      if (!Array.isArray(payload) && typeof payload === 'object' && payload !== null) {
        options?.onMeta?.({
          nextCursor: typeof payload.nextCursor === 'string' ? payload.nextCursor : null,
          limit: typeof payload.limit === 'number' ? payload.limit : pacientes.length,
        });
      }

      // Filtro adicional en cliente por si el backend no pudo aplicar el search
      if (filters?.busqueda) {
        const busqueda = filters.busqueda.toLowerCase();
        return pacientes.filter(
          (p) =>
            `${p.nombre} ${p.apellidos}`.toLowerCase().includes(busqueda) ||
            p.documentoId?.toLowerCase().includes(busqueda)
        );
      }

      return pacientes;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos - los pacientes no cambian tan rápido
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

// Hook para crear paciente con invalidación automática
export function useCreatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoPaciente: Omit<Paciente, 'id'>) => {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPaciente),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo crear el paciente');
      }
      return payload.id as string;
    },
    onSuccess: () => {
      // Invalidar y refetch automático
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });
}

// Hook para actualizar paciente
export function useUpdatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Paciente> }) => {
      const response = await fetch(`/api/pacientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el paciente');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });
}

// Hook para eliminar paciente
export function useDeletePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo eliminar el paciente');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });
}
